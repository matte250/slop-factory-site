// Simple Asteroid Dodger game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Sound assets (provide your own files in the same directory)
  const sounds = {
    thrust: new Audio('thrust.wav'), // ship movement
    explode: new Audio('explosion.wav'), // collision
    bgm: new Audio('bgm.mp3') // background music
  };
  sounds.bgm.loop = true;
  sounds.bgm.volume = 0.3;
  sounds.bgm.play().catch(() => {}); // autoplay may be blocked

  // Set canvas size to match its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player configuration – spaceship triangle
  const player = {
    width: 30,
    height: 15,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      const grad = ctx.createLinearGradient(this.x - this.width / 2, this.y, this.x + this.width / 2, this.y + this.height);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // Keep within bounds
      const half = this.width / 2;
      this.x = Math.max(half, Math.min(canvas.width - half, this.x));
    }
  };

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      player.moveLeft = true;
      sounds.thrust.currentTime = 0;
      sounds.thrust.play();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      player.moveRight = true;
      sounds.thrust.currentTime = 0;
      sounds.thrust.play();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') player.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') player.moveRight = false;
    // Stop thrust sound when no movement keys pressed
    if (!player.moveLeft && !player.moveRight) {
      sounds.thrust.pause();
      sounds.thrust.currentTime = 0;
    }
  });

  // Asteroid management
  const asteroids = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5
    });
  }
  const drawStars = () => {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const spawnAsteroid = () => {
    const radius = 15;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speed = 2 + Math.random() * 2; // 2-4
    asteroids.push({ x, y: -radius, radius, speed });
  };

  const updateAsteroids = (delta) => {
    for (let a of asteroids) a.y += a.speed;
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y - asteroids[0].radius > canvas.height) {
      asteroids.shift();
    }
  };

  const drawAsteroids = () => {
    for (let a of asteroids) {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      gradient.addColorStop(0, '#ff9966'); // bright core
      gradient.addColorStop(1, '#663300'); // outer
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const checkCollision = () => {
    for (let a of asteroids) {
      const dx = a.x - player.x;
      const dy = a.y - (player.y + player.height / 2);
      const distance = Math.hypot(dx, dy);
      if (distance < a.radius + Math.max(player.width, player.height) / 2) {
        return true;
      }
    }
    return false;
  };

  let gameOver = false;
  let lastTime = 0;
  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    drawStars();

    // Spawn asteroids
    if (timestamp - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    player.update();
    player.draw();

    updateAsteroids(delta);
    drawAsteroids();

    if (checkCollision()) {
      gameOver = true;
      sounds.explode.currentTime = 0;
      sounds.explode.play().catch(() => {});
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  requestAnimationFrame(loop);
})();
