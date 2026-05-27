// Simple Space Debris Dodge game
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  // Load sound effects (provide your own audio files in the same directory)
  const thrustSound = new Audio('thrust.mp3');
  thrustSound.loop = true;
  const explosionSound = new Audio('explosion.mp3');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- Player -----
  const player = {
    thrusting: false,
    x: width / 2,
    y: height - 40,
    size: 20,
    angle: 0, // radians
    speed: 0,
    maxSpeed: 4,
    thrust: 0.1,
    friction: 0.98,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      // ship body
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(0, -this.size / 2);
      ctx.lineTo(this.size / 2, this.size / 2);
      ctx.lineTo(-this.size / 2, this.size / 2);
      ctx.closePath();
      ctx.fill();
      // thrust flame
      if (this.thrusting) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(0, this.size / 2);
        ctx.lineTo(this.size / 4, this.size / 2 + this.size);
        ctx.lineTo(-this.size / 4, this.size / 2 + this.size);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    },
    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.speed *= this.friction;
      // Keep inside canvas
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }
  };

  // ----- Stars -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const size = 15 + Math.random() * 25;
    const x = Math.random() * width;
    const y = -size;
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y, size, speed });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function handleInput() {
    if (keys['ArrowLeft'] || keys['a']) player.angle -= 0.07;
    if (keys['ArrowRight'] || keys['d']) player.angle += 0.07;
    if (keys['ArrowUp'] || keys['w']) {
      player.speed = Math.min(player.maxSpeed, player.speed + player.thrust);
      player.thrusting = true;
    } else {
      player.thrusting = false;
    }
    // Manage thrust sound
    if (player.thrusting) {
      if (thrustSound.paused) thrustSound.play();
    } else {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
  }
    if (keys['ArrowLeft'] || keys['a']) player.angle -= 0.07;
    if (keys['ArrowRight'] || keys['d']) player.angle += 0.07;
    if (keys['ArrowUp'] || keys['w']) {
      player.speed = Math.min(player.maxSpeed, player.speed + player.thrust);
      player.thrusting = true;
    } else {
      player.thrusting = false;
    }
  }

  // ----- Collision -----
  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + player.size / 2) return true;
    }
    return false;
  }

  // ----- Game Loop -----
  let lastTime = performance.now();
  let running = true;
  let score = 0;

  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // spawn
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }

    handleInput();
    player.update();
    updateAsteroids(dt);
    player.draw();
    drawAsteroids();

    // score
    score += dt * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (checkCollision()) {
      running = false;
      // Play explosion sound
      explosionSound.play();
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      return;
    }

    if (running) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
