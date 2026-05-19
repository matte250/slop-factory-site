// Game based on IDEA.md – Asteroid Sprint
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  // ----- starfield -----
  const starCount = 120;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 30 + 20 // pixels per second
    });
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);
  // ----- audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playThrust = () => playBeep(300, 0.08);
  const playCrash = () => playBeep(80, 0.4);
  const playFuel = () => playBeep(600, 0.12);

  // ----- utilities -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- entities -----
  const ship = {
    x: 80,
    y: height / 2,
    radius: 12,
    vy: 0,
    thrust: -300,
    gravity: 400,
    update(dt) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      // keep inside canvas
      if (this.y > height - this.radius) { this.y = height - this.radius; this.vy = 0; }
      if (this.y < this.radius) { this.y = this.radius; this.vy = 0; }
    },
    draw() {
      // ship body with gradient fill
      const grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.beginPath();
      ctx.moveTo(-this.radius, this.radius);
      ctx.lineTo(this.radius, 0);
      ctx.lineTo(-this.radius, -this.radius);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      // thrust flame when accelerating upward
      if (this.vy < 0) {
        ctx.beginPath();
        ctx.moveTo(-this.radius * 0.5, this.radius);
        ctx.lineTo(0, this.radius + Math.abs(this.vy) * 0.02);
        ctx.lineTo(this.radius * 0.5, this.radius);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255,165,0,0.8)';
        ctx.fill();
      }
      ctx.restore();
    },
    thrustUp() { this.vy = this.thrust; playThrust(); }
  };

  const asteroids = [];
  const fuels = [];

  const spawnAsteroid = () => {
    const size = rand(10, 30);
    asteroids.push({
      x: width + size,
      y: rand(size, height - size),
      r: size,
      vx: rand(-200, -120)
    });
  };

  const spawnFuel = () => {
    const size = 8;
    fuels.push({
      x: width + size,
      y: rand(size, height - size),
      r: size,
      vx: -150,
      collected: false
    });
  };

  let lastTime = 0;
  let asteroidTimer = 0;
  let fuelTimer = 0;
  let elapsed = 0;
  let running = true;

  const update = (dt) => {
    // move stars for parallax effect
    stars.forEach(s => {
      s.x -= s.speed * dt;
      if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
    });
    elapsed += dt;
    ship.update(dt);
    // move asteroids
    asteroids.forEach(a => a.x += a.vx * dt);
    // remove off‑screen
    while (asteroids.length && asteroids[0].x < -asteroids[0].r) asteroids.shift();
    // spawn logic
    asteroidTimer += dt;
    if (asteroidTimer > 0.8) { spawnAsteroid(); asteroidTimer = 0; }
    // fuel
    fuelTimer += dt;
    if (fuelTimer > 5) { spawnFuel(); fuelTimer = 0; }
    fuels.forEach(f => f.x += f.vx * dt);
    while (fuels.length && fuels[0].x < -fuels[0].r) fuels.shift();
    // collisions
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.r) { running = false; playCrash(); break; }
    }
    for (const f of fuels) {
if (!f.collected && dist(ship, f) < ship.radius + f.r) {
          f.collected = true;
          playFuel();
          // extend timer by 2 seconds (optional win condition)
          elapsed -= 2;
        }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // gradient night sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001');
    skyGrad.addColorStop(1, '#000');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);
    // draw moving stars
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship & obstacles
    ship.draw();
    ctx.fillStyle = '#f44';
    asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      if (!f.collected) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); }
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, 20, 30);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = (timestamp) => {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  };

  // input
  const onThrust = () => { if (running) ship.thrustUp(); };
  window.addEventListener('keydown', e => { if (e.code === 'Space') onThrust(); });
  canvas.addEventListener('mousedown', onThrust);

  requestAnimationFrame(loop);
})();
