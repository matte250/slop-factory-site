// Neon Runner game implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type='sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { playTone(150, 0.3, 'square'); }
  function playPowerUp() { playTone(600, 0.2, 'triangle'); }
  function playEngine() {
    // Simple low hum loop
    const freq = 80;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0005, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, audioCtx.currentTime + 0.1);
    osc.start();
    // keep reference to stop later if needed
    audioCtx.engineOsc = osc;
    audioCtx.engineGain = gain;
  }
  // Start engine sound
  playEngine();

  // Game state
  let ship = {
    x: width * 0.1,
    y: height / 2,
    radius: 15,
    color: '#0ff',
    fuel: 100,
    speedY: 0,
  };
  const obstacles = [];
  const powerUps = [];
  let lastObstacle = 0;
  let lastPowerUp = 0;
  let gameOver = false;

  // Input handling (vertical movement)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    obstacles.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      color: '#f0f',
    });
  }

  function spawnPowerUp() {
    const size = 20;
    powerUps.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      color: '#ff0',
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship controls
    if (keys.ArrowUp) ship.speedY = -200;
    else if (keys.ArrowDown) ship.speedY = 200;
    else ship.speedY = 0;
    ship.y += ship.speedY * dt;
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));
    // Fuel consumption
    ship.fuel -= dt * 5;
    if (ship.fuel <= 0) gameOver = true;
    // Spawn obstacles/power‑ups
    if (performance.now() - lastObstacle > 1500) { spawnObstacle(); lastObstacle = performance.now(); }
    if (performance.now() - lastPowerUp > 5000) { spawnPowerUp(); lastPowerUp = performance.now(); }
    // Move obstacles/power‑ups leftward
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 300 * dt;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.x -= 300 * dt;
      if (p.x + p.w < 0) powerUps.splice(i, 1);
    }
    // Collision detection
    for (const o of obstacles) {
      if (ship.x + ship.radius > o.x && ship.x - ship.radius < o.x + o.w &&
          ship.y + ship.radius > o.y && ship.y - ship.radius < o.y + o.h) {
        gameOver = true;
        playCollision();
        }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (ship.x + ship.radius > p.x && ship.x - ship.radius < p.x + p.w &&
          ship.y + ship.radius > p.y && ship.y - ship.radius < p.y + p.h) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        powerUps.splice(i, 1);
        playPowerUp();
      }
    }
  }

  function draw() {
    // Background gradient (deep space) and starfield
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars (generated once)
    if (!draw.stars) {
      draw.stars = [];
      for (let i = 0; i < 100; i++) {
        draw.stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    for (const s of draw.stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship with neon glow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = ship.color;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Draw obstacles with gradient and glow
    for (const o of obstacles) {
      const grad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#a0a');
      ctx.fillStyle = grad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f0f';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // Draw power‑ups with pulsing neon
    const now = performance.now() / 1000;
    for (const p of powerUps) {
      const pulse = (Math.sin(now * 4) + 1) / 2; // 0‑1
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.6 + 0.4 * pulse;
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.globalAlpha = 1;
    // Fuel meter
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
