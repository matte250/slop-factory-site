// Simple "Orbit Escape" game implementation
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playBoost() { beep(600, 80); }
  function playCollision() { beep(200, 300); }
  let musicStarted = false;
  function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    // simple background tone loop
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    osc.start();
  }

  // ----- Game constants -----
  const PLANET = { x: W / 2, y: H / 2, r: 30 };
  const SHIP = { r: 8, speed: 0.02, boost: 0.5, fuel: 100, maxFuel: 100 };
  const ASTEROID = { minSize: 5, maxSize: 15, speed: 1.2 };
  const FUEL_COST = 0.4; // per boost
  const FUEL_DRAIN = 0.02; // per frame

  let shipAngle = 0; // radians
  let shipRadius = 100; // distance from planet centre
  let fuel = SHIP.fuel;
  let score = 0;
  const asteroids = [];
  let lastSpawn = 0;

  // ----- Input handling -----
  const keys = {};
  // Start audio on first interaction
  const startAudio = () => { startMusic(); window.removeEventListener('click', startAudio); window.removeEventListener('keydown', startAudio); };
  window.addEventListener('click', startAudio);
  window.addEventListener('keydown', startAudio);
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    // Random edge position
    const side = Math.random() < 0.5 ? 'h' : 'v';
    let x, y, vx, vy;
    if (side === 'h') {
      x = Math.random() * W;
      y = Math.random() < 0.5 ? -ASTEROID.maxSize : H + ASTEROID.maxSize;
    } else {
      x = Math.random() < 0.5 ? -ASTEROID.maxSize : W + ASTEROID.maxSize;
      y = Math.random() * H;
    }
    // Velocity towards planet centre
    const dx = PLANET.x - x;
    const dy = PLANET.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * ASTEROID.speed;
    vy = (dy / len) * ASTEROID.speed;
    const size = ASTEROID.minSize + Math.random() * (ASTEROID.maxSize - ASTEROID.minSize);
    asteroids.push({ x, y, vx, vy, r: size });
  }

  function update(dt) {
    // Input: left/right rotate, up boost outward
    if (keys.ArrowLeft) shipAngle -= SHIP.speed * dt;
    if (keys.ArrowRight) shipAngle += SHIP.speed * dt;
    if (keys.ArrowUp && fuel > 0) {
      shipRadius += SHIP.boost * dt;
      fuel = Math.max(0, fuel - FUEL_COST * dt);
      playBoost();
    }
    // Natural fuel drain
    fuel = Math.max(0, fuel - FUEL_DRAIN * dt);

    // Clamp orbit radius
    const minR = PLANET.r + 20;
    const maxR = Math.min(W, H) / 2 - 20;
    shipRadius = Math.min(Math.max(shipRadius, minR), maxR);

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Remove if past centre
      if (Math.hypot(a.x - PLANET.x, a.y - PLANET.y) < PLANET.r) asteroids.splice(i, 1);
    }

    // Spawn new asteroids roughly every 1.5 sec
    lastSpawn += dt;
    if (lastSpawn > 1500) { spawnAsteroid(); lastSpawn = 0; }

    // Collision detection
    const shipX = PLANET.x + Math.cos(shipAngle) * shipRadius;
    const shipY = PLANET.y + Math.sin(shipAngle) * shipRadius;
    for (const a of asteroids) {
      if (Math.hypot(a.x - shipX, a.y - shipY) < a.r + SHIP.r) {
        // Game over – play sound, reset state
        playCollision();
        alert('Game Over! Score: ' + Math.floor(score));
        reset();
        return;
      }
    }

    // Update score
    score += dt * 0.01;
  }

  function reset() {
    shipAngle = 0;
    shipRadius = 100;
    fuel = SHIP.fuel;
    score = 0;
    asteroids.length = 0;
    lastSpawn = 0;
  }

  function draw() {
    // Background starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#444';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Planet with radial gradient
    const grad = ctx.createRadialGradient(PLANET.x, PLANET.y, PLANET.r * 0.2, PLANET.x, PLANET.y, PLANET.r);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(PLANET.x, PLANET.y, PLANET.r, 0, Math.PI * 2);
    ctx.fill();
    // Ship as triangle with orientation
    const shipX = PLANET.x + Math.cos(shipAngle) * shipRadius;
    const shipY = PLANET.y + Math.sin(shipAngle) * shipRadius;
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(shipAngle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -SHIP.r);
    ctx.lineTo(SHIP.r * 0.8, SHIP.r);
    ctx.lineTo(-SHIP.r * 0.8, SHIP.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with simple shading
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel bar with border
    const barW = 100, barH = 10;
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, barW, barH);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(10, 10, barW, barH);
    ctx.fillStyle = '#ff0';
    const fuelW = (fuel / SHIP.maxFuel) * barW;
    ctx.fillRect(10, 10, fuelW, barH);
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 35);
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime; // ms
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
