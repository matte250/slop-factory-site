const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Simple sound helper
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

let width = canvas.clientWidth;
let height = canvas.clientHeight;
// Adjust for high‑DPI displays
const dpr = window.devicePixelRatio || 1;
canvas.width = width * dpr;
canvas.height = height * dpr;
ctx.scale(dpr, dpr);
// Starfield background
const stars = [];
// Particle trail
const particles = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  });
}
function drawStars() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function updateParticles() {
  // Move particles outward and fade them
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += (Math.random() - 0.5) * 2; // slight jitter
    p.y += (Math.random() - 0.5) * 2;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  ctx.fillStyle = 'orange';
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

let x = width / 2;
let y = height / 2;
let vx = 2;
let vy = 2;
const radius = 15;
let hue = 0; // Current hue for ball color

function update() {
  x += vx;
  y += vy;
  let bounced = false;
  if (x + radius > width || x - radius < 0) { vx = -vx; bounced = true; }
  if (y + radius > height || y - radius < 0) { vy = -vy; bounced = true; }
  if (bounced) {
    // Change ball hue on bounce for visual effect
    hue = Math.floor(Math.random() * 360);
    // Play bounce sound (frequency varies with speed)
    const speed = Math.hypot(vx, vy);
    const freq = 200 + speed * 50; // basic pitch mapping
    playTone(freq, 0.1);
  }
}

function draw() {
  // Render starfield background
  drawStars();

  // Update and draw particle trail
  updateParticles();
  drawParticles();
  // Spawn a new particle at the ball's position
  particles.push({ x, y, r: radius * 0.3, alpha: 1 });

  // Draw ball with gradient and shadow
  const gradient = ctx.createRadialGradient(x, y, radius * 0.2, x, y, radius);
  gradient.addColorStop(0, '#fff');
  gradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  // Reset shadow for other drawings
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  width = canvas.width = canvas.clientWidth;
  height = canvas.height = canvas.clientHeight;
});

loop();
