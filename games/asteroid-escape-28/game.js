// Minimal asteroid‑escape game targeting <canvas id="game">

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth;
  const H = canvas.height = canvas.offsetHeight;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.05);
  const playCollect = () => playTone(800, 0.07);
  const playExplosion = () => playTone(100, 0.3);

  // ----- Utility -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Game objects -----
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 8,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    maxSpeed: 4,
    fuel: 100,
    fuelRate: 0.02, // per frame when thrusting
  };

  const asteroids = [];
  const fuels = [];
  // starfield for background
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      r: rand(0.5, 1.5),
    });
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.key.toLowerCase()] = true;
});
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // ----- Game loop -----
  let lastSpawn = 0, lastFuel = 0, gameOver = false;

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4)); // 0:left 1:top 2:right 3:bottom
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    const r = rand(12, 24);
    switch (side) {
      case 0: x = -r; y = rand(0, H); vx = speed; vy = rand(-1, 1); break;
      case 1: x = rand(0, W); y = -r; vx = rand(-1, 1); vy = speed; break;
      case 2: x = W + r; y = rand(0, H); vx = -speed; vy = rand(-1, 1); break;
      case 3: x = rand(0, W); y = H + r; vx = rand(-1, 1); vy = -speed; break;
    }
    asteroids.push({x, y, vx, vy, r});
  }

  function spawnFuel() {
    const r = 6;
    const x = rand(r, W - r);
    const y = rand(r, H - r);
    fuels.push({x, y, r, value: 20});
  }

  function update(dt) {
    // Thrust handling (WASD)
    const thrust = 0.1;
    let thrusting = false;
    if (keys['w']) { ship.ay -= thrust; thrusting = true; }
    if (keys['s']) { ship.ay += thrust; thrusting = true; }
    if (keys['a']) { ship.ax -= thrust; thrusting = true; }
    if (keys['d']) { ship.ax += thrust; thrusting = true; }
    if (thrusting && ship.fuel > 0) {
      ship.fuel = Math.max(0, ship.fuel - ship.fuelRate);
      playThrust();
    }

    // Apply acceleration, limit speed
    ship.vx += ship.ax; ship.vy += ship.ay;
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > ship.maxSpeed) {
      ship.vx *= ship.maxSpeed / speed;
      ship.vy *= ship.maxSpeed / speed;
    }
    ship.x += ship.vx; ship.y += ship.vy;
    // Reset acceleration each frame
    ship.ax = ship.ay = 0;
    // Keep ship inside bounds (wrap)
    if (ship.x < -ship.r) ship.x = W + ship.r;
    if (ship.x > W + ship.r) ship.x = -ship.r;
    if (ship.y < -ship.r) ship.y = H + ship.r;
    if (ship.y > H + ship.r) ship.y = -ship.r;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // remove off‑screen
      if (a.x < -a.r || a.x > W + a.r || a.y < -a.r || a.y > H + a.r) asteroids.splice(i, 1);
    }

    // Collision ship‑asteroid
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) { gameOver = true; playExplosion(); }
    }

    // Fuel collection
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist(ship, f) < ship.r + f.r) {
        ship.fuel = Math.min(100, ship.fuel + f.value);
        fuels.splice(i, 1);
        playCollect();
      }
    }

    // Fuel depletion over time (when not thrusting)
    if (!thrusting && ship.fuel > 0) ship.fuel = Math.max(0, ship.fuel - 0.005);

    // Lose when out of fuel
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // clear & dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle pointing direction) with slight glow
    ctx.save();
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#0ff';
    const angle = Math.atan2(ship.vy, ship.vx) || 0;
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r/2);
    ctx.lineTo(-ship.r, -ship.r/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with radial shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel cells with glow
    for (const f of fuels) {
      ctx.save();
      ctx.shadowColor = 'yellow';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Fuel gauge border
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, 10, 100, 10);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel, 10);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop(timestamp) {
    if (!lastFrame) lastFrame = timestamp;
    const dt = timestamp - lastFrame;
    lastFrame = timestamp;
    if (!gameOver) {
      // spawn asteroids every ~1.5 s
      if (timestamp - lastSpawn > 1500) { spawnAsteroid(); lastSpawn = timestamp; }
      // spawn fuel cells every ~5 s
      if (timestamp - lastFuel > 5000) { spawnFuel(); lastFuel = timestamp; }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame = 0;
  requestAnimationFrame(loop);
})();
