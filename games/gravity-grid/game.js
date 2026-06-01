// Minimal Gravity Grid game implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Handle high‑DPI displays
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);
const W = canvas.width / dpr;
const H = canvas.height / dpr;
// Simple sound helper using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration = 0.1, type = 'sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
function playRotateSound() { playTone(300, 0.07); }
function playCollisionSound() { playTone(80, 0.3, 'square'); }
function playGameOverSound() { playTone(40, 0.6, 'sawtooth'); }

const SQUARE_SIZE = 20;
let square = { x: W/2 - SQUARE_SIZE/2, y: H/2 - SQUARE_SIZE/2, vx: 0, vy: 2 };
// gravity direction as unit vector
let gravity = { x: 0, y: 1 };

let spikes = [];
const SPIKE_SIZE = 10;
const SPIKE_SPEED = 1.5;
let gameOver = false;

function rotateGravity(dir) { // dir = -1 left, 1 right
  const { x, y } = gravity;
  if (dir === -1) { // CCW 90°
    gravity.x = -y;
    gravity.y = x;
  } else { // CW 90°
    gravity.x = y;
    gravity.y = -x;
  }
  playRotateSound();
}

function addSpike() {
  const edge = Math.floor(Math.random()*4); // 0 top,1 right,2 bottom,3 left
  let x, y, vx, vy;
  if (edge===0) { x = Math.random()*W; y = 0; }
  else if (edge===1) { x = W; y = Math.random()*H; }
  else if (edge===2) { x = Math.random()*W; y = H; }
  else { x = 0; y = Math.random()*H; }
  // direction toward square
  const dx = square.x - x;
  const dy = square.y - y;
  const len = Math.hypot(dx,dy) || 1;
  vx = (dx/len)*SPIKE_SPEED;
  vy = (dy/len)*SPIKE_SPEED;
  spikes.push({x, y, vx, vy});
}

function update() {
  if (gameOver) return;
  // move square
  square.x += gravity.x * square.vy;
  square.y += gravity.y * square.vy;
  // boundary check
  if (square.x < 0 || square.x+SQUARE_SIZE > W || square.y < 0 || square.y+SQUARE_SIZE > H) {
    playGameOverSound();
    gameOver = true;
    return;
  }
  // move spikes
  spikes.forEach(s => { s.x += s.vx; s.y += s.vy; });
  // collision check
  spikes.forEach(s => {
    if (s.x < square.x+SQUARE_SIZE && s.x+SPIKE_SIZE > square.x &&
        s.y < square.y+SQUARE_SIZE && s.y+SPIKE_SIZE > square.y) {
      playCollisionSound();
      gameOver = true;
    }
  });
  // remove off‑screen spikes
  spikes = spikes.filter(s => s.x >= -SPIKE_SIZE && s.x <= W && s.y >= -SPIKE_SIZE && s.y <= H);
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,W, H);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,W,H);
  // draw square with rounded corners and shadow
  ctx.fillStyle = '#4caf50';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 5;
  ctx.beginPath();
  ctx.moveTo(square.x + 5, square.y);
  ctx.lineTo(square.x + SQUARE_SIZE - 5, square.y);
  ctx.quadraticCurveTo(square.x + SQUARE_SIZE, square.y, square.x + SQUARE_SIZE, square.y + 5);
  ctx.lineTo(square.x + SQUARE_SIZE, square.y + SQUARE_SIZE - 5);
  ctx.quadraticCurveTo(square.x + SQUARE_SIZE, square.y + SQUARE_SIZE, square.x + SQUARE_SIZE - 5, square.y + SQUARE_SIZE);
  ctx.lineTo(square.x + 5, square.y + SQUARE_SIZE);
  ctx.quadraticCurveTo(square.x, square.y + SQUARE_SIZE, square.x, square.y + SQUARE_SIZE - 5);
  ctx.lineTo(square.x, square.y + 5);
  ctx.quadraticCurveTo(square.x, square.y, square.x + 5, square.y);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // draw spikes as triangles pointing toward the square
  ctx.fillStyle = '#e53935';
  spikes.forEach(s => {
    const angle = Math.atan2(square.y - s.y, square.x - s.x);
    const size = SPIKE_SIZE;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + Math.cos(angle) * size, s.y + Math.sin(angle) * size);
    ctx.lineTo(s.x + Math.cos(angle + Math.PI/2) * size/2, s.y + Math.sin(angle + Math.PI/2) * size/2);
    ctx.closePath();
    ctx.fill();
  });
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2);
  }
}

let lastSpike = 0;
function loop(ts) {
  if (gameOver) { draw(); return; }
  update();
  draw();
  if (ts - lastSpike > 1500) { addSpike(); lastSpike = ts; }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') rotateGravity(-1);
  else if (e.key === 'ArrowRight') rotateGravity(1);
});
