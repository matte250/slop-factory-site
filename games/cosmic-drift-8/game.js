// game.js – Minimal Cosmic Drift implementation
// Targets <canvas id="game"></canvas> present in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Load sounds (tiny beep data URLs)
  const boostSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='); // short beep
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA=');
  // simple beep reused for both, replace with real files later

  // Resize canvas to fill window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // ----- Game state -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height * 0.8,
    radius: 12,
    speed: 2,
    boostSpeed: 4,
    vx: 0,
  };

  let asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastAsteroidTime = 0;

  let distance = 0;
  let fuel = 100; // percent
  const fuelConsumption = 0.02; // per frame
  const boostFuelUse = 0.1;

  const keys = { left: false, right: false, boost: false };
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    else if (e.code === 'ArrowRight') keys.right = true;
    else if (e.code === 'Space') {
      keys.boost = true;
      // Play boost sound when boost starts
      boostSound.currentTime = 0;
      boostSound.play();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    else if (e.code === 'ArrowRight') keys.right = false;
    else if (e.code === 'Space') keys.boost = false;
  });

  // ----- Helper functions -----
  const spawnAsteroid = () => {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * canvas.width;
    const y = -radius;
    const speed = Math.random() * 1.5 + 0.5;
    asteroids.push({ x, y, radius, speed });
  };

  const update = (dt) => {
    // Ship horizontal movement
    if (keys.left) ship.vx = -ship.speed;
    else if (keys.right) ship.vx = ship.speed;
    else ship.vx = 0;
    if (keys.boost && fuel > 0) {
      ship.vx *= ship.boostSpeed / ship.speed;
      fuel = Math.max(0, fuel - boostFuelUse);
    }
    ship.x += ship.vx;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));

    // Fuel consumption
    if (fuel > 0) fuel = Math.max(0, fuel - fuelConsumption);

    // Asteroid movement & spawn
    const now = performance.now();
    if (now - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = now;
    }
    asteroids.forEach((a) => (a.y += a.speed * (dt / 16)));
    asteroids = asteroids.filter((a) => a.y - a.radius < canvas.height);

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Game over – stop the loop
        // Play crash sound
        crashSound.currentTime = 0;
        crashSound.play();
        cancelAnimationFrame(frameId);
        ctx.fillStyle = 'red';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        return;
      }
    }

    // Distance travelled (simple approximation)
    distance += ship.vx * (dt / 16);
  };

  const stars = [];
  // Initialize star layers for parallax effect
  const initStars = () => {
    const layers = [0.2, 0.5, 1]; // speed multipliers
    for (const speed of layers) {
      for (let i = 0; i < 50; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          speed,
        });
      }
    }
  };
  initStars();

  const drawStars = (dt) => {
    // Space gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#000022');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Update and draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      s.y += s.speed * (dt / 16);
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const render = () => {
    drawStars();
    // Draw ship
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI overlay
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Distance: ${Math.floor(distance)} px`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
  };

  let lastTime = performance.now();
  let frameId;
  const loop = (now) => {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    render();
    frameId = requestAnimationFrame(loop);
  };
  frameId = requestAnimationFrame(loop);
})();
