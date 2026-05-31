// Minimal Lava Runner game targeting canvas with id "game"
// Balloon ascends while lava rises; avoid lava and spikes.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playBeep(600, 0.1); }
  function playHit() { playBeep(200, 0.3); }
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth;
  const h = canvas.height = canvas.offsetHeight;

  // Balloon state
  const balloon = {
    x: w / 2,
    y: h - 60,
    r: 15,
    vx: 0,
    vy: 0,
    speed: 2,
    boost: -5,
    color: '#ff66aa'
  };

  // Lava state (rising from bottom)
  let lavaY = h; // top edge of lava
  const lavaSpeed = 0.5; // pixels per frame

  // Spikes (simple rectangles) generated periodically
  const spikes = [];
  // Particle trail for balloon
  const particles = [];
  const spikeInterval = 120; // frames
  let frameCount = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    // Add particle trail behind balloon
    particles.push({
      x: balloon.x,
      y: balloon.y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      alpha: 1
    });
    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
    // Move balloon based on input
    if (keys['ArrowLeft']) balloon.x -= balloon.speed;
    if (keys['ArrowRight']) balloon.x += balloon.speed;
    // Air boost with Space
    if (keys[' '] || keys['Spacebar']) {
      balloon.vy = balloon.boost;
      playBoost();
    }
    // Apply gravity
    balloon.vy += 0.1;
    balloon.y += balloon.vy;
    // Keep within horizontal bounds
    balloon.x = Math.max(balloon.r, Math.min(w - balloon.r, balloon.x));

    // Lava rises
    lavaY -= lavaSpeed;

    // Generate spikes
    if (frameCount % spikeInterval === 0) {
      const spike = {
        x: Math.random() * (w - 30) + 15,
        y: lavaY - 20,
        w: 20,
        h: 20
      };
      spikes.push(spike);
    }

    // Move spikes down with lava
    spikes.forEach(s => s.y += lavaSpeed);
    // Remove off-screen spikes
    while (spikes.length && spikes[0].y > h) spikes.shift();

    // Collision detection
    const hitLava = balloon.y + balloon.r > lavaY;
    const hitSpike = spikes.some(s =>
      balloon.x > s.x - balloon.r &&
      balloon.x < s.x + s.w + balloon.r &&
      balloon.y > s.y - balloon.r &&
      balloon.y < s.y + s.h + balloon.r
    );
    const outOfBounds = balloon.y - balloon.r > h || balloon.y + balloon.r < 0;
    if (hitLava || hitSpike || outOfBounds) {
      playHit();
      gameOver();
      return;
    }

    frameCount++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001d4a');
    bgGrad.addColorStop(1, '#003973');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // Clear the previous frame (background already drawn)
    // Draw lava with gradient
    const lavaGrad = ctx.createLinearGradient(0, lavaY, 0, h);
    lavaGrad.addColorStop(0, '#ff4500');
    lavaGrad.addColorStop(1, '#b22222');
    ctx.fillStyle = lavaGrad;
    ctx.fillRect(0, lavaY, w, h - lavaY);
    // Draw spikes
    ctx.fillStyle = '#555';
    spikes.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.w / 2, s.y + s.h);
      ctx.lineTo(s.x - s.w / 2, s.y + s.h);
      ctx.closePath();
      ctx.fill();
    });
    // Draw particles (fading trail)
    particles.forEach(p => {
      const particleGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 2);
      particleGrad.addColorStop(0, 'rgba(255,255,255,'+p.alpha+')');
      particleGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = particleGrad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
    });
    // Draw balloon with radial gradient
    const grad = ctx.createRadialGradient(balloon.x, balloon.y, balloon.r*0.2, balloon.x, balloon.y, balloon.r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, balloon.color);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(balloon.x, balloon.y, balloon.r, 0, Math.PI * 2);
    ctx.fill();
    // Draw score (distance traveled)
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    const score = Math.max(0, Math.round((h - lavaY)));
    ctx.fillText('Score: ' + score, 10, 20);
  }

  let rafId;
  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function gameOver() {
    cancelAnimationFrame(rafId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', w / 2, h / 2 - 10);
    ctx.fillText('Score: ' + Math.round((h - lavaY)), w / 2, h / 2 + 20);
  }

  // Start the game loop
  loop();
})();
