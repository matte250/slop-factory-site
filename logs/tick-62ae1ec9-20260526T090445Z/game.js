// Simple Solar Swerve game implementation
// Canvas with id="game" expected in HTML

(() => {
  // Audio assets (ensure files are in same directory or adjust paths)
  const sounds = {
    thrust: new Audio('thrust.wav'),
    explode: new Audio('explosion.wav'),
    fuel: new Audio('fuel.wav'),
    bgm: new Audio('bgm.mp3')
  };
  // Background music loop
  sounds.bgm.loop = true;
  sounds.bgm.volume = 0.3;
  let audioStarted = false;
  function startAudio() {
    if (!audioStarted) {
      sounds.bgm.play();
      audioStarted = true;
    }
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game state
  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 5 };
  let fuel = 100; // seconds of play time
  const asteroids = [];
  const fuels = [];
  let lastSpawn = 0;
  const stars = [];
  // Initialize starfield with random stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 1.5
    });
  }
  let lastFuelSpawn = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    startAudio();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      sounds.thrust.currentTime = 0;
      sounds.thrust.play();
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    ship.x = Math.min(Math.max(mouseX, ship.w / 2), width - ship.w / 2);
  });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size) + size / 2;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -size, r: size / 2, speed });
  }

  function spawnFuel() {
    const size = 15;
    const x = Math.random() * (width - size) + size / 2;
    const speed = 2;
    fuels.push({ x, y: -size, r: size / 2, speed });
  }

  function update(dt) {
    if (gameOver) return;
    // Decrease fuel
    fuel -= dt / 1000;
    if (fuel <= 0) { gameOver = true; return; }

    // Ship movement (arrow keys)
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.min(Math.max(ship.x, ship.w / 2), width - ship.w / 2);

    // Spawn asteroids every 800ms
    if (performance.now() - lastSpawn > 800) { spawnAsteroid(); lastSpawn = performance.now(); }
    // Spawn fuel cells every 5000ms
    if (performance.now() - lastFuelSpawn > 5000) { spawnFuel(); lastFuelSpawn = performance.now(); }

    // Update stars (move down)
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship (circle-rectangle approx)
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      if (dx < a.r + ship.w / 2 && dy < a.r + ship.h / 2) {
        gameOver = true;
        sounds.explode.currentTime = 0;
        sounds.explode.play();
      }
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      const dx = Math.abs(f.x - ship.x);
      const dy = Math.abs(f.y - ship.y);
      if (dx < f.r + ship.w / 2 && dy < f.r + ship.h / 2) {
        fuel = Math.min(fuel + 20, 100);
        sounds.fuel.currentTime = 0;
        sounds.fuel.play();
        fuels.splice(i, 1);
      } else if (f.y - f.r > height) {
        fuels.splice(i, 1);
      }
    }
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw starfield background
    stars.forEach(star => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(star.x, star.y, 2, 2);
    });
    // Draw ship (triangle) with gradient
    const shipGradient = ctx.createLinearGradient(ship.x - ship.w / 2, ship.y - ship.h / 2, ship.x + ship.w / 2, ship.y + ship.h / 2);
    shipGradient.addColorStop(0, '#0ff');
    shipGradient.addColorStop(1, '#004');
    ctx.fillStyle = shipGradient;
    
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.1, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fuel cells with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel gauge
    ctx.fillStyle = '#fff';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, fuel, 10);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start loop once canvas is ready
  if (canvas) requestAnimationFrame(loop);
})();
