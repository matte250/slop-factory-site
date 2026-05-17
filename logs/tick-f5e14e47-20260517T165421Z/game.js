// Minimal endless runner based on IDEA.md
// Assumes a <canvas id="gameCanvas"></canvas> exists in the page.
(() => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return console.error('Canvas element with id "gameCanvas" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game constants
  const GRAVITY = 0.6;
  const JUMP_SPEED = -12;
  const PLAYER_SIZE = 30;
  const SPEED = 4; // world scroll speed
  const OBSTACLE_WIDTH = 30;
  const OBSTACLE_GAP = 200; // distance between obstacles

  // Player state
  const player = {
    x: 60,
    y: canvas.height - PLAYER_SIZE,
    w: PLAYER_SIZE,
    h: PLAYER_SIZE,
    vy: 0,
    onGround: true,
  };

  // Obstacles (spikes/gaps) – simple rectangles for now
  const obstacles = [];
  let nextObstacleX = canvas.width + 200;

  const spawnObstacle = () => {
    const height = Math.random() * (canvas.height / 2) + 20;
    obstacles.push({ x: nextObstacleX, y: canvas.height - height, w: OBSTACLE_WIDTH, h: height });
    nextObstacleX += OBSTACLE_GAP + Math.random() * 100;
  };

  // Initial obstacles
  for (let i = 0; i < 5; i++) spawnObstacle();

  // Input handling – click or tap to jump
  const tryJump = () => {
    if (player.onGround) {
      player.vy = JUMP_SPEED;
      player.onGround = false;
    }
  };
  canvas.addEventListener('mousedown', tryJump);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); tryJump(); }, { passive: false });

  let gameOver = false;
  const loop = () => {
    if (gameOver) return;
    // Update player
    player.vy += GRAVITY;
    player.y += player.vy;
    // Ground check
    if (player.y + player.h >= canvas.height) {
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= SPEED;
      // Remove off‑screen obstacles
      if (obs.x + obs.w < 0) obstacles.splice(i, 1);
    }
    // Spawn new obstacles as needed
    if (nextObstacleX - canvas.width < 0) spawnObstacle();

    // Collision detection
    for (const obs of obstacles) {
      if (player.x < obs.x + obs.w && player.x + player.w > obs.x &&
          player.y < obs.y + obs.h && player.y + player.h > obs.y) {
        gameOver = true;
        break;
      }
    }

    // Render
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player (glowing square)
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Draw obstacles (spikes – simple dark rectangles)
    ctx.fillStyle = '#444';
    ctx.shadowBlur = 0;
    for (const obs of obstacles) {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  requestAnimationFrame(loop);
})();
