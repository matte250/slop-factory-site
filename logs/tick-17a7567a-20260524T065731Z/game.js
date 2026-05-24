// Minimal Neon Runner game
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Enable neon glow
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 15;
  const W = (canvas.width = 800);
  const H = (canvas.height = 400);

  // Sound effects (tiny data‑uri wavs)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQgAAAAA');
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABCxAgAEABAAZGF0YQgAAAAA');
  // Player
  const player = {
    w: 30,
    h: 30,
    x: 80,
    y: H - 30,
    vy: 0,
    onGround: true,
  };

  const GRAVITY = 0.8;
  const JUMP_STRENGTH = -15;
  const SLIDE_TIME = 30; // frames
  let slideCounter = 0;

  // Obstacles
  const obstacles = [];
  const OBSTACLE_SPACING = 200; // distance between obstacles
  let obstacleTimer = 0;

  let distance = 0;
  let gameOver = false;

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') keys.jump = true;
    if (e.code === 'ArrowDown') keys.slide = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') keys.jump = false;
    if (e.code === 'ArrowDown') keys.slide = false;
  });

  function spawnObstacle() {
    // Randomly create a gap or low ceiling obstacle
    const type = Math.random() < 0.5 ? 'gap' : 'low';
    const height = type === 'low' ? 20 : 0; // low ceiling height
    obstacles.push({ x: W, y: H - height, w: 30, h: H - height, type });
  }

  function update() {
    if (gameOver) return;

    // Player physics
    if (keys.jump && player.onGround) {
      player.vy = JUMP_STRENGTH;
      player.onGround = false;
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
    if (keys.slide && player.onGround) {
      slideCounter = SLIDE_TIME;
    }
    if (slideCounter > 0) {
      slideCounter--;
    }

    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y >= H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 5; // tunnel speed
      // Collision detection
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y &&
        player.y + player.h > o.y - o.h
      ) {
        gameOver = true;
        crashSound.currentTime = 0;
        crashSound.play();
      }
      // Remove off-screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn logic
    obstacleTimer++;
    if (obstacleTimer > OBSTACLE_SPACING / 5) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    distance += 5;
  }

  function draw() {
    // Background: dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Neon style settings
    ctx.strokeStyle = '#0ff';
    ctx.fillStyle = '#0ff';
    ctx.lineWidth = 2;

    // Draw player (rounded neon square)
    const ph = slideCounter > 0 ? player.h / 2 : player.h;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y + (player.h - ph));
    ctx.lineTo(player.x + player.w - 5, player.y + (player.h - ph));
    ctx.quadraticCurveTo(player.x + player.w, player.y + (player.h - ph), player.x + player.w, player.y + (player.h - ph) + 5);
    ctx.lineTo(player.x + player.w, player.y + player.h - 5);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - 5, player.y + player.h);
    ctx.lineTo(player.x + 5, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - 5);
    ctx.lineTo(player.x, player.y + (player.h - ph) + 5);
    ctx.quadraticCurveTo(player.x, player.y + (player.h - ph), player.x + 5, player.y + (player.h - ph));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw obstacles with neon outlines
    obstacles.forEach((o) => {
      if (o.type === 'low') {
        // low ceiling bar
        ctx.fillRect(o.x, 0, o.w, o.h);
        ctx.strokeRect(o.x, 0, o.w, o.h);
      } else {
        // gap – no drawing needed
      }
    });

    // Score display
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(distance / 10)}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  requestAnimationFrame(loop);
})();
