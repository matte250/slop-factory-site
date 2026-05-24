// Endless runner (Canvas Runner) – concise implementation
// Assumes a <canvas id="game"></canvas> is present in the page.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 200;

  // Sound assets (simple data URLs)
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQEAAAA='); // short click
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQIAAAAA'); // short thump
  const bgMusic = new Audio('data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQsAAAAA'); // placeholder silence loop
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  // start music after user interacts (first keydown)
  let musicStarted = false;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const SPEED = 4; // scroll speed (px/frame)
  const GROUND_Y = HEIGHT - 30; // platform height

  const player = {x: 50, y: GROUND_Y - 20, w: 20, h: 20, vy: 0, onGround: true};
  let platforms = [{x: 0, w: WIDTH, y: GROUND_Y}]; // start with full ground
  let obstacles = [];
  let clouds = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') keys[e.code] = true; if (!musicStarted) { bgMusic.play(); musicStarted = true; } });
  window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp') keys[e.code] = false; });

  function spawnSegment() {
    // Randomly create a gap or obstacle on the next segment
    const segWidth = 120 + Math.random() * 80; // 120‑200px segment
    const gap = Math.random() < 0.2; // 20% chance to have a gap
    const lastX = platforms.length ? platforms[platforms.length - 1].x + platforms[platforms.length - 1].w : WIDTH;
    if (gap) {
      // add empty space (no platform) – player will fall if not timed
      platforms.push({x: lastX + segWidth, w: segWidth, y: GROUND_Y});
    } else {
      platforms.push({x: lastX, w: segWidth, y: GROUND_Y});
    }
    // Occasionally add an obstacle on the platform
    if (!gap && Math.random() < 0.3) {
      const obsW = 15, obsH = 30;
      const obsX = lastX + segWidth / 2 - obsW / 2;
      obstacles.push({x: obsX, y: GROUND_Y - obsH, w: obsW, h: obsH});
    }
  }

  // Create a simple cloud for background
  function spawnCloud() {
    const w = 40 + Math.random() * 30; // width 40‑70
    const h = w * 0.6;
    const x = WIDTH;
    const y = Math.random() * (GROUND_Y - 80); // stay above ground
    clouds.push({x, y, w, h});
  }

  function update() {
    if (gameOver) return;
    // Input
    if ((keys['Space'] || keys['ArrowUp']) && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
    // Physics
    player.vy += GRAVITY;
    player.y += player.vy;
    // Simple ground check against platforms under player
    player.onGround = false;
    for (const p of platforms) {
      if (player.x + player.w > p.x && player.x < p.x + p.w) {
        const platformTop = p.y;
        if (player.y + player.h >= platformTop && player.y + player.h - player.vy < platformTop) {
          player.y = platformTop - player.h;
          player.vy = 0;
          player.onGround = true;
        }
      }
    }
    // Fall off screen = lose
    if (player.y > HEIGHT) gameOver = true;
    // Move world left
    for (const p of platforms) p.x -= SPEED;
    for (const o of obstacles) o.x -= SPEED;
    // Move clouds (parallax, slower)
    for (const c of clouds) c.x -= SPEED * 0.5;
    // Remove off‑screen entities
    platforms = platforms.filter(p => p.x + p.w > 0);
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    clouds = clouds.filter(c => c.x + c.w > 0);
    // Spawn new terrain as needed
    if (platforms.length === 0 || platforms[platforms.length - 1].x + platforms[platforms.length - 1].w < WIDTH) {
      spawnSegment();
    }
    // Occasionally spawn clouds
    if (Math.random() < 0.02) spawnCloud();
    // Collision with obstacles
    for (const o of obstacles) {
      const coll = player.x < o.x + o.w && player.x + player.w > o.x &&
                   player.y < o.y + o.h && player.y + player.h > o.y;
      if (coll) { hitSound.currentTime = 0; hitSound.play(); gameOver = true; break; }
    }
    // Score based on distance
    score = Math.floor(frame / 60);
    frame++;
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw background sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw clouds (parallax)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw platforms with slight shading
    const platGrad = ctx.createLinearGradient(0, GROUND_Y - 10, 0, GROUND_Y);
    platGrad.addColorStop(0, '#777');
    platGrad.addColorStop(1, '#444');
    ctx.fillStyle = platGrad;
    for (const p of platforms) ctx.fillRect(p.x, p.y, p.w, HEIGHT - p.y);
    // Draw obstacles as dark triangles
    ctx.fillStyle = '#800';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    }
    // Draw player as a rounded square with gradient
    const pGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    pGrad.addColorStop(0, '#4caf50');
    pGrad.addColorStop(1, '#087f23');
    ctx.fillStyle = pGrad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // UI
    ctx.fillStyle = '#000';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,WIDTH,HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', WIDTH/2-70, HEIGHT/2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Kick off
  spawnSegment(); // initial extra segment
  requestAnimationFrame(loop);
});
