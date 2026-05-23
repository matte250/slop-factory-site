// Simple Asteroid Rush game
// Assumes an HTML canvas with id="game" is present and this script is loaded.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: false,
    rotate: 0,
  };

  // Starfield for nicer background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Input handling
  // Sound setup
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
  thrustAudio.loop = true;
  thrustAudio.volume = 0.5;
  const explosionAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();
  let thrustPlaying = false;
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.code] = true));
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const maxAsteroids = 30;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const speed = 1 + Math.random() * 2;
    const angle = Math.random() * Math.PI * 2;
    const radius = 15 + Math.random() * 20;
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
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
    asteroids.push({ x, y, dx, dy, radius });
  }

  let collisionHandled = false;
function update(dt) {
    // Ship controls
    ship.rotate = 0;
    if (keys['ArrowLeft']) ship.rotate = -0.05;
    if (keys['ArrowRight']) ship.rotate = 0.05;
    ship.angle += ship.rotate;
    ship.thrust = keys['ArrowUp'];
    if (ship.thrust) {
      const thrustPower = 0.1;
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
    }
    // Thrust sound handling
    if (ship.thrust && !thrustPlaying) {
      thrustAudio.play();
      thrustPlaying = true;
    } else if (!ship.thrust && thrustPlaying) {
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
      thrustPlaying = false;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap ship around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Asteroids movement and spawn
    const now = performance.now();
    if (now - lastSpawn > asteroidSpawnInterval && asteroids.length < maxAsteroids) {
      spawnAsteroid();
      lastSpawn = now;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.dx;
      a.y += a.dy;
      // Wrap asteroids
      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    // Thrust flame
    if (ship.thrust) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroids() {
    // Asteroids with simple shading
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(
        a.x, a.y, a.radius * 0.2,
        a.x, a.y, a.radius
      );
      gradient.addColorStop(0, '#bbb');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) return true;
    }
    return false;
  }

  let startTime = null;
  let gameOver = false;
  let score = 0;

  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (startTime + score);
    if (!gameOver) {
      update(dt);
      if (checkCollision()) gameOver = true;
    }
    // Draw
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawShip();
    drawAsteroids();
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((timestamp - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
