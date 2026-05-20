// Simple Asteroid Escape game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }
  function updateStars() {
    for (let s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }
  // Sounds
  const thrustSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const fuelSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  // Ensure sounds can be played without user gesture restrictions (may need user interaction first)

  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Game state
  let fuel = 100;
  let score = 0;
  let gameOver = false;

  // Ship
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    dy: 0,
    speed: 4,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      if (this.y < this.h / 2) this.y = this.h / 2;
      if (this.y > height - this.h / 2) this.y = height - this.h / 2;
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastAsteroid = 0;
  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size / 2,
      speed: Math.random() * 2 + 2
    });
  }

  // Fuel cells
  const fuels = [];
  const fuelSpawnInterval = 5000;
  let lastFuel = 0;
  function spawnFuel() {
    const size = 12;
    fuels.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size / 2,
      speed: 2
    });
  }

  // Collision helpers
  function circleRectCollision(circle, rect) {
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > (rect.w / 2 + circle.r)) return false;
    if (distY > (rect.h / 2 + circle.r)) return false;
    if (distX <= (rect.w / 2)) return true;
    if (distY <= (rect.h / 2)) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  function update(delta) {
    if (gameOver) return;
    // Input
    ship.dy = 0;
    if (keys['ArrowUp'] || keys['w']) {
      ship.dy = -ship.speed;
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
    if (keys['ArrowDown'] || keys['s']) {
      ship.dy = ship.speed;
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
    ship.update();
    // Update background stars
    updateStars();

    // Spawn asteroids
    if (performance.now() - lastAsteroid > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }
    // Spawn fuel
    if (performance.now() - lastFuel > fuelSpawnInterval) {
      spawnFuel();
      lastFuel = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      else if (circleRectCollision({x: a.x, y: a.y, r: a.r}, ship)) {
        crashSound.currentTime = 0;
        crashSound.play();
        gameOver = true;
      }
    }

    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.r < 0) fuels.splice(i, 1);
      else if (circleRectCollision({x: f.x, y: f.y, r: f.r}, ship)) {
fuel = Math.min(100, fuel + 20);
      fuelSound.currentTime = 0;
      fuelSound.play();
      score += 10;
      fuels.splice(i, 1);
      }
    }

    // Fuel consumption
    fuel -= delta * 0.01; // per ms
    if (fuel <= 0) gameOver = true;
    score += delta * 0.001;
  }

  function draw() {
    // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // Stars
  drawStars();
  // Clear previous frame (not needed after background)
  //ctx.clearRect(0, 0, width, height);
    // Ship
    ship.draw();
    // Asteroids
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.max(0, fuel).toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const delta = now - lastTime;
    lastTime = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
