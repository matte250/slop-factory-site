// Game: Asteroid Escape
// Canvas with id="game" should exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // ----- Settings -----
  const shipSize = 20;
  const shipSpeed = 4;
  const asteroidMinSize = 15;
  const asteroidMaxSize = 40;
  const asteroidBaseSpeed = 1.5;
  const asteroidSpawnInterval = 1000; // ms
  const orbSize = 12;
  const orbSpawnInterval = 3000; // ms
  const energyDecay = 0.02; // per frame

  // ----- State -----
  const keys = {};
  let ship = { x: width / 2, y: height - 60, size: shipSize, energy: 100 };
  const asteroids = [];
  const orbs = [];
  let lastAsteroid = 0;
  let lastOrb = 0;
  let startTime = performance.now();
  let gameOver = false;
  let score = 0;

  // ----- Helpers -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function rectCircleCollide(cx, cy, radius, rx, ry, rw, rh) {
    // closest point on rectangle to circle centre
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollect() { playTone(660, 0.1); }
  function playCollision() { playTone(150, 0.5); }
  // Simple background hum (loop)
  function startBackground() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 30;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.02, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    // keep running; no stop
  }
  startBackground();
  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Game Loop -----
  function update(dt) {
    if (gameOver) return;

    // Move ship
    if (keys.ArrowLeft) ship.x -= shipSpeed;
    if (keys.ArrowRight) ship.x += shipSpeed;
    if (keys.ArrowUp) ship.y -= shipSpeed;
    if (keys.ArrowDown) ship.y += shipSpeed;
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y));

    // Energy decay
    ship.energy -= energyDecay * dt;
    if (ship.energy <= 0) {
      ship.energy = 0;
      gameOver = true;
    }

    // Spawn asteroids
    if (performance.now() - lastAsteroid > asteroidSpawnInterval) {
      lastAsteroid = performance.now();
      const size = rand(asteroidMinSize, asteroidMaxSize);
      asteroids.push({
        x: rand(0, width - size),
        y: -size,
        size,
        speed: asteroidBaseSpeed + rand(0, 1) + (performance.now() - startTime) / 60000, // increase over time
      });
    }

    // Spawn orbs
    if (performance.now() - lastOrb > orbSpawnInterval) {
      lastOrb = performance.now();
      orbs.push({
        x: rand(0, width - orbSize),
        y: -orbSize,
        size: orbSize,
        speed: 1.2,
      });
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship (approximate with circle)
      if (rectCircleCollide(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2,
        ship.x,
        ship.y,
        ship.size,
        ship.size
      )) {
        playCollision();
        gameOver = true;
        break;
      }
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed;
      if (
        rectCircleCollide(
          o.x + o.size / 2,
          o.y + o.size / 2,
          o.size / 2,
          ship.x,
          ship.y,
          ship.size,
          ship.size
        )
      ) {
        playCollect();
        ship.energy = Math.min(100, ship.energy + 15);
        orbs.splice(i, 1);
        continue;
      }
      if (o.y > height) orbs.splice(i, 1);
    }

    // Score = time survived (seconds) + collected orbs (energy bonus covers that)
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, width, height);

    // Enhanced background with parallax stars
    // Fill black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars of varying brightness and size
    for (let i = 0; i < 80; i++) {
      const sx = rand(0, width);
      const sy = rand(0, height);
      const starSize = rand(0.5, 2);
      const brightness = Math.floor(rand(150, 255));
      ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      ctx.fillRect(sx, sy, starSize, starSize);
    }

    // Ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.size);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.size / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Orbs with inner glow
    orbs.forEach(o => {
      // outer glow
      const glowGrad = ctx.createRadialGradient(
        o.x + o.size / 2,
        o.y + o.size / 2,
        0,
        o.x + o.size / 2,
        o.y + o.size / 2,
        o.size / 2 + 2
      );
      glowGrad.addColorStop(0, 'rgba(255,255,0,0.8)');
      glowGrad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      // inner core
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI: energy bar and score
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Energy: ' + Math.floor(ship.energy), 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 40);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
