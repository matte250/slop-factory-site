// Minimal Pixel Escape game – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 400;

// Game state
let player = {x: 180, y: 180, size: 20, speed: 3};
let obstacles = [];
let lives = 3;
let time = 30; // seconds
let lastSpawn = 0;
let lastTick = performance.now();
let keys = {};

function spawnObstacle() {
  const size = 20;
  const side = Math.random() < 0.5 ? 'top' : 'left';
  const ob = {
    x: side === 'top' ? Math.random() * (canvas.width - size) : -size,
    y: side === 'top' ? -size : Math.random() * (canvas.height - size),
    size,
    vx: side === 'top' ? 0 : 2 + Math.random() * 2,
    vy: side === 'top' ? 2 + Math.random() * 2 : 0,
  };
  obstacles.push(ob);
}

function update(dt) {
  // Move player
  if (keys['ArrowUp']) player.y -= player.speed;
  if (keys['ArrowDown']) player.y += player.speed;
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;
  // Keep inside canvas
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

  // Spawn obstacles every 1 sec
  if (performance.now() - lastSpawn > 1000) {
    spawnObstacle();
    lastSpawn = performance.now();
  }

  // Move obstacles
  obstacles.forEach(o => {
    o.x += o.vx * dt / 16;
    o.y += o.vy * dt / 16;
  });
  // Remove off-screen obstacles
  obstacles = obstacles.filter(o => o.x < canvas.width && o.y < canvas.height);

  // Collision detection
  obstacles.forEach((o, i) => {
    if (rectIntersect(player, o)) {
      lives--;
      obstacles.splice(i, 1);
      playCollision();
    }
  });

  // Timer
  time -= dt / 1000;
  if (time <= 0 || lives <= 0) {
    cancelAnimationFrame(animId);
    draw();
    playGameOver();
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', 140, 200);
    return false;
  }
  return true;
}

function rectIntersect(a, b) {
  return a.x < b.x + b.size && a.x + a.size > b.x &&
         a.y < b.y + b.size && a.y + a.size > b.y;
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#222');
  bgGrad.addColorStop(1, '#555');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper for rounded rectangle
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }

  // Player – glow circle
  const playerGrad = ctx.createRadialGradient(
    player.x + player.size / 2,
    player.y + player.size / 2,
    0,
    player.x + player.size / 2,
    player.y + player.size / 2,
    player.size
  );
  playerGrad.addColorStop(0, '#00f');
  playerGrad.addColorStop(1, '#004');
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Obstacles – rounded red squares with slight gradient
  obstacles.forEach(o => {
    const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x + o.size, o.y + o.size);
    obsGrad.addColorStop(0, '#b00');
    obsGrad.addColorStop(1, '#400');
    drawRoundedRect(o.x, o.y, o.size, o.size, 4, obsGrad);
  });

  // UI – semi‑transparent overlay
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Lives: ${lives}`, 10, 20);
  ctx.fillText(`Time: ${Math.max(0, Math.floor(time))}`, 300, 20);
}

let animId;
function loop(timestamp) {
  const dt = timestamp - lastTick;
  lastTick = timestamp;
  if (update(dt)) {
    draw();
    animId = requestAnimationFrame(loop);
  }
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playCollision() { playTone(200, 0.1); }
function playGameOver() { playTone(100, 0.5); }

// Input handling
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
window.addEventListener('keyup', e => {keys[e.key] = false;});

// Start game
requestAnimationFrame(loop);
