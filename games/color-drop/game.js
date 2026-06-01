const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const COLORS = ['red', 'green', 'blue', 'yellow'];
let score = 0;
let gameOver = false;

// Audio context and helper
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'sine', duration = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Ensure audio context is resumed on first user interaction
function resumeAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  document.removeEventListener('click', resumeAudio);
  document.removeEventListener('keydown', resumeAudio);
}
document.addEventListener('click', resumeAudio);
document.addEventListener('keydown', resumeAudio);

// catcher
const catcher = {
  width: 120,
  height: 20,
  x: canvas.width / 2 - 60,
  y: canvas.height - 20,
  stack: [] // array of colors
};

// circles falling
const circles = [];
let lastSpawn = 0;
const SPAWN_INTERVAL = 1000; // ms
const CIRCLE_RADIUS = 15;

function randColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function spawnCircle(time) {
  circles.push({
    x: Math.random() * (canvas.width - CIRCLE_RADIUS * 2) + CIRCLE_RADIUS,
    y: -CIRCLE_RADIUS,
    radius: CIRCLE_RADIUS,
    color: randColor(),
    speed: 2 + Math.random() * 2
  });
  lastSpawn = time;
}

function update(dt) {
  if (gameOver) return;
  // move circles
  circles.forEach(c => c.y += c.speed);
  // remove off‑screen circles
  for (let i = circles.length - 1; i >= 0; i--) {
    const c = circles[i];
    if (c.y - c.radius > canvas.height) circles.splice(i, 1);
  }
  // collision detection
  const topStackColor = catcher.stack.length ? catcher.stack[catcher.stack.length - 1] : null;
  for (let i = circles.length - 1; i >= 0; i--) {
    const c = circles[i];
    const withinX = c.x > catcher.x && c.x < catcher.x + catcher.width;
    const atCatcher = c.y + c.radius >= catcher.y;
    if (withinX && atCatcher) {
      if (!topStackColor || c.color === topStackColor) {
        score++;
        playSound(800, 'sine', 0.1); // correct catch sound
      } else {
        catcher.stack.push(c.color);
        playSound(200, 'sawtooth', 0.2); // wrong color sound
        if ((catcher.stack.length + 1) * (CIRCLE_RADIUS * 2) >= canvas.height) {
          gameOver = true;
          playSound(100, 'triangle', 0.5); // game over sound
        }
      }
      circles.splice(i, 1);
    }
  }
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001133');
  bgGrad.addColorStop(1, '#003366');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw circles with radial gradient shading
  circles.forEach(c => {
    const grad = ctx.createRadialGradient(
      c.x - c.radius * 0.3,
      c.y - c.radius * 0.3,
      c.radius * 0.2,
      c.x,
      c.y,
      c.radius
    );
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.5, c.color);
    grad.addColorStop(1, 'black');
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.stroke();
  });

  // draw stack with slight shadow
  catcher.stack.forEach((col, idx) => {
    const y = catcher.y - (idx + 1) * CIRCLE_RADIUS * 2 + CIRCLE_RADIUS;
    const grad = ctx.createRadialGradient(
      catcher.x + catcher.width / 2 - CIRCLE_RADIUS * 0.3,
      y - CIRCLE_RADIUS * 0.3,
      CIRCLE_RADIUS * 0.2,
      catcher.x + catcher.width / 2,
      y,
      CIRCLE_RADIUS
    );
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.5, col);
    grad.addColorStop(1, 'black');
    ctx.beginPath();
    ctx.arc(catcher.x + catcher.width / 2, y, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.stroke();
  });

  // draw catcher with gradient and shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  const catcherGrad = ctx.createLinearGradient(catcher.x, catcher.y, catcher.x, catcher.y + catcher.height);
  catcherGrad.addColorStop(0, '#777');
  catcherGrad.addColorStop(1, '#333');
  ctx.fillStyle = catcherGrad;
  ctx.fillRect(catcher.x, catcher.y, catcher.width, catcher.height);
  ctx.restore();

  // draw score with bright text
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (timestamp - lastSpawn > SPAWN_INTERVAL) spawnCircle(timestamp);
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// mouse control
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  catcher.x = Math.min(Math.max(mx - catcher.width / 2, 0), canvas.width - catcher.width);
});

// restart on click after game over
canvas.addEventListener('click', () => {
  if (!gameOver) return;
  score = 0;
  gameOver = false;
  catcher.stack = [];
  circles.length = 0;
  lastSpawn = 0;
  requestAnimationFrame(loop);
});

requestAnimationFrame(loop);
