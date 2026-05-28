// Simple canvas game based on IDEA.md
// Player: white square (20x20) controlled by arrow keys
// Obstacles: red circles drifting horizontally
// Power‑ups: green squares that briefly slow obstacles

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// ----- Audio setup -----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context resumes on first user interaction
window.addEventListener('click', () => audioCtx.resume(), { once: true });
window.addEventListener('keydown', () => audioCtx.resume(), { once: true });

function beep(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur / 1000);
}

function playCollision() { beep(200, 200); }
function playPowerUpSound() { beep(800, 150); }
function playScoreTick() { beep(400, 50); }

// ----- Game state -----
const player = { x: canvas.width / 2 - 10, y: canvas.height - 30, size: 20, speed: 4 };
let keys = {};
let obstacles = [];
let powerUps = [];
let score = 0;
let slowMultiplier = 1; // slows obstacles when power‑up active
let powerTimer = 0;
let gameOver = false;
let lastScoreTick = 0; // track when to play tick sound

// ----- Input handling -----
window.addEventListener('keydown', e => (keys[e.key] = true));
window.addEventListener('keyup', e => (keys[e.key] = false));

function spawnObstacle() {
  const radius = 15 + Math.random() * 10;
  const y = Math.random() * (canvas.height - 200) + 50;
  const speed = (1 + Math.random() * 1.5) * slowMultiplier;
  const direction = Math.random() < 0.5 ? -1 : 1; // left or right
  const type = Math.random() < 0.5 ? 'triangle' : 'circle';
  const color = type === 'triangle' ? '#f90' : '#ff6666'; // orange for triangles, red for circles
  obstacles.push({ x: direction === 1 ? -radius : canvas.width + radius, y, radius, speed: speed * direction, type, color });
}

function spawnPowerUp() {
  const size = 15;
  const x = Math.random() * (canvas.width - size);
  const y = Math.random() * (canvas.height - size);
  powerUps.push({ x, y, size, active: true });
}

function update(delta) {
  if (gameOver) return;

  // player movement
  if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
  if (keys['ArrowRight'] && player.x + player.size < canvas.width) player.x += player.speed;
  if (keys['ArrowUp'] && player.y > 0) player.y -= player.speed;
  if (keys['ArrowDown'] && player.y + player.size < canvas.height) player.y += player.speed;

  // obstacles update
  obstacles.forEach(o => {
    o.x += o.speed * (delta / 16);
  });
  // remove off‑screen obstacles
  obstacles = obstacles.filter(o => o.x + o.radius > 0 && o.x - o.radius < canvas.width);

  // power‑up timer
  if (powerTimer > 0) {
    powerTimer -= delta;
    if (powerTimer <= 0) {
      slowMultiplier = 1;
    }
  }

  // collisions
  // player vs obstacles
  for (let o of obstacles) {
    const dx = (player.x + player.size / 2) - o.x;
    const dy = (player.y + player.size / 2) - o.y;
    const dist = Math.hypot(dx, dy);
    if (dist < o.radius + player.size / 2) {
      playCollision();
      gameOver = true;
      break;
    }
  }

  // player vs power‑ups
  powerUps = powerUps.filter(p => {
    if (!p.active) return false;
    const coll = !(player.x > p.x + p.size || player.x + player.size < p.x || player.y > p.y + p.size || player.y + player.size < p.y);
    if (coll) {
      playPowerUpSound();
      slowMultiplier = 0.4;
      powerTimer = 5000; // 5 seconds
      return false; // consume
    }
    return true;
  });

  // score increments by time survived
  score += delta / 1000;
  // play tick sound each whole second
  if (Math.floor(score) > lastScoreTick) {
    playScoreTick();
    lastScoreTick = Math.floor(score);
  }

  // spawn logic (simple intervals)
  if (Math.random() < 0.02) spawnObstacle(); // roughly every 50 frames
  if (Math.random() < 0.001) spawnPowerUp(); // occasional
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#002');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // player with rounded corners, gradient, and shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  const pGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.size, player.y + player.size);
  pGrad.addColorStop(0, '#fff');
  pGrad.addColorStop(1, '#ddd');
  ctx.fillStyle = pGrad;
  const r = 4; // corner radius
  ctx.beginPath();
  ctx.moveTo(player.x + r, player.y);
  ctx.lineTo(player.x + player.size - r, player.y);
  ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
  ctx.lineTo(player.x + player.size, player.y + player.size - r);
  ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
  ctx.lineTo(player.x + r, player.y + player.size);
  ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
  ctx.lineTo(player.x, player.y + r);
  ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // obstacles: circles and triangles with individual colors
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    if (o.type === 'triangle') {
      const size = o.radius * 2;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y - o.radius);
      ctx.lineTo(o.x - o.radius, o.y + o.radius);
      ctx.lineTo(o.x + o.radius, o.y + o.radius);
      ctx.closePath();
      ctx.fill();
    } else { // default circle
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // power‑ups with radial gradient glow
  powerUps.forEach(p => {
    const grad = ctx.createRadialGradient(p.x + p.size/2, p.y + p.size/2, p.size/4, p.x + p.size/2, p.y + p.size/2, p.size/2);
    grad.addColorStop(0, '#6f6');
    grad.addColorStop(1, '#2a2');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x + p.size/2, p.y + p.size/2, p.size/2, 0, Math.PI*2);
    ctx.fill();
  });

  // UI – score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px sans-serif';
    ctx.fillText('Final Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);
  }
}

let last = 0;
function loop(ts) {
  const delta = ts - last;
  last = ts;
  update(delta);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
