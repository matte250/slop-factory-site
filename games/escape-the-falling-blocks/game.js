// Simple bouncing ball game targeting <canvas id="game">
const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas with id "game" not found');
}
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Resume audio on user interaction
canvas.addEventListener('click', () => audioCtx.resume());
function beep(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.08);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resize);
resize();

let x = canvas.width / 2;
let y = canvas.height / 2;
let vx = 2;
let vy = 3;
const r = 15;
const col = '#ff5722';

function update() {
  x += vx;
  y += vy;
  let bounced = false;
  if (x + r > canvas.width || x - r < 0) {
    vx = -vx;
    bounced = true;
  }
  if (y + r > canvas.height || y - r < 0) {
    vy = -vy;
    bounced = true;
  }
  if (bounced) beep();
}

function draw() {
  // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw ball with radial gradient and shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 15;
  const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, col);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
