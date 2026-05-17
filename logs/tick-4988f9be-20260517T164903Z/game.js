// Simple endless runner based on IDEA.md
// Assumes an existing <canvas> element in the page.
(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return console.error('Canvas not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 400);

  // Game constants
  const PLAYER_SIZE = 30;
  const PLAYER_X = 80; // fixed horizontal position
  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SCROLL_SPEED = 4;
  const OBSTACLE_FREQ = 1500; // ms
  const ORB_FREQ = 2000; // ms
  const OBSTACLE_MIN_W = 20,
    OBSTACLE_MAX_W = 60;
  const OBSTACLE_MIN_H = 30,
    OBSTACLE_MAX_H = 120;
  const ORB_SIZE = 12;

  let playerY = H - PLAYER_SIZE;
  let playerVY = 0;
  let grounded = true;
  let score = 0;
  let gameOver = false;
  const obstacles = [];
  const orbs = [];

  // Input handling (space or click/tap)
  const jump = () => {
    if (grounded) {
      playerVY = JUMP_VELOCITY;
      grounded = false;
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  canvas.addEventListener('pointerdown', jump);

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Spawn obstacles
  const spawnObstacle = () => {
    const w = rand(OBSTACLE_MIN_W, OBSTACLE_MAX_W);
    const h = rand(OBSTACLE_MIN_H, OBSTACLE_MAX_H);
    obstacles.push({ x: W, y: H - h, w, h });
  };
  // Spawn collectible orbs
  const spawnOrb = () => {
    const size = ORB_SIZE;
    const x = W;
    const y = rand(H * 0.3, H - PLAYER_SIZE - size);
    orbs.push({ x, y, size });
  };

  // Timers
  let lastObstacle = Date.now();
  let lastOrb = Date.now();

  const rectIntersect = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const circleRectIntersect = (circle, rect) => {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  };

  // Main loop
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      ctx.fillText(`Score: ${score}`, W / 2 - 55, H / 2 + 30);
      return;
    }
    // Time based spawns
    const now = Date.now();
    if (now - lastObstacle > OBSTACLE_FREQ) {
      spawnObstacle();
      lastObstacle = now;
    }
    if (now - lastOrb > ORB_FREQ) {
      spawnOrb();
      lastOrb = now;
    }

    // Update player
    playerVY += GRAVITY;
    playerY += playerVY;
    if (playerY >= H - PLAYER_SIZE) {
      playerY = H - PLAYER_SIZE;
      playerVY = 0;
      grounded = true;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= SCROLL_SPEED;
      // collision
      if (rectIntersect({ x: PLAYER_X, y: playerY, w: PLAYER_SIZE, h: PLAYER_SIZE }, o)) {
        gameOver = true;
      }
      // remove offscreen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.x -= SCROLL_SPEED;
      if (circleRectIntersect({ x: orb.x + orb.size / 2, y: orb.y + orb.size / 2, r: orb.size / 2 }, { x: PLAYER_X, y: playerY, w: PLAYER_SIZE, h: PLAYER_SIZE })) {
        score++;
        orbs.splice(i, 1);
      } else if (orb.x + orb.size < 0) {
        orbs.splice(i, 1);
      }
    }

    // Draw
    ctx.clearRect(0, 0, W, H);
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
    // Ground line
    ctx.fillStyle = '#222';
    ctx.fillRect(0, H - 1, W, 1);
    // Player
    ctx.fillStyle = '#0ff'; // neon cyan
    ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);
    // Obstacles
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    // Orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(orb => {
      ctx.beginPath();
      ctx.arc(orb.x + orb.size / 2, orb.y + orb.size / 2, orb.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);

    requestAnimationFrame(loop);
  };

  // Start the loop
  requestAnimationFrame(loop);
})();
