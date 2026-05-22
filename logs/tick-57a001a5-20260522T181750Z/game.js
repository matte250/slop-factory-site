// Simple Neon Grid Escape game based on IDEA.md
const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
let orb = { x: canvas.width / 2, y: canvas.height / 2, r: 10, vx: 0, vy: 2 };
let orbTrail = [];
let obstacles = [];
let speed = 2;
let score = 0;
let lastObstacle = 0;
function addObstacle() {
  const size = 20 + Math.random() * 30;
  const side = Math.floor(Math.random() * 4);
  let x, y, dx, dy;
  switch (side) {
    case 0: // left
      x = -size; y = Math.random() * canvas.height; dx = speed; dy = 0; break;
    case 1: // right
      x = canvas.width + size; y = Math.random() * canvas.height; dx = -speed; dy = 0; break;
    case 2: // top
      x = Math.random() * canvas.width; y = -size; dx = 0; dy = speed; break;
    case 3: // bottom
      x = Math.random() * canvas.width; y = canvas.height + size; dx = 0; dy = -speed; break;
  }
  obstacles.push({ x, y, r: size / 2, dx, dy });
}
function update(dt) {
  // Update orb position
  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;

  // Add current position to trail
  orbTrail.push({ x: orb.x, y: orb.y, alpha: 1 });
  // Fade trail particles
  orbTrail = orbTrail.map(p => ({ ...p, alpha: p.alpha - 0.02 })).filter(p => p.alpha > 0.05);

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
  if (orb.x < 0 || orb.x > canvas.width || orb.y < 0 || orb.y > canvas.height) gameOver();
  obstacles.forEach(o => { o.x += o.dx * dt; o.y += o.dy * dt; });
  obstacles = obstacles.filter(o => o.x > -50 && o.x < canvas.width + 50 && o.y > -50 && o.y < canvas.height + 50);
  for (let o of obstacles) {
    const dx = o.x - orb.x, dy = o.y - orb.y;
    if (Math.hypot(dx, dy) < o.r + orb.r) gameOver();
  }
  if (performance.now() - lastObstacle > 1500) { addObstacle(); lastObstacle = performance.now(); }
  speed += 0.00001;
  orb.vx = 0; orb.vy = speed;
  score += dt * 0.01;
}
let last = performance.now();
let running = true;
function loop() {
  if (!running) return;
  const now = performance.now();
  const dt = (now - last) / 16; // normalize to ~60fps
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
function draw() {
  // Draw neon grid background
  const gridSize = 40;
  ctx.strokeStyle = '#0f0f0f';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Draw trailing particles
  if (orbTrail) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    orbTrail.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
      ctx.fill();
    });
    ctx.restore();
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,255,255,0.9)';
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  ctx.fillStyle = 'magenta';
  for (let o of obstacles) {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = 'white';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);
}
function gameOver() {
  running = false;
  ctx.fillStyle = 'red';
  ctx.font = '40px sans-serif';
  ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
}
canvas.addEventListener('click', () => {
  // Ensure audio context is resumed on first user interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // Play a tone when direction changes
  playTone(400, 0.1);
  const nx = orb.vy;
  const ny = -orb.vx;
  orb.vx = nx;
  orb.vy = ny;
});
  const nx = orb.vy;
  const ny = -orb.vx;
  orb.vx = nx;
  orb.vy = ny;
});
loop();
