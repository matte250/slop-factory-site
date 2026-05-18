// Enhanced endless runner: richer graphics, starfield, gradients, and sound effects
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Game objects
  const ship = { x: 80, y: H / 2, w: 30, h: 15, dy: 0 };
  const asteroids = [];
  const orbs = [];
  const stars = [];
  const particles = [];
  let health = 5, score = 0, frame = 0, running = true;
  const keys = {};

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context resumes after first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, duration, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  function playThrust() { playTone(400, 80); }
  function playCollision() { playTone(150, 200, 'triangle'); }
  function playCollect() { playTone(800, 120, 'sawtooth'); }
  function playGameOver() { playTone(100, 500, 'sine'); }

  // Input handling
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play thrust sound on up/down press
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') playThrust();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Populate static starfield (100 tiny stars)
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5, speed: 0.5 + Math.random() * 0.5 });
  }

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: W + size, y: Math.random() * (H - size), r: size / 2, speed: 2 + Math.random() * 2 });
  }
  function spawnOrb() {
    const r = 8;
    orbs.push({ x: W + r, y: Math.random() * (H - r * 2), r, speed: 3 });
  }
  function addParticle(x, y) {
    particles.push({ x, y, life: 20, dx: -1 + Math.random() * 2, dy: -1 + Math.random() * 2 });
  }

  function update() {
    // Ship movement
    if (keys['ArrowUp'] || keys['w']) ship.dy = -4;
    else if (keys['ArrowDown'] || keys['s']) ship.dy = 4;
    else ship.dy = 0;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.dy));
    // Trail particles
    addParticle(ship.x, ship.y + ship.h / 2);

    // Starfield movement
    stars.forEach(s => { s.x -= s.speed; if (s.x < 0) s.x = W; });

    // Spawn obstacles
    if (frame % 80 === 0) spawnAsteroid();
    if (frame % 150 === 0) spawnOrb();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      const cx = a.x, cy = a.y + a.r;
      if (cx + a.r > ship.x && cx - a.r < ship.x + ship.w && cy + a.r > ship.y && cy - a.r < ship.y + ship.h) {
        health--; playCollision();
        asteroids.splice(i, 1);
        if (health <= 0) { running = false; playGameOver(); }
        continue;
      }
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.x -= o.speed;
      if (o.x + o.r > ship.x && o.x - o.r < ship.x + ship.w && o.y + o.r > ship.y && o.y - o.r < ship.y + ship.h) {
        score += 10; playCollect();
        orbs.splice(i, 1);
        continue;
      }
      if (o.x + o.r < 0) orbs.splice(i, 1);
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx; p.y += p.dy; p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    frame++;
  }

  function draw() {
    // Background gradient (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    // Ship with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#3ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y + a.r, a.r * 0.2, a.x, a.y + a.r, a.r);
      grad.addColorStop(0, '#c88');
      grad.addColorStop(1, '#422');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Orbs with glow
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Particles (trail)
    ctx.fillStyle = 'rgba(0,255,255,0.6)';
    particles.forEach(p => { ctx.fillRect(p.x, p.y, 2, 2); });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + health, 10, 20);
    ctx.fillText('Score: ' + score, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    update(); draw(); requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loop);
  } else { loop(); }
})();
