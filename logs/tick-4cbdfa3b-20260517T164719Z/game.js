// Asteroid Dodge game
// Assumes a <canvas id="gameCanvas"></canvas> exists in the HTML

(() => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return console.error('Canvas element with id "gameCanvas" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0',
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    move(dir) {
      this.x = Math.max(0, Math.min(width - this.width, this.x + dir * this.speed));
    },
    getRect() {
      return {x: this.x, y: this.y, w: this.width, h: this.height};
    }
  };

  // Bullet (single shot)
  const bullet = {
    active: false,
    x: 0,
    y: 0,
    speed: 8,
    width: 4,
    height: 10,
    color: '#ff0',
    fire() {
      if (!this.active) {
        this.x = ship.x + ship.width / 2 - this.width / 2;
        this.y = ship.y;
        this.active = true;
      }
    },
    update() {
      if (this.active) {
        this.y -= this.speed;
        if (this.y + this.height < 0) this.active = false;
      }
    },
    draw() {
      if (this.active) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    },
    getRect() {
      return {x: this.x, y: this.y, w: this.width, h: this.height};
    }
  };

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 1000; // ms
  let lastTime = 0;
  let speedFactor = 1; // accelerates over time

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    asteroids.push({
      x,
      y: -size,
      w: size,
      h: size,
      speed: 2 * speedFactor + Math.random() * 2,
      color: '#f44'
    });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if (a.y > height) {
        asteroids.splice(i, 1);
      }
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function rectsOverlap(r1, r2) {
    return !(r1.x + r1.w < r2.x || r1.x > r2.x + r2.w || r1.y + r1.h < r2.y || r1.y > r2.y + r2.h);
  }

  function checkCollisions() {
    const shipRect = ship.getRect();
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const aRect = {x: a.x, y: a.y, w: a.w, h: a.h};
      // Ship vs asteroid
      if (rectsOverlap(shipRect, aRect)) {
        gameOver();
        return;
      }
      // Bullet vs asteroid
      if (bullet.active && rectsOverlap(bullet.getRect(), aRect)) {
        bullet.active = false;
        asteroids.splice(i, 1);
      }
    }
  }

  let running = true;
  function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ' && running) bullet.fire();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!running) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.move(-1);
    if (keys['ArrowRight'] || keys['d']) ship.move(1);

    // Update bullet
    bullet.update();

    // Spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
      speedFactor += 0.02; // gradual acceleration
    }

    // Update and draw asteroids
    updateAsteroids(dt);
    drawAsteroids();

    // Draw ship and bullet
    ship.draw();
    bullet.draw();

    // Collisions
    checkCollisions();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
