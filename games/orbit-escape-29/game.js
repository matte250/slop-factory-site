// Minimalist Orbit Escape game
// Targets canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  const center = { x: width / 2, y: height / 2 };

  // simple sound manager using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust() { beep(300, 0.05); }
  function playCollision() { beep(120, 0.3); }
  function playFuel() { beep(800, 0.1); }
  function playGameOver() { beep(60, 0.5); }

  // Game state
  let ship = {
    angle: 0, // radians
    radius: 80,
    size: 8,
    fuel: 100,
    speed: 0.02, // rotation per frame
  };
  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!audioStarted) { audioCtx.resume().then(() => { audioStarted = true; }); }
    if (e.key === 'ArrowUp') playThrust();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = ship.radius + (Math.random() * 40 - 20);
    const speed = (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
    asteroids.push({ angle, radius, speed, size: 12 + Math.random() * 8 });
  }

  function spawnFuel() {
    const angle = Math.random() * Math.PI * 2;
    const radius = ship.radius + (Math.random() * 60 - 30);
    fuels.push({ angle, radius, size: 6, collected: false });
  }

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  for (let i = 0; i < 3; i++) spawnFuel();

  function update(dt) {
    if (gameOver) return;
    // ship controls
    if (keys.ArrowUp) ship.radius = Math.max(30, ship.radius - 0.05 * dt);
    if (keys.ArrowDown) ship.radius = Math.min(Math.min(width, height) / 2 - 20, ship.radius + 0.05 * dt);
    if (keys.ArrowLeft) ship.angle -= ship.speed * dt;
    if (keys.ArrowRight) ship.angle += ship.speed * dt;

    // fuel consumption
    ship.fuel -= dt * 0.01; // consume over time
    if (ship.fuel <= 0) { playGameOver(); gameOver = true; }

    // update asteroids
    asteroids.forEach(a => {
      a.angle += a.speed * dt;
    });
    // spawn new asteroids occasionally
    if (Math.random() < dt * 0.0005) spawnAsteroid();

    // update fuels (rotate with same speed as ship for simplicity)
    fuels.forEach(f => {
      f.angle += 0.0005 * dt;
    });
    if (Math.random() < dt * 0.0003) spawnFuel();

    // collision detection
    const shipX = center.x + Math.cos(ship.angle) * ship.radius;
    const shipY = center.y + Math.sin(ship.angle) * ship.radius;
    // asteroids
    for (const a of asteroids) {
      const ax = center.x + Math.cos(a.angle) * a.radius;
      const ay = center.y + Math.sin(a.angle) * a.radius;
      const dx = shipX - ax, dy = shipY - ay;
      if (Math.hypot(dx, dy) < ship.size + a.size) {
        playCollision();
        gameOver = true;
        break;
      }
    }
    // fuel pickups
    for (const f of fuels) {
      if (f.collected) continue;
      const fx = center.x + Math.cos(f.angle) * f.radius;
      const fy = center.y + Math.sin(f.angle) * f.radius;
      const dx = shipX - fx, dy = shipY - fy;
if (Math.hypot(dx, dy) < ship.size + f.size) {
          f.collected = true;
          ship.fuel = Math.min(100, ship.fuel + 20);
          score += 10;
          playFuel();
        }
    }
    // score based on time
    score += dt * 0.001;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
// background stars
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  // draw static starfield (simple random points)
  if (!window.__starfield) {
    window.__starfield = [];
    for (let i = 0; i < 100; i++) {
      window.__starfield.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
    }
  }
  ctx.fillStyle = '#fff';
  window.__starfield.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // planet (center) with radial gradient
  const planetGrad = ctx.createRadialGradient(center.x, center.y, 5, center.x, center.y, 20);
  planetGrad.addColorStop(0, '#555');
  planetGrad.addColorStop(1, '#111');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 20, 0, Math.PI * 2);
  ctx.fill();
    // ship with gradient and optional thrust
    const shipX = center.x + Math.cos(ship.angle) * ship.radius;
    const shipY = center.y + Math.sin(ship.angle) * ship.radius;
    // ship body gradient
    const shipGrad = ctx.createRadialGradient(shipX, shipY, ship.size * 0.2, shipX, shipY, ship.size);
    shipGrad.addColorStop(0, '#6f0');
    shipGrad.addColorStop(1, '#030');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY);
    const dir = ship.angle;
    ctx.lineTo(shipX - Math.cos(dir) * ship.size - Math.sin(dir) * ship.size,
               shipY - Math.sin(dir) * ship.size + Math.cos(dir) * ship.size);
    ctx.lineTo(shipX - Math.cos(dir) * ship.size + Math.sin(dir) * ship.size,
               shipY - Math.sin(dir) * ship.size - Math.cos(dir) * ship.size);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(shipX, shipY);
      ctx.lineTo(shipX + Math.cos(dir) * ship.size * 1.5,
                 shipY + Math.sin(dir) * ship.size * 1.5);
      ctx.lineTo(shipX + Math.cos(dir) * ship.size * 0.5 - Math.sin(dir) * ship.size * 0.5,
                 shipY + Math.sin(dir) * ship.size * 0.5 + Math.cos(dir) * ship.size * 0.5);
      ctx.closePath();
      ctx.fill();
    }
// asteroids with radial gradient
  for (const a of asteroids) {
    const ax = center.x + Math.cos(a.angle) * a.radius;
    const ay = center.y + Math.sin(a.angle) * a.radius;
    const grad = ctx.createRadialGradient(ax, ay, a.size * 0.2, ax, ay, a.size);
    grad.addColorStop(0, '#b5651d');
    grad.addColorStop(1, '#4b2e1f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
    ctx.fill();
  }
    // fuels with pulsating gradient
    for (const f of fuels) {
      if (f.collected) continue;
      const fx = center.x + Math.cos(f.angle) * f.radius;
      const fy = center.y + Math.sin(f.angle) * f.radius;
      const pulse = Math.abs(Math.sin(performance.now() / 200)); // 0-1 pulsate
      const grad = ctx.createRadialGradient(fx, fy, f.size * 0.2, fx, fy, f.size);
      grad.addColorStop(0, `rgba(255,255,0,${0.8 + 0.2 * pulse})`);
      grad.addColorStop(1, `rgba(255,165,0,${0.5 + 0.3 * pulse})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(fx, fy, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
