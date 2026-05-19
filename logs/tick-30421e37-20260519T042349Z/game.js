// Enhanced asteroid dodge game targeting <canvas id="game"></canvas>
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// ----- Audio setup -----
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Resume audio on first user interaction
function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  window.removeEventListener('keydown', resumeAudio);
  window.removeEventListener('click', resumeAudio);
}
window.addEventListener('keydown', resumeAudio);
window.addEventListener('click', resumeAudio);

// ----- Game state -----
let ship = { x: canvas.width / 2, y: canvas.height - 30, w: 30, h: 20, speed: 6 };
let asteroids = [];
let score = 0;
let lastAsteroid = 0;
let gameOver = false;

// background stars for visual depth
const STAR_COUNT = 100;
const stars = Array.from({length: STAR_COUNT}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
  alpha: Math.random()
}));

// ----- Input -----
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function updateShip() {
  if (keys.ArrowLeft) ship.x -= ship.speed;
  if (keys.ArrowRight) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
}

function spawnAsteroid() {
  const size = Math.random() * 30 + 10;
  const x = Math.random() * (canvas.width - size);
  const speed = 2 + Math.random() * 3 + score * 0.02; // faster scaling
  asteroids.push({ x, y: -size, size, speed });
  // subtle spawn sound
  playBeep(200, 0.05);
}

function updateAsteroids(dt) {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    if (a.y - a.size > canvas.height) {
      asteroids.splice(i, 1);
      score++;
      // point sound
      playBeep(800, 0.03);
    } else if (rectCircleCollide(ship, a)) {
      gameOver = true;
      // collision sound
      playBeep(100, 0.3);
    }
  }
}

function rectCircleCollide(rect, circle) {
  const distX = Math.abs(circle.x + circle.size / 2 - (rect.x + rect.w / 2));
  const distY = Math.abs(circle.y + circle.size / 2 - (rect.y + rect.h / 2));
  if (distX > rect.w / 2 + circle.size / 2) return false;
  if (distY > rect.h / 2 + circle.size / 2) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= (circle.size / 2) * (circle.size / 2);
}

function drawBackground() {
  // space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // twinkling stars
  stars.forEach(s => {
    s.alpha += (Math.random() - 0.5) * 0.02;
    s.alpha = Math.max(0, Math.min(1, s.alpha));
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  drawBackground();
  // ship (filled triangle with outline)
  ctx.fillStyle = '#0ff';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // asteroids with radial gradient for 3D look
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2, a.y + a.size / 2, a.size * 0.1,
      a.x + a.size / 2, a.y + a.size / 2, a.size / 2
    );
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // score overlay
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4040';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = performance.now();
function loop(time) {
  const dt = time - lastTime;
  lastTime = time;
  if (!gameOver) {
    updateShip();
    if (time - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = time; }
    updateAsteroids(dt);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
