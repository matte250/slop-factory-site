// Asteroid Dodger – concise implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Sound assets (simple beeps using data URIs)
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // collision
  const scoreSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // point
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // game over

  // Player
  const player = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  const spawnInterval = 60; // frames

  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: Math.random() * 2 + 1 });
  }

  function update() {
    if (gameOver) return;
    // Player movement
    if (keys.left) player.x = Math.max(0, player.x - player.speed);
    if (keys.right) player.x = Math.min(width - player.w, player.x + player.speed);
    // Asteroid movement
    asteroids.forEach(a => a.y += a.speed);
    // Remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) {
        asteroids.splice(i, 1);
        score++;
        scoreSound.currentTime = 0;
        scoreSound.play();
      }
    }
    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < player.x + player.w && a.x + a.w > player.x &&
        a.y < player.y + player.h && a.y + a.h > player.y
      ) {
        gameOver = true;
        hitSound.currentTime = 0;
        hitSound.play();
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        break;
      }
    }
    // Spawn logic
    if (spawnTimer++ >= spawnInterval) {
      spawnTimer = 0;
      spawnAsteroid();
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    // Player – draw a simple triangle ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids – draw circles with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#a44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  spawnAsteroid();
  requestAnimationFrame(loop);
})();
