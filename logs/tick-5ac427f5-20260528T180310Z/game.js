// Simple Asteroid Dodge game based on IDEA.md
// Assumes there is a <canvas id="game"></canvas> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Sound assets (data URIs)
  const sounds = {
    hit: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='), // short silent placeholder
    power: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
  };
  // Background music (optional)
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.1;
  bgMusic.play();

  // Set canvas size (fallback to 800x600 if not styled)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Ship definition
  let score = 0;
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    radius: 15,
    speed: 5,
    color: '#00ff00',
    dx: 0,
    dy: 0,
    update() {
      this.x += this.dx;
      this.y += this.dy;
      // Keep within bounds
      this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    },
    draw() {
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#070');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
    },
  };

  // Asteroid definition
  const asteroids = [];
  // Power‑up circles (collect for score)
  const powerUps = [];
  const POWERUP_INTERVAL = 10000; // ms
  let lastPowerUp = 0;
  function spawnPowerUp() {
    const radius = 12;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = -radius;
    powerUps.push({ x, y, radius, speed: 1.5, collected: false });
  }
  function drawPowerUps() {
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ff8800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function updatePowerUps(delta) {
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y - p.radius > canvas.height) powerUps.splice(i, 1);
      // check collection with ship
      const dx = p.x - ship.x;
      const dy = p.y - ship.y;
      const dist = Math.hypot(dx, dy);
    if (dist < p.radius + ship.radius) {
          // increase score
          score += 10;
          // play power‑up sound
          sounds.power.currentTime = 0;
          sounds.power.play();
          powerUps.splice(i, 1);
        }

    }
  }
  // Starfield background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  function updateStars() {
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
  }
  let asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  let asteroidSpeed = 2;

  function spawnAsteroid() {
    const radius = 20 + Math.random() * 20;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = -radius;
    asteroids.push({ x, y, radius, speed: asteroidSpeed, color: '#888' });
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }
    // increase difficulty over time
    asteroidSpeed = Math.min(12, asteroidSpeed + delta * 0.00001);
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        return true;
      }
    }
    return false;
  }

  let lastTime = performance.now();
  let gameOver = false;

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }

    // spawn logic
    if (timestamp - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
      // gradually speed up spawning
      asteroidSpawnInterval = Math.max(500, asteroidSpawnInterval - 20);
    }
    // spawn power‑up
    if (timestamp - lastPowerUp > POWERUP_INTERVAL) {
      spawnPowerUp();
      lastPowerUp = timestamp;
    }

    // Update entities
    ship.update();
    updateAsteroids(delta);
    updateStars();
    updatePowerUps(delta);
    // Check collisions
    if (checkCollision()) {
          // play hit sound
          sounds.hit.currentTime = 0;
          sounds.hit.play();
          gameOver = true;
        }

    // Render
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawPowerUps();
    drawAsteroids();
    ship.draw();
    drawScore();

    requestAnimationFrame(loop);
  }

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    updateDirection();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    updateDirection();
  });

  function updateDirection() {
    ship.dx = 0;
    ship.dy = 0;
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    if (keys['ArrowRight']) ship.dx = ship.speed;
    if (keys['ArrowUp']) ship.dy = -ship.speed;
    if (keys['ArrowDown']) ship.dy = ship.speed;
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
