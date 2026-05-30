// Simple Space Shield game implementation with enhanced graphics
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Make canvas fill the window but keep a fallback size
let shieldY = 0; // will be set in resizeCanvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // keep shield near bottom
  shieldY = canvas.height - 30;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let shieldAngle = 0; // radians
let shieldVelocity = 0; // for smoother turning
const shieldLen = 80;
let score = 0;
let running = true;

// Sound effects (replace URLs with actual files if available)
const deflectSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/deflect.wav');
const gameOverSound = new Audio('https://cdn.jsdelivr.net/gh/mdn/webaudio-examples/audio/game-over.wav');
// optional background music
// const bgMusic = new Audio('path/to/music.mp3');
// bgMusic.loop = true;
// bgMusic.volume = 0.3;
// bgMusic.play();

// starfield for background – moving stars
const stars = [];
for (let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
  });
}

// meteors array
const meteors = [];

function spawnMeteor() {
  const radius = 10 + Math.random() * 10;
  meteors.push({
    x: Math.random() * (canvas.width - 2 * radius) + radius,
    y: -radius,
    r: radius,
    vy: 2 + Math.random() * 2,
  });
}

let spawnTimer = 0;

// Input handling – smoother rotation
let keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;
  let xx, yy;
  if (param < 0) { xx = x1; yy = y1; }
  else if (param > 1) { xx = x2; yy = y2; }
  else { xx = x1 + param * C; yy = y1 + param * D; }
  const dx = px - xx; const dy = py - yy;
  return Math.hypot(dx, dy);
}

function update(dt) {
  if (!running) return;
  // smooth shield rotation based on keys
  const turnSpeed = 0.004 * dt; // radians per ms
  if (keys['ArrowLeft']) shieldVelocity = -turnSpeed;
  else if (keys['ArrowRight']) shieldVelocity = turnSpeed;
  else shieldVelocity *= 0.9; // damping
  shieldAngle += shieldVelocity;

  spawnTimer += dt;
  if (spawnTimer > 1000) { spawnMeteor(); spawnTimer = 0; }

  // update stars (moving background)
  for (let s of stars) {
    s.y += 0.05 * dt; // slow drift
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }

  // update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.vy;
    // collision with shield
    const sx = canvas.width / 2;
    const ex = sx + shieldLen * Math.cos(shieldAngle);
    const ey = shieldY + shieldLen * Math.sin(shieldAngle);
    const dist = distanceToSegment(m.x, m.y, sx, shieldY, ex, ey);
    if (dist < m.r) {
      score++;
      meteors.splice(i, 1);
      // play deflection sound
      if (deflectSound) deflectSound.currentTime = 0, deflectSound.play();
      continue;
    }
    // hit ground
    if (m.y - m.r > canvas.height) {
      running = false;
    }
  }
}

function draw() {
  // background gradient (space)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw moving stars
  ctx.fillStyle = '#fff';
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // draw shield with glow
  ctx.save();
  ctx.translate(canvas.width / 2, shieldY);
  ctx.rotate(shieldAngle);
  // glow effect
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, shieldLen);
  glow.addColorStop(0, 'rgba(0,255,255,0.6)');
  glow.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 8;
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(shieldLen, 0);
  ctx.stroke();
  ctx.restore();

  // draw meteors with gradient tail
  meteors.forEach(m => {
    const meteGrad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    meteGrad.addColorStop(0, 'rgba(255,140,0,0.9)');
    meteGrad.addColorStop(1, 'rgba(255,69,0,0.4)');
    ctx.fillStyle = meteGrad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // draw score
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);

  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '40px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '30px sans-serif';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
  }
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}
loop();
