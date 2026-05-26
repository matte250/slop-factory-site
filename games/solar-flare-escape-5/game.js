// Simple endless‑runner space game based on IDEA.md
(() => {
  // ---- Visual enhancements ----
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      vx: -0.5 - Math.random() * 0.5,
    });
  }

  const particles = [];
  function addThrustParticle() {
    particles.push({
      x: ship.x - Math.cos(ship.angle) * ship.r,
      y: ship.y - Math.sin(ship.angle) * ship.r,
      vx: -Math.cos(ship.angle) * (2 + Math.random()),
      vy: -Math.sin(ship.angle) * (2 + Math.random()),
      life: 30,
    });
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);

  // ---- Audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.05); }
  function playCollision() { playTone(80, 0.3); }
  function playPickup() { playTone(600, 0.15); }
  let thrustKeyDown = false;

  // ---- Ship ----
  const ship = {
    x: W * 0.1,
    y: H / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    turnSpeed: 0.07,
    fuel: 100,
  };

  // ---- Game objects ----
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastFuel = 0;
  let gameOver = false;

  // ---- Input ----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp' && !thrustKeyDown) {
      playThrust();
      thrustKeyDown = true;
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp') thrustKeyDown = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: W + size,
      y: Math.random() * H,
      r: size,
      vx: - (Math.random() * 2 + 1),
    });
  }

  function spawnFuel() {
    const r = 8;
    fuels.push({
      x: W + r,
      y: Math.random() * H,
      r,
      vx: -2,
    });
  }

  function update(dt) {
    // Update background stars
    stars.forEach(s => {
      s.x += s.vx;
      if (s.x < 0) s.x = window.innerWidth;
    });
    // Update thrust particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    if (gameOver) return;
    // Controls
    if (keys.ArrowLeft) ship.angle -= ship.turnSpeed;
    if (keys.ArrowRight) ship.angle += ship.turnSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel = Math.max(ship.fuel - 0.1, 0);
      addThrustParticle();
    }

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // keep inside bounds
    ship.y = Math.max(0, Math.min(H, ship.y));
    ship.x = Math.max(0, Math.min(W, ship.x));

    // Spawn asteroids & fuel
    if (performance.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastFuel > 3000) { spawnFuel(); lastFuel = performance.now(); }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // collision with ship
      const d = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (d < a.r + ship.r) { playCollision(); gameOver = true; }
    }

    // Update fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x += f.vx;
      if (f.x + f.r < 0) fuels.splice(i, 1);
      const d = Math.hypot(f.x - ship.x, f.y - ship.y);
if (d < f.r + ship.r) {
          ship.fuel = Math.min(ship.fuel + 30, 100);
          fuels.splice(i, 1);
          playPickup();
        }
    }

    // Score & lose condition
    score += dt * 0.01;
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, W, 0);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // draw star field background
    ctx.fillStyle = '#111';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship with gradient
    const shipGrad = ctx.createRadialGradient(0, 0, ship.r * 0.2, 0, 0, ship.r);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#006');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuel pickups with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // thrust particles
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
