// Glitch Runner – enhanced graphics version
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const playJumpSound = () => beep(400, 100);
  const playSlideSound = () => beep(250, 80);
  const playCollisionSound = () => beep(120, 300);
  const playGlitchSound = () => {
    for (let i = 0; i < 3; i++) {
      beep(800 - i * 200, 50);
    }
  };
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 400;
  const GROUND = HEIGHT - 80;
  // Star field for background
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, size: Math.random() * 2 + 1 });
  }
  const PLAYER = { x: 50, y: GROUND, w: 30, h: 50, vy: 0, onGround: true, sliding: false };
  const GRAVITY = 0.5;
  const JUMP = -10;
  const SPEED = 3;
  let obstacles = [];
  let lastSpawn = 0;
  let score = 0;
  let glitch = false;
  let glitchTimer = 0;

  // input handling – invert during glitch
  const keyDown = e => {
    const invert = glitch;
    // Ensure AudioContext is running (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if ((e.code === 'Space' || e.code === 'ArrowUp') && (!invert)) jump();
    if ((e.code === 'Space' || e.code === 'ArrowUp') && invert) slide();
    if (e.code === 'ArrowDown' && (!invert)) slide();
    if (e.code === 'ArrowDown' && invert) jump();
  };
  const keyUp = e => { if (e.code === 'ArrowDown') PLAYER.sliding = false; };
  const jump = () => { if (PLAYER.onGround) { PLAYER.vy = JUMP; PLAYER.onGround = false; playJumpSound(); } };
  const slide = () => { if (PLAYER.onGround) { PLAYER.sliding = true; playSlideSound(); } };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);

  const spawnObstacle = () => {
    const type = Math.random() < 0.5 ? 'spike' : 'gap';
    if (type === 'spike') {
      obstacles.push({ x: WIDTH, y: GROUND - 30, w: 30, h: 30, type });
    } else {
      // gap: we create an invisible wall that the player must jump over; here we treat as low obstacle
      obstacles.push({ x: WIDTH, y: GROUND, w: 60, h: 10, type });
    }
  };

  const update = dt => {
    // Update star field positions for twinkling motion
    stars.forEach(s => {
      s.y += 0.2;
      if (s.y > HEIGHT) { s.y = 0; s.x = Math.random() * WIDTH; }
    });
    // player physics
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if (PLAYER.y >= GROUND) { PLAYER.y = GROUND; PLAYER.vy = 0; PLAYER.onGround = true; }
    else PLAYER.onGround = false;
    // adjust height when sliding
    PLAYER.h = PLAYER.sliding ? 30 : 50;
    // obstacles
    obstacles.forEach(o => o.x -= SPEED);
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    // spawn logic
    if (Date.now() - lastSpawn > 1500) { spawnObstacle(); lastSpawn = Date.now(); }
    // collision
    for (const o of obstacles) {
      if (rectIntersect(PLAYER, o)) { gameOver(); return; }
    }
    // glitch timer
    if (!glitch && Math.random() < 0.001) { glitch = true; glitchTimer = 2000; playGlitchSound(); }
    if (glitch) { glitchTimer -= dt; if (glitchTimer <= 0) glitch = false; }
    // score
    score += dt * 0.01;
    draw();
    requestAnimationFrame(timestamp => update(timestamp - lastTimestamp));
  };

  const rectIntersect = (a, b) => {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  // Draw background gradient, player, obstacles, and optional glitch overlay
// Helper to draw rounded rectangles
const drawRoundedRect = (x, y, w, h, r, fillStyle) => {
  ctx.fillStyle = fillStyle;
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
};
// Helper to draw player (body + head)
const drawPlayer = () => {
  // body
  drawRoundedRect(PLAYER.x, PLAYER.y - PLAYER.h, PLAYER.w, PLAYER.h, 5, '#0f0');
  // head as small circle
  const headRadius = PLAYER.w * 0.4;
  ctx.beginPath();
  ctx.arc(PLAYER.x + PLAYER.w / 2, PLAYER.y - PLAYER.h - headRadius, headRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0';
  ctx.fill();
};
// Helper to draw spike obstacle (triangle)
const drawSpike = (o) => {
  ctx.fillStyle = '#f00';
  ctx.beginPath();
  ctx.moveTo(o.x, o.y);
  ctx.lineTo(o.x + o.w / 2, o.y - o.h);
  ctx.lineTo(o.x + o.w, o.y);
  ctx.closePath();
  ctx.fill();

// Draw background gradient, player, obstacles, and optional glitch overlay
const draw = () => {
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Apply glitch filter if active
    if (glitch) ctx.filter = 'invert(1)'; else ctx.filter = 'none';
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#1a1a2e');
    bgGrad.addColorStop(1, '#16213e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw moving star field (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ground as rounded rectangle
    drawRoundedRect(0, GROUND, WIDTH, HEIGHT - GROUND, 20, '#111');
    // Draw player with rounded corners and head
    drawPlayer();
    // Draw obstacles with rounded corners
obstacles.forEach(o => {
  if (o.type === 'spike') {
    drawSpike(o);
  } else {
    drawRoundedRect(o.x, o.y - o.h, o.w, o.h, 5, '#f00');
  }
});
    // Glitch overlay: tiny white noise
    if (glitch) {
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(Math.random() * WIDTH, Math.random() * HEIGHT, 1, 1);
      }
    }
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  };

  const gameOver = () => {
  playCollisionSound();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#ff0';
    ctx.font = '24px monospace';
    ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
    ctx.fillText('Score: ' + Math.floor(score), WIDTH / 2 - 70, HEIGHT / 2 + 30);
    // stop loop
    window.removeEventListener('keydown', keyDown);
    window.removeEventListener('keyup', keyUp);
  };

  let lastTimestamp = performance.now();
  requestAnimationFrame(ts => { lastTimestamp = ts; update(0); });
})();
