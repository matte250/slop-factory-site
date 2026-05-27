// Simple asteroid orbit game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    let freq = 200;
    let dur = 0.05;
    switch (type) {
      case 'thrust':
        freq = 200; dur = 0.05; break;
      case 'pickup':
        freq = 600; dur = 0.1; break;
      case 'explosion':
        freq = 100; dur = 0.4; break;
    }
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  const cx = width / 2;
  const cy = height / 2;
  // Star field background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Game constants
  const PLANET_RADIUS = 30;
  const SHIP_LENGTH = 12;
  const SHIP_WIDTH = 8;
  const ROT_SPEED = 2.5; // radians per second
  const THRUST_SPEED = 80; // pixels per second outward
  const FUEL_DECREASE = 5; // per second
  const FUEL_PICKUP_AMOUNT = 30;
  const ASTEROID_SPEED = 40; // pixels per second inward
  const ASTEROID_RADIUS = 10;
  const SPAWN_INTERVAL = 2000; // ms
  const PICKUP_INTERVAL = 5000; // ms

  // State
  const ship = {
    angle: 0, // radians, 0 points to the right
    radius: PLANET_RADIUS + 50,
    fuel: 100,
    thrusting: false,
    rotatingLeft: false,
    rotatingRight: false,
  };
  const asteroids = [];
  const pickups = [];
  let lastTime = performance.now();
  let lastAsteroidSpawn = 0;
  let lastPickupSpawn = 0;
  let gameOver = false;

  // Input handling
  // Ensure audio context is resumed on first user interaction
  function unlockAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', e => {
    unlockAudio();
    if (e.code === 'ArrowLeft') ship.rotatingLeft = true;
    if (e.code === 'ArrowRight') ship.rotatingRight = true;
    if (e.code === 'ArrowUp') ship.thrusting = true;
  }, {once: false});
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') ship.rotatingLeft = false;
    if (e.code === 'ArrowRight') ship.rotatingRight = false;
    if (e.code === 'ArrowUp') ship.thrusting = false;
  });
  // Also resume on mouse click
  window.addEventListener('click', unlockAudio, {once: true});

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(width, height) / 2 + 20;
    asteroids.push({ angle, radius, speed: ASTEROID_SPEED });
  }

  function spawnPickup() {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.max(width, height) / 2 - 60; // inside orbit area
    pickups.push({ angle, radius, collected: false });
  }

  function update(dt) {
    if (gameOver) return;

    // Ship rotation
    if (ship.rotatingLeft) ship.angle -= ROT_SPEED * dt;
    if (ship.rotatingRight) ship.angle += ROT_SPEED * dt;

    // Ship thrust
    if (ship.thrusting) {
      ship.radius += THRUST_SPEED * dt;
      playSound('thrust');
    }

    // Fuel consumption
    ship.fuel -= FUEL_DECREASE * dt;
    if (ship.fuel <= 0) {
      ship.fuel = 0;
      gameOver = true;
    }

    // Update asteroids (move inward)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.radius -= a.speed * dt;
      if (a.radius < PLANET_RADIUS) {
        // asteroid reached planet – remove
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const shipX = cx + ship.radius * Math.cos(ship.angle);
      const shipY = cy + ship.radius * Math.sin(ship.angle);
      const astX = cx + a.radius * Math.cos(a.angle);
      const astY = cy + a.radius * Math.sin(a.angle);
      const dist = Math.hypot(shipX - astX, shipY - astY);
        if (dist < SHIP_LENGTH + ASTEROID_RADIUS) {
          playSound('explosion');
          gameOver = true;
          return;
        }
    }

    // Update pickups (collision only)
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      const shipX = cx + ship.radius * Math.cos(ship.angle);
      const shipY = cy + ship.radius * Math.sin(ship.angle);
      const pickX = cx + p.radius * Math.cos(p.angle);
      const pickY = cy + p.radius * Math.sin(p.angle);
      const dist = Math.hypot(shipX - pickX, shipY - pickY);
      if (dist < SHIP_LENGTH) {
      ship.fuel = Math.min(100, ship.fuel + FUEL_PICKUP_AMOUNT);
      pickups.splice(i, 1);
      playSound('pickup');
      }
    }

    // Spawn new asteroids / pickups
    const now = performance.now();
    if (now - lastAsteroidSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroidSpawn = now;
    }
    if (now - lastPickupSpawn > PICKUP_INTERVAL) {
      spawnPickup();
      lastPickupSpawn = now;
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(cx, cy, PLANET_RADIUS * 0.2, cx, cy, PLANET_RADIUS);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#333');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, PLANET_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Ship (triangle with gradient)
    const shipX = cx + ship.radius * Math.cos(ship.angle);
    const shipY = cy + ship.radius * Math.sin(ship.angle);
    const dirX = Math.cos(ship.angle);
    const dirY = Math.sin(ship.angle);
    // Ship body gradient
    const shipGrad = ctx.createLinearGradient(shipX, shipY, shipX + dirX * SHIP_LENGTH, shipY + dirY * SHIP_LENGTH);
    shipGrad.addColorStop(0, '#4f4');
    shipGrad.addColorStop(1, '#0a0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(shipX + dirX * SHIP_LENGTH, shipY + dirY * SHIP_LENGTH);
    ctx.lineTo(shipX - dirY * SHIP_WIDTH / 2, shipY + dirX * SHIP_WIDTH / 2);
    ctx.lineTo(shipX + dirY * SHIP_WIDTH / 2, shipY - dirX * SHIP_WIDTH / 2);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (ship.thrusting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(shipX - dirX * 4, shipY - dirY * 4);
      ctx.lineTo(shipX - dirX * 14, shipY - dirY * 14);
      ctx.lineTo(shipX - dirY * 3, shipY + dirX * 3);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const x = cx + a.radius * Math.cos(a.angle);
      const y = cy + a.radius * Math.sin(a.angle);
      const grad = ctx.createRadialGradient(x, y, ASTEROID_RADIUS * 0.2, x, y, ASTEROID_RADIUS);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, ASTEROID_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pickups
    ctx.fillStyle = '#0ff';
    pickups.forEach(p => {
      const x = cx + p.radius * Math.cos(p.angle);
      const y = cy + p.radius * Math.sin(p.angle);
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel bar
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, 10, ship.fuel, 10);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', cx, cy);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  requestAnimationFrame(loop);
})();
