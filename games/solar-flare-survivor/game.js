// Simple top‑down shooter based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth;
  const HEIGHT = canvas.height = canvas.clientHeight;
  // starfield background
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, size: Math.random() * 2 + 0.5, brightness: Math.random() * 0.5 + 0.5 });
  }

  // ---- Game objects ----
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: 0.08,
    maxSpeed: 4,
  };

  const lasers = [];
  const asteroids = [];
  const flares = [];
  const thrustParticles = [];
  let score = 0;
  let gameOver = false;

  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', e => { keys[e.code] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  }
  function playLaser() { playTone(600, 0.07); }
  function playExplosion() { playTone(200, 0.2); }
  function playGameOver() { playTone(100, 0.5); }

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.5 + Math.random();
    const side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * HEIGHT; }
    else if (side === 1) { x = WIDTH; y = Math.random() * HEIGHT; }
    else if (side === 2) { x = Math.random() * WIDTH; y = 0; }
    else { x = Math.random() * WIDTH; y = HEIGHT; }
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: 15 + Math.random() * 20 });
  }

  function spawnFlare() {
    const x = Math.random() * WIDTH;
    const y = Math.random() * HEIGHT;
    const maxRadius = 80 + Math.random() * 40;
    const duration = 60; // frames
    flares.push({ x, y, radius: 0, maxRadius, age: 0, duration });
  }

  function fireLaser() {
    const lx = ship.x + Math.cos(ship.angle) * ship.radius;
    const ly = ship.y + Math.sin(ship.angle) * ship.radius;
    const speed = 6;
    lasers.push({ x: lx, y: ly, vx: Math.cos(ship.angle) * speed, vy: Math.sin(ship.angle) * speed, age: 0, ttl: 60 });
    playLaser();
  }

  let fireCooldown = 0;

  function update() {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // clamp speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > ship.maxSpeed) {
      ship.vx *= ship.maxSpeed / speed;
      ship.vy *= ship.maxSpeed / speed;
    }
    // Fire
    if (keys['Space'] && fireCooldown <= 0) { fireLaser(); fireCooldown = 15; }
    fireCooldown--;

    // Move ship
    ship.x = (ship.x + ship.vx + WIDTH) % WIDTH;
    ship.y = (ship.y + ship.vy + HEIGHT) % HEIGHT;

    // Update lasers
    for (let i = lasers.length - 1; i >= 0; i--) {
      const l = lasers[i];
      l.x = (l.x + l.vx + WIDTH) % WIDTH;
      l.y = (l.y + l.vy + HEIGHT) % HEIGHT;
      l.age++;
      if (l.age > l.ttl) lasers.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x = (a.x + a.vx + WIDTH) % WIDTH;
      a.y = (a.y + a.vy + HEIGHT) % HEIGHT;
    }

    // Update flares
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.age++;
      f.radius = (f.age / f.duration) * f.maxRadius;
      if (f.age > f.duration) flares.splice(i, 1);
    }

    // Collisions: laser vs asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      for (let j = lasers.length - 1; j >= 0; j--) {
        const l = lasers[j];
        const dx = a.x - l.x, dy = a.y - l.y;
        if (dx * dx + dy * dy < a.r * a.r) {
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          score += 10;
          playExplosion();
          break;
        }
      }
    }

    // Ship vs asteroid / flare
    let hit = false;
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.radius) ** 2) { hit = true; }
    }
    for (const f of flares) {
      const dx = f.x - ship.x, dy = f.y - ship.y;
      if (dx * dx + dy * dy < (f.radius) ** 2) { hit = true; }
    }
    if (hit && !gameOver) { gameOver = true; playGameOver(); }

    // Spawn timers
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.001) spawnFlare();
  }

  function draw() {
    // Clear with slight opacity for motion blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // flares
    ctx.globalCompositeOperation = 'lighter';
    for (const f of flares) {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
      grad.addColorStop(0, 'rgba(255,200,0,0.6)');
      grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroids
    ctx.fillStyle = '#777';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // lasers
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    for (const l of lasers) {
      ctx.beginPath();
      ctx.moveTo(l.x - l.vx * 2, l.y - l.vy * 2);
      ctx.lineTo(l.x, l.y);
      ctx.stroke();
    }
    // ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
