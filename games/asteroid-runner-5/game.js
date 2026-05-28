// Simple "Asteroid Runner" – horizontal scrolling canvas game with improved graphics.
// Canvas element: <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // background stars for parallax effect
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // ---------- Game state ----------
  const ship = { x: 80, y: height / 2, radius: 12, speed: 2 };
  const asteroids = [];
  const fuels = [];
  let fuel = 100;
  let distance = 0;
  let lastAsteroid = 0;
  let lastFuel = 0;
  let gameOver = false;

  // ---------- Helpers ----------
  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnAsteroid = () => {
    const size = rand(15, 30);
    asteroids.push({
      x: width + size,
      y: rand(size, height - size),
      r: size,
      speed: rand(2, 5)
    });
  };

  const spawnFuel = () => {
    const size = 8;
    fuels.push({
      x: width + size,
      y: rand(size, height - size),
      r: size,
      speed: 3
    });
  };

  const circleCollision = (a, b) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.r + b.r;
  };

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---------- Main loop ----------
  const update = () => {
    if (gameOver) return;

    // Move ship
    if (keys['ArrowUp'] && ship.y - ship.radius > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.radius < height) ship.y += ship.speed;
    if (keys['ArrowLeft'] && ship.x - ship.radius > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.radius < width) ship.x += ship.speed;

    // Fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) gameOver = true;

    // Spawn asteroids ~ every 1.2s
    if (performance.now() - lastAsteroid > 1200) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Spawn fuel pickups ~ every 5s
    if (performance.now() - lastFuel > 5000) {
      spawnFuel();
      lastFuel = performance.now();
    }

    // Update asteroids
    asteroids.forEach((a, i) => {
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      if (circleCollision(ship, a)) gameOver = true;
    });

    // Update fuels
    fuels.forEach((f, i) => {
      f.x -= f.speed;
      if (f.x + f.r < 0) fuels.splice(i, 1);
      if (circleCollision(ship, f)) {
        fuel = Math.min(100, fuel + 30);
        fuels.splice(i, 1);
      }
    });

    distance += 0.5;
    draw();
    requestAnimationFrame(update);
  };

  // ---------- Rendering ----------
  const draw = () => {
    // Clear and draw background stars with parallax
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship – drawn as triangle with gradient
    const shipGrad = ctx.createLinearGradient(0, ship.y - ship.radius, 0, ship.y + ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#007777');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // Asteroids – radial gradient rock look
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel pickups – glowing pulsing circles
    fuels.forEach(f => {
      const pulse = Math.abs(Math.sin(performance.now() / 200)) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,165,0,${pulse})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Dist: ${Math.floor(distance)}m`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  // Start the loop once the canvas size is known
  if (width && height) update();
})();
