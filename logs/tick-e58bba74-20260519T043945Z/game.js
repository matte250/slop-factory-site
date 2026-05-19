// Game: Neon Runner – minimal endless runner
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = canvas.offsetWidth * dpr;
  canvas.height = canvas.offsetHeight * dpr;
  ctx.scale(dpr, dpr);

  const WIDTH = canvas.offsetWidth;
  const HEIGHT = canvas.offsetHeight;

  // Player – neon line (simple rectangle)
  // Helper to draw rounded rectangles with neon glow
  function drawRoundedRect(x, y, w, h, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const player = {
    x: 50,
    y: HEIGHT - 20,
    width: 10,
    height: 20,
    vy: 0,
    jumpStrength: -7,
    gravity: 0.3,
    onGround: true,
    color: '#0ff',
  };

  // Obstacles – moving rectangles
  const obstacles = [];
  // Sound effects (add your own files in same directory)
  const sounds = {
    jump: new Audio('jump.mp3'),
    hit: new Audio('hit.mp3'),
  };

  const obstacleSpeed = 3;
  const obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  let gameOver = false;
  let score = 0;

  function spawnObstacle() {
    const width = 20 + Math.random() * 30;
    const height = 20 + Math.random() * 40;
    obstacles.push({
      x: WIDTH,
      y: HEIGHT - height,
      width,
      height,
      color: '#f0f',
    });
  }

  function update(dt) {
    if (gameOver) return;
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.height >= HEIGHT) {
      player.y = HEIGHT - player.height;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Remove off‑screen obstacles
      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        // Play hit sound
        sounds.hit.currentTime = 0;
        sounds.hit.play();
        gameOver = true;
        break;
      }
    }

    // Spawn new obstacles
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
  }

  function render() {
    // Clear background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw player with neon glow
    drawRoundedRect(player.x, player.y, player.width, player.height, 4, player.color);

  // Draw obstacles with neon glow
  for (const o of obstacles) {
    drawRoundedRect(o.x, o.y, o.width, o.height, 3, o.color);
  }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f88';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.fillText('Score: ' + score, WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (loop.last || timestamp);
    loop.last = timestamp;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling – jump on click or spacebar
  function jump() {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // Play jump sound
      sounds.jump.currentTime = 0;
      sounds.jump.play();
    }
  }
  canvas.addEventListener('click', jump);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') jump();
  });

  // Start the game loop
  requestAnimationFrame(loop);
})();
