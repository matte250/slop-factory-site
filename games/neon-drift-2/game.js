// Minimal Neon Drift game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.width = canvas.clientWidth * dpr;
  const H = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playTone(freq, dur, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function startBackground() {
    // simple looping background tone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 30;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    // store to stop later if needed
    backgroundOsc = osc;
  }
  let backgroundOsc = null;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      startBackground();
      audioStarted = true;
    }
  }

  // Ship properties
  const ship = { w: 30, h: 20, x: W / 2, y: H - 40, speed: 4 };

  // Game state
  let obstacles = [];
  let orbs = [];
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 0.5 });
  }
  let speed = 2; // scroll speed
  let score = 0;
  let running = true;
  let frame = 0;

  // Input handling
  const keys = { left: false, right: false };
  document.addEventListener('keydown', e => {
    ensureAudio();
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  function spawnObstacle() {
    const w = 40 + Math.random() * 60;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (W - w);
    obstacles.push({ x, y: -h, w, h });
  }
  function spawnOrb() {
    const r = 8;
    const x = Math.random() * (W - r * 2) + r;
    orbs.push({ x, y: -r, r });
  }

  function update() {
    if (!running) return;
    // Move ship
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Add obstacles/orbs periodically
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnOrb();

    // Move obstacles and check collisions
    obstacles.forEach(o => o.y += speed);
    obstacles = obstacles.filter(o => o.y < H);
    obstacles.forEach(o => {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
          playTone(200, 0.3, 'sawtooth'); // collision sound
          running = false; // collision -> game over
      }
    });

    // Move orbs, collect them
    orbs.forEach(o => o.y += speed);
    orbs = orbs.filter(o => o.y < H);
    orbs = orbs.filter(o => {
      const dx = ship.x + ship.w / 2 - o.x;
      const dy = ship.y + ship.h / 2 - o.y;
      const dist = Math.hypot(dx, dy);
        if (dist < o.r + Math.max(ship.w, ship.h) / 2) {
          score++;
          speed += 0.02; // increase scroll speed
          playTone(600, 0.08, 'triangle'); // orb collect sound
          return false; // collect
        }
      return true;
    });

    frame++;
  }

  function draw() {
    // Clear with neon gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#12002b');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Draw starfield
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 2;
    ctx.shadowColor = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Reset glow settings for neon objects
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0ff';

    // Draw ship (neon triangle with gradient glow)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw obstacles (neon bars with gradient)
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#ff00ff');
      grad.addColorStop(1, '#800080');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Draw orbs (glowing circles with radial gradient)
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#ffff80');
      grad.addColorStop(1, '#ffaa00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
