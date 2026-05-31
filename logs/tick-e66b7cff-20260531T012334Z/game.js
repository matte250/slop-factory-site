// Simple Asteroid Escape game
// Canvas with id "game" must exist in the HTML.
// Controls: ←/→ rotate, ↑ thrust, space for manual fuel boost (optional).

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // initialize star field
  initStars();

  // --- Game constants ---
  const SHIP_SIZE = 15; // radius for drawing
  const SHIP_THRUST = 0.1;
  const SHIP_TURN_SPEED = 0.06; // radians per frame
  const FUEL_DEPLETION = 0.02; // per frame
  const FUEL_PICKUP_AMOUNT = 30;
  const ASTEROID_MIN_SPEED = 0.5;
  const ASTEROID_MAX_SPEED = 2.5;
  const ASTEROID_SPAWN_INTERVAL = 2000; // ms
  const FUEL_SPAWN_INTERVAL = 8000; // ms
  // star field configuration
  const STAR_COUNT = 100;
  const stars = [];

  // --- Sound setup ---
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // thrust continuous tone
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 150;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosion() {
    playTone(80, 0.4);
  }
  function playPickup() {
    playTone(600, 0.1);
  }

  // --- Game state ---
  const ship = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    fuel: 100,
    thrusting: false,
    turningLeft: false,
    turningRight: false,
  };

  const asteroids = [];
  const fuels = [];
  let lastAsteroidSpawn = 0;
  let lastFuelSpawn = 0;
  let gameOver = false;

  // --- Input handling ---
  window.addEventListener('keydown', (e) => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    switch (e.code) {
      case 'ArrowUp':
        ship.thrusting = true;
        startThrustSound();
        break;
      case 'ArrowLeft':
        ship.turningLeft = true;
        break;
      case 'ArrowRight':
        ship.turningRight = true;
        break;
    }
  });
  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'ArrowUp':
        ship.thrusting = false;
        stopThrustSound();
        break;
      case 'ArrowLeft':
        ship.turningLeft = false;
        break;
      case 'ArrowRight':
        ship.turningRight = false;
        break;
    }
  });

  // --- Helper functions ---
  function spawnAsteroid() {
    // Spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const radius = 10 + Math.random() * 20;
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -radius;
        break;
      case 1: // right
        x = width + radius;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + radius;
        break;
      case 3: // left
        x = -radius;
        y = Math.random() * height;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius });
  }

  function spawnFuel() {
    const radius = 8;
    const x = radius + Math.random() * (width - 2 * radius);
    const y = radius + Math.random() * (height - 2 * radius);
    fuels.push({ x, y, radius });
  }

  // Initialize star field positions
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    }
  }

  function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.hypot(dx, dy);
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(SHIP_SIZE, 0);
    ctx.lineTo(-SHIP_SIZE * 0.6, SHIP_SIZE * 0.8);
    ctx.lineTo(-SHIP_SIZE * 0.6, -SHIP_SIZE * 0.8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    // thrust flame
    if (ship.thrusting && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-SHIP_SIZE * 0.6, SHIP_SIZE * 0.4);
      ctx.lineTo(-SHIP_SIZE * 1.2, 0);
      ctx.lineTo(-SHIP_SIZE * 0.6, -SHIP_SIZE * 0.4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroid(a) {
    const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    grad.addColorStop(0, '#b0b0b0');
    grad.addColorStop(1, '#404040');
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawFuel(f) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'lime';
    ctx.fill();
  }

  function drawFuelBar() {
    const barWidth = 100;
    const barHeight = 8;
    const x = 10;
    const y = 10;
    ctx.fillStyle = 'white';
    ctx.fillRect(x - 1, y - 1, barWidth + 2, barHeight + 2);
    ctx.fillStyle = 'red';
    const fuelRatio = Math.max(0, ship.fuel) / 100;
    ctx.fillRect(x, y, barWidth * fuelRatio, barHeight);
  }

  function update(dt) {
    // Turn ship
    if (ship.turningLeft) ship.angle -= SHIP_TURN_SPEED;
    if (ship.turningRight) ship.angle += SHIP_TURN_SPEED;

    // Thrust
    if (ship.thrusting && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * SHIP_THRUST;
      ship.vy += Math.sin(ship.angle) * SHIP_THRUST;
      ship.fuel -= FUEL_DEPLETION; // fuel used while thrusting
    } else {
      // passive fuel consumption
      ship.fuel -= FUEL_DEPLETION * 0.2;
    }

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Screen wrap for ship
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x += width + a.radius * 2;
      if (a.x > width + a.radius) a.x -= width + a.radius * 2;
      if (a.y < -a.radius) a.y += height + a.radius * 2;
      if (a.y > height + a.radius) a.y -= height + a.radius * 2;
      // collision with ship
      if (distance(ship.x, ship.y, a.x, a.y) < SHIP_SIZE + a.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }

    // Check fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
if (distance(ship.x, ship.y, f.x, f.y) < SHIP_SIZE + f.radius) {
          ship.fuel = Math.min(100, ship.fuel + FUEL_PICKUP_AMOUNT);
          fuels.splice(i, 1);
          playPickup();
        }
    }

    // Lose if out of fuel
    if (ship.fuel <= 0) gameOver = true;

    // Spawn new asteroids / fuel based on timers
    const now = performance.now();
    if (now - lastAsteroidSpawn > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroidSpawn = now;
    }
    if (now - lastFuelSpawn > FUEL_SPAWN_INTERVAL) {
      spawnFuel();
      lastFuelSpawn = now;
    }
  }

  function render() {
    // Draw space background with gradient and stars
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#02010a');
    grad.addColorStop(1, '#090c1f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    for (let s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    drawShip();
    asteroids.forEach(drawAsteroid);
    fuels.forEach(drawFuel);
    drawFuelBar();
  }

  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update(timestamp);
    render();
    requestAnimationFrame(loop);
  }

  // Initialise first spawn timers
  lastAsteroidSpawn = performance.now();
  lastFuelSpawn = performance.now();
  requestAnimationFrame(loop);
})();
