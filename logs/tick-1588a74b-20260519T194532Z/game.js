// Minimal endless runner game
// Canvas element with id="game"
(() => {
  // Load sounds (replace src with your own files if desired)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA'); // tiny silent placeholder
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA'); // placeholder
  // Optional background loop (muted by default)
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAAA');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // Uncomment to enable background music
  // bgMusic.play();
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  const player = { x: 50, y: height - 40, w: 20, h: 20, vy: 0, jumpForce: -12, onGround: true };
  const gravity = 0.6;
  const obstacles = [];
  let spawnTimer = 0;
  let gameOver = false;
  let score = 0;

  const keys = {};
  document.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') jump(); });
  document.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('click', jump);

  function jump() {
    if (player.onGround) {
      player.vy = player.jumpForce;
      player.onGround = false;
      // Play jump sound
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  }

  function spawnObstacle() {
    const size = 20;
    const colors = ['#212121', '#00695c', '#1565c0', '#6a1b9a'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    obstacles.push({ x: width, y: height - size, w: size, h: size, speed: 6, color });
  }

  function update() {
    if (gameOver) return;
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h >= height) {
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // Obstacles
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 100 + Math.random() * 100;
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // Collision
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        // Play game over sound
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        // Stop background music if playing
        bgMusic.pause();
        bgMusic.currentTime = 0;
      }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Increment score when alive
    if (!gameOver) score++;
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#87CEEB'); // sky blue
    grad.addColorStop(1, '#FFFFFF'); // horizon
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // Ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height - 20);
    ctx.lineTo(width, height - 20);
    ctx.stroke();
    // Player (circle)
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles (random colors)
    obstacles.forEach(o => {
      if (!o.color) o.color = '#212121';
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
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
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
