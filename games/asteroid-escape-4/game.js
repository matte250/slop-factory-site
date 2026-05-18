// Asteroid Escape with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
    },
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + (performance.now() / 60000);
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (delta / 16);
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Particle explosion
  const particles = [];
  function spawnExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 60,
        size: Math.random() * 2 + 1,
      });
    }
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,165,0,${p.life / 60})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = (ship.x + ship.w / 2) - a.x;
      const dy = (ship.y + ship.h / 2) - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) return true;
    }
    return false;
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    ship.x = Math.min(width - ship.w, Math.max(0, mx - ship.w / 2));
  });

  // Scoring
  let startTime = null;
  let score = 0;
  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.floor(score)}s`, 10, 20);
  }

  // Main loop
  let lastTime = performance.now();
  let gameOver = false;
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    drawStars();

    if (!gameOver) {
      if (now - lastSpawn > asteroidSpawnInterval) {
        spawnAsteroid();
        lastSpawn = now;
        asteroidSpawnInterval = Math.max(500, asteroidSpawnInterval - 20);
      }
      ship.update();
      ship.draw();
      updateAsteroids(delta);
      drawAsteroids();
      drawScore();
      if (!startTime) startTime = now;
      score = (now - startTime) / 1000;
      if (checkCollision()) {
        gameOver = true;
        spawnExplosion(ship.x + ship.w / 2, ship.y + ship.h / 2);
      }
    }

    updateParticles();
    drawParticles();

    if (gameOver && particles.length === 0) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }
  requestAnimationFrame(loop);
})();

// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
      if (this.moveRight) this.x = Math.min(width - this.w, this.x + this.speed);
    },
  };

  // Asteroid pool
  const asteroids = [];
  let asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;
  let speedIncreaseTimer = 0;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + (performance.now() / 60000); // slightly increase over time
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (delta / 16);
      // remove off-screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = (ship.x + ship.w / 2) - a.x;
      const dy = (ship.y + ship.h / 2) - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) return true;
    }
    return false;
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    ship.x = Math.min(width - ship.w, Math.max(0, mx - ship.w / 2));
  });

  // Scoring
  let startTime = null;
  let score = 0;

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.floor(score)}s`, 10, 20);
  }

  // Main loop
  let lastTime = performance.now();
  function loop(now) {
    const delta = now - lastTime;
    lastTime = now;
    ctx.clearRect(0, 0, width, height);

    // spawn control
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
      // gradually speed up spawning
      asteroidSpawnInterval = Math.max(500, asteroidSpawnInterval - 20);
    }

    ship.update();
    ship.draw();
    updateAsteroids(delta);
    drawAsteroids();
    drawScore();

    // scoring
    if (!startTime) startTime = now;
    score = (now - startTime) / 1000;

    if (checkCollision()) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return; // stop loop
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
