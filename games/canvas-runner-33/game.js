// Simple side‑scroll runner targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 200;

  const player = { x: 50, y: HEIGHT - 30, w: 20, h: 30, vy: 0, jumpForce: -8, grounded: true };
  const GRAVITY = 0.4;
  const obstacles = [];
  let obstacleTimer = 0;
  const OBSTACLE_FREQ = 90; // frames
  let score = 0;
  let frame = 0;

  // Draw background gradient and ground line
const drawBackground = () => {
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, '#a3d5ff'); // sky
  grad.addColorStop(1, '#87ceeb'); // lower sky
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // ground
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
};

// Draw player as a rounded rectangle
const drawPlayer = () => {
  const r = 5; // corner radius
  ctx.fillStyle = '#07f';
  ctx.beginPath();
  ctx.moveTo(player.x + r, player.y);
  ctx.lineTo(player.x + player.w - r, player.y);
  ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
  ctx.lineTo(player.x + player.w, player.y + player.h - r);
  ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
  ctx.lineTo(player.x + r, player.y + player.h);
  ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
  ctx.lineTo(player.x, player.y + r);
  ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
  ctx.closePath();
  ctx.fill();
};

// Draw obstacle: rectangle block or triangular spike
const drawObstacle = (o) => {
  ctx.fillStyle = '#d00';
  if (o.w === o.h) { // spike
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h);
    ctx.lineTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.closePath();
    ctx.fill();
  } else { // block
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }
};

  const spawnObstacle = () => {
    const size = Math.random() < 0.5 ? 20 : 30; // spike or block
    obstacles.push({ x: WIDTH, y: HEIGHT - size, w: size, h: size, passed: false });
  };

  const update = () => {
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= HEIGHT) {
      player.y = HEIGHT - player.h;
      player.vy = 0;
      player.grounded = true;
    }
    // obstacles
    obstacleTimer++;
    if (obstacleTimer > OBSTACLE_FREQ) { spawnObstacle(); obstacleTimer = 0; }
    obstacles.forEach(o => o.x -= 4);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // collision
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) { playHit();
        // reset game on collision
        obstacles.length = 0;
        score = 0;
        player.y = HEIGHT - player.h;
        player.vy = 0;
        break;
      }
      if (!o.passed && o.x + o.w < player.x) { o.passed = true; score++; }
    }
    // render
    drawBackground();
    drawPlayer();
    obstacles.forEach(drawObstacle);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    frame++;
    requestAnimationFrame(update);
  };

  // Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.stop(audioCtx.currentTime + duration / 1000);
}
function playJump() { beep(440, 100); }
function playHit() { beep(100, 300); }
// jump on click/touch
  const jump = () => {
    // Ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (player.grounded) { player.vy = player.jumpForce; player.grounded = false; playJump(); }
  };
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); jump(); }, { passive: false });

  update();
})();
