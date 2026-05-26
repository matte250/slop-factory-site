// Minimal Neon Asteroid Dodge game
// Assumes a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its CSS dimensions or default 800x600
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const width = canvas.width;
  const height = canvas.height;

  // Create a neon gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');

  // Player ship
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 40,
    speed: 5,
    color: '#0ff',
  };

  // Stars for background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 2 + 0.5,
  }));

  const asteroids = [];
  let lastAsteroid = 0;
  const asteroidInterval = 800; // ms
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  // Sounds
  const spawnSound = new Audio('https://www.soundjay.com/mechanical/sounds/mechanical-click-1.mp3');
  const collisionSound = new Audio('https://www.soundjay.com/button/sounds/button-10.mp3');

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function drawShip() {
    // Neon glow for ship
    ctx.save();
    ctx.shadowBlur = 12;
    ctx.shadowColor = ship.color;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 2,
      color: '#f0f',
    });
    // Play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }

  function drawAsteroids() {
    // Neon asteroids with glow and gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#f0f');
      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f0f';
      ctx.fillStyle = grad;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.restore();
    });
  }

  function updateAsteroids(delta) {
    asteroids.forEach(a => (a.y += a.speed * (delta / 16)));
    // Remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }
  }

  function drawStars() {
    // Neon stars with glow
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0ff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.z, s.z);
      s.y += s.z * 0.5;
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
        s.z = Math.random() * 2 + 0.5;
      }
    });
    ctx.restore();
  }

  function checkCollision() {
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        return true;
      }
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = '#0f0';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
  }

  function loop(timestamp) {
    const delta = timestamp - (loop.last ?? timestamp);
    loop.last = timestamp;

    ctx.clearRect(0, 0, width, height);
    drawStars();
    // Ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    drawShip();

    // Asteroids
    if (timestamp - lastAsteroid > asteroidInterval) {
      spawnAsteroid();
      lastAsteroid = timestamp;
    }
    updateAsteroids(delta);
    drawAsteroids();

    // Score
    score = (timestamp - startTime) / 1000;
    drawScore();

    // Collision
    if (checkCollision()) {
      // Play collision sound
      collisionSound.currentTime = 0;
      collisionSound.play();
      gameOver = true;
    }

    if (!gameOver) {
      requestAnimationFrame(loop);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2 - 20);
      ctx.font = '24px monospace';
      ctx.fillText(`Score: ${Math.floor(score)}`, width/2, height/2 + 20);
    }
  }

  requestAnimationFrame(loop);
})();
