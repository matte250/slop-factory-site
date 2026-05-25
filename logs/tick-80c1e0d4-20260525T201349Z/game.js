// Canvas Catch game
// Canvas element with id "game" must exist in the HTML.

const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas element with id "game" not found');
}
const ctx = canvas.getContext('2d');

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(frequency, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
function playCatchSound() { playBeep(400, 0.1); }
function playGameOverSound() { playBeep(150, 0.3); }
function startBackgroundMusic() {
  // simple repeating low‑frequency hum
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  // keep reference to stop later if needed
  window._bgOsc = osc;
}
// start music on first user interaction
window.addEventListener('click', function initAudio(){
  if (audioCtx.state === 'suspended') audioCtx.resume();
  startBackgroundMusic();
  window.removeEventListener('click', initAudio);
});


// Resize canvas to fill its container
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resize);
resize();

// Game state
let player = { x: canvas.width / 2, y: canvas.height - 30, radius: 15, speed: 5 };
let stars = [];
let score = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;
let gameOver = false;

// Input handling (arrow keys / WASD)
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnStar() {
  const radius = 8 + Math.random() * 8;
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const speed = 1 + Math.random() * 2;
  stars.push({ x, y: -radius, radius, speed });
}
setInterval(spawnStar, 1000);

function update() {
  if (gameOver) return;
  if (keys.ArrowLeft || keys.a) player.x -= player.speed;
  if (keys.ArrowRight || keys.d) player.x += player.speed;
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.speed;
    const dx = s.x - player.x;
    const dy = s.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < s.radius + player.radius) {
      score++;
      stars.splice(i, 1);
      playCatchSound();
      continue;
    }
    if (s.y - s.radius > canvas.height) {
      gameOver = true;
      playGameOverSound();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }
      break;
    }
  }
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // twinkling background stars
  ctx.fillStyle = '#222';
  for (let i = 0; i < 50; i++) {
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    const r = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // player with radial gradient
  const pGrad = ctx.createRadialGradient(
    player.x, player.y, player.radius * 0.2,
    player.x, player.y, player.radius
  );
  pGrad.addColorStop(0, '#0f0');
  pGrad.addColorStop(1, '#060');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // stars with glow
  stars.forEach(s => {
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`High: ${highScore}`, 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f55';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
}