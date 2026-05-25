// Astro Dodge – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.08); }
  function playExplosion() { playTone(200, 0.2); }
  // Set canvas size (fill parent)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  // Starfield
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 0.5 });
  }
  // Particles for explosion effect
  const particles = [];
  function spawnParticle(x, y) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30 });
    }
  }
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    angle: 0,
    speed: 0,
    maxSpeed: 3,
    health: 5,
    color: '#0ff',
  };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  const orbs = [];
  const asteroids = [];
  let collected = 0;
  const WIN_COUNT = 50;
  let gameOver = false;
  let win = false;

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnOrb() {
    const r = 8;
    const x = rand(r, canvas.width - r);
    const y = rand(r, canvas.height - r);
    orbs.push({ x, y, r });
  }
  function spawnAsteroid() {
    const r = rand(10, 20);
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -r : canvas.width + r;
    const y = rand(r, canvas.height - r);
    const vx = side === 'left' ? rand(1, 2) : -rand(1, 2);
    const vy = rand(-0.5, 0.5);
    asteroids.push({ x, y, r, vx, vy });
  }
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  // ----- Input -----
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Main loop -----
  function update() {
    if (gameOver) return;
    // Ship movement
    let dx = 0, dy = 0;
    if (keys.ArrowUp || keys.w) dy -= 1;
    if (keys.ArrowDown || keys.s) dy += 1;
    if (keys.ArrowLeft || keys.a) dx -= 1;
    if (keys.ArrowRight || keys.d) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len; // normalize
      ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x + dx * ship.maxSpeed));
      ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y + dy * ship.maxSpeed));
      ship.angle = Math.atan2(dy, dx);
    }

    // Spawn orbs/asteroids gradually
    if (orbs.length < 5 && Math.random() < 0.02) spawnOrb();
    if (asteroids.length < 7 && Math.random() < 0.01) spawnAsteroid();

    // Check collisions with orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (distance(ship.x, ship.y, o.x, o.y) < ship.radius + o.r) {
        orbs.splice(i, 1);
        collected++; playCollect();
        if (collected >= WIN_COUNT) { win = true; gameOver = true; }
      }
    }

    // Update asteroids and check collisions
    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) { particles.splice(i, 1); }
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // Remove when off‑screen
      if (a.x < -a.r || a.x > canvas.width + a.r) { asteroids.splice(i, 1); continue; }
      if (distance(ship.x, ship.y, a.x, a.y) < ship.radius + a.r) {
          spawnParticle(a.x, a.y);
        asteroids.splice(i, 1);
        ship.health -= 1;
        if (ship.health <= 0) { gameOver = true; }
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = '#555';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); });
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    ctx.fillStyle = '#555';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill(); });
    // Draw particles (explosions)
    ctx.fillStyle = 'rgba(255,165,0,0.8)'; // orange fire
    particles.forEach(p => {
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Draw ship (triangle pointing direction)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo( ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius/2);
    ctx.lineTo(-ship.radius, -ship.radius/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Orbs with glow
    const orbGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
    orbGrad.addColorStop(0, '#ff0');
    orbGrad.addColorStop(1, '#aa5500');
    orbs.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(0, 0, o.r + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Asteroids
    ctx.fillStyle = '#777';
    asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI*2); ctx.fill(); });
    // UI – health & score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Health: ${ship.health}`, 10, 20);
    ctx.fillText(`Orbs: ${collected}/${WIN_COUNT}`, 10, 40);
    // End messages
    if (gameOver) {
      ctx.fillStyle = win ? '#0f0' : '#f00';
      ctx.font = '48px sans-serif';
      const msg = win ? 'You Win!' : 'Game Over';
      const metrics = ctx.measureText(msg);
      ctx.fillText(msg, (canvas.width - metrics.width) / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Kick off
  requestAnimationFrame(loop);
})();
