// Asteroid Dodge – minimal canvas game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // size to fill element
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  const { width, height } = canvas;

  // ----- Game State -----
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    fuel: 100,
  };

  const asteroids = [];
  const fuelCells = [];
  const stars = [];
  let score = 0;
  let gameOver = false;
  let lastTime = 0;

// ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is running after first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(200, 0.05);
  const playPickup = () => playTone(600, 0.1);
  const playExplosion = () => playTone(100, 0.4);

  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4)); // 0: top,1:right,2:bottom,3:left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    switch (edge) {
      case 0: x = rand(0, width); y = -20; vx = rand(-1, 1); vy = speed; break;
      case 1: x = width + 20; y = rand(0, height); vx = -speed; vy = rand(-1, 1); break;
      case 2: x = rand(0, width); y = height + 20; vx = rand(-1, 1); vy = -speed; break;
      case 3: x = -20; y = rand(0, height); vx = speed; vy = rand(-1, 1); break;
    }
    asteroids.push({ x, y, r: rand(10, 30), vx, vy });
  };

  const spawnFuel = () => {
    fuelCells.push({
      x: rand(0, width),
      y: rand(0, height),
      r: 8,
    });
  };

  // initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  spawnFuel();

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    resumeAudio();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Main Loop -----
  function update(dt) {
    if (gameOver) return;
    // ship control
    if (keys['ArrowLeft']) ship.angle -= 0.07 * dt;
    if (keys['ArrowRight']) ship.angle += 0.07 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 0.1 * dt;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel -= 0.02 * dt; // consume fuel
      playThrust();
    }
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // screen wrap
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // dampening
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // asteroids movement
    asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -40) a.x = width + 40;
      if (a.x > width + 40) a.x = -40;
      if (a.y < -40) a.y = height + 40;
      if (a.y > height + 40) a.y = -40;
    });

    // collision ship‑asteroid
for (const a of asteroids) {
        if (distance(ship, a) < ship.r + a.r) {
          gameOver = true;
          playExplosion();
          break;
        }
      }
    // fuel cells
    for (let i = fuelCells.length - 1; i >= 0; i--) {
      const f = fuelCells[i];
if (distance(ship, f) < ship.r + f.r) {
          ship.fuel = Math.min(100, ship.fuel + 30);
          fuelCells.splice(i, 1);
          spawnFuel();
          playPickup();
        }
    }

    // spawn new asteroids over time
    if (Math.random() < 0.01) spawnAsteroid();
    // fuel depletion
    ship.fuel -= 0.01 * dt;
    if (ship.fuel <= 0) gameOver = true;
    // score
    score += dt * 0.1;
  }

  function draw() {
    // black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship thrust flame
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 8, ship.r / 2);
      ctx.lineTo(-ship.r - 8, -ship.r / 2);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
      ctx.restore();
    }
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fillStyle = ship.fuel > 0 ? '#0af' : '#555';
    ctx.fill();
    ctx.restore();
    // asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells
    ctx.fillStyle = '#0c0';
    fuelCells.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f33';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 16; // normalize to ~60fps units
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
