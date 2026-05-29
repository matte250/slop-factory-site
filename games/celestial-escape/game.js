/*
 * Celestial Escape – minimal implementation
 * Player (triangle) moves with arrow keys, avoids randomly generated asteroids.
 * Score increases over time. Collision ends the game.
 */

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ---- Audio ----
  // Simple thrust sound (short beep)
  const thrustSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAB//w==');
  // Collision/game over sound (lower tone)
  const collideSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAABf//8=');

  // ----- Game state -----
  const ship = { x: width / 2, y: height / 2, size: 15, speed: 3 };
  const keys = {};
  const asteroids = [];
  let score = 0;
  let lastAsteroid = 0;
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnAsteroid() {
    const size = rand(10, 30);
    // start on random edge
    const edge = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    if (edge === 0) { x = -size; y = rand(0, height); vx = rand(1, 3); vy = rand(-1, 1); }
    else if (edge === 1) { x = width + size; y = rand(0, height); vx = -rand(1, 3); vy = rand(-1, 1); }
    else if (edge === 2) { x = rand(0, width); y = -size; vx = rand(-1, 1); vy = rand(1, 3); }
    else { x = rand(0, width); y = height + size; vx = rand(-1, 1); vy = -rand(1, 3); }
    asteroids.push({ x, y, vx, vy, size });
  }
  function updateShip() {
    const moving = keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // thrust sound while moving
    if (moving) {
      if (thrustSound.paused) thrustSound.play();
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
    // keep in bounds
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      if (!gameOver) collideSound.play();
      gameOver = true;
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
  }
  function updateAsteroids(dt) {
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }
  }
  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size) {
        if (!gameOver) collideSound.play();
        gameOver = true;
        break;
      }
    }
  }
  function draw() {
    // background gradient (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship – triangle with outline
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#0aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // asteroids – rocky gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // score
    ctx.fillStyle = 'yellow';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  // ----- Main loop -----
  let lastTime = performance.now();
  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    if (!gameOver) {
      // spawn asteroids roughly every 1‑2 seconds
      if (now - lastAsteroid > rand(1000, 2000)) { spawnAsteroid(); lastAsteroid = now; }
      updateShip();
      updateAsteroids(dt);
      checkCollisions();
      score += dt * 10; // points per second
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
