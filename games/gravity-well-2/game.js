// Simple Gravity‑Well game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple tone player
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);

  // Dot that auto‑advances
  const dot = { x: 50, y: h / 2, r: 5, speed: 2 };

  // Obstacles – random circles
  const obstacles = [];
  // starfield for background
  const stars = [];
  const STAR_COUNT = 120;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h, twinkle: Math.random() });
  }
  const OB_COUNT = 30;
  for (let i = 0; i < OB_COUNT; i++) {
    obstacles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 8 + Math.random() * 12,
      vx: 0,
      vy: 0,
    });
  }

  // Gravity wells created on tap/click
  const wells = [];
  const WELL_RADIUS = 80;
  const WELL_DURATION = 500; // ms
  const WELL_STRENGTH = 0.5;

  canvas.addEventListener('pointerdown', (e) => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play well creation sound
    playTone(300, 'triangle', 0.2);
    const rect = canvas.getBoundingClientRect();
    wells.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      start: performance.now(),
    });
  });

  function update(dt) {
    // Move dot forward
    dot.x += dot.speed;
    if (dot.x - dot.r > w) dot.x = -dot.r; // wrap

    // Update wells – remove expired
    const now = performance.now();
    for (let i = wells.length - 1; i >= 0; i--) {
      if (now - wells[i].start > WELL_DURATION) wells.splice(i, 1);
    }

    // Apply gravity to obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      // reset velocity each frame
      ob.vx = ob.vy = 0;
      for (const well of wells) {
        const dx = well.x - ob.x;
        const dy = well.y - ob.y;
        const dist2 = dx * dx + dy * dy;
        const rad2 = WELL_RADIUS * WELL_RADIUS;
        if (dist2 < rad2) {
          const dist = Math.sqrt(dist2) || 1;
          const pull = (WELL_STRENGTH * (rad2 - dist2)) / rad2;
          ob.vx += (dx / dist) * pull;
          ob.vy += (dy / dist) * pull;
        }
      }
      // Apply velocity
      ob.x += ob.vx * dt;
      ob.y += ob.vy * dt;

      // Collision with dot
      const dxDot = dot.x - ob.x;
      const dyDot = dot.y - ob.y;
      const radSum = dot.r + ob.r;
      if (dxDot * dxDot + dyDot * dyDot < radSum * radSum) {
        // play hit sound
        playTone(600, 'sawtooth', 0.1);
        // remove obstacle
        obstacles.splice(i, 1);
      }
    }
  }


  function draw() {
    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#001020');
    bg.addColorStop(1, '#001540');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Fade previous frame for motion trails (draw over gradient)
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, w, h);

    // Starfield background
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.fillRect(star.x, star.y, 1, 1);
    }
    // Fade previous frame for motion trails
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, w, h);

    // Starfield background
    ctx.fillStyle = '#fff';
    for (const star of stars) {
      ctx.fillRect(star.x, star.y, 1, 1);
    }
    // canvas is cleared by semi‑transparent fill for trail effect
    // Draw obstacles
    ctx.fillStyle = '#555';
    for (const ob of obstacles) {
      ctx.beginPath();
      ctx.arc(ob.x, ob.y, ob.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Draw dot
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, 2 * Math.PI);
    ctx.fill();
    // Draw active wells (optional visual cue)
    ctx.strokeStyle = 'rgba(0,0,255,0.5)';
    for (const well of wells) {
      ctx.beginPath();
      ctx.arc(well.x, well.y, WELL_RADIUS, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 16; // normalise to ~60fps units
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
