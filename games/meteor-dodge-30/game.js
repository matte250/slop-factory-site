// Meteor Dodge Game – enhanced graphics
// Target canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Background stars
const stars = [];
const starCount = 100;
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  });
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
function playSpawnSound() { playTone(400, 0.08); }
function playCollisionSound() { playTone(200, 0.3); }

// Player ship (triangle)
const ship = {
  w: 30,
  h: 30,
  x: canvas.width / 2 - 15,
  y: canvas.height - 40,
  speed: 4,
  dx: 0,
  dy: 0,
};

// Meteors
const meteors = [];
const meteorSize = 20; // used as diameter for drawing circles
const spawnInterval = 1000; // ms
let lastSpawn = 0;

let score = 0;
let startTime = null;
let gameOver = false;

function drawShip() {
  // draw ship as an upward pointing triangle
  ctx.fillStyle = 'cyan';
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w / 2, ship.y); // tip
  ctx.lineTo(ship.x, ship.y + ship.h); // bottom left
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // bottom right
  ctx.closePath();
  ctx.fill();
}

function drawMeteors() {
  meteors.forEach(m => {
    const gradient = ctx.createRadialGradient(
      m.x + meteorSize / 2,
      m.y + meteorSize / 2,
      0,
      m.x + meteorSize / 2,
      m.y + meteorSize / 2,
      meteorSize / 2
    );
    gradient.addColorStop(0, 'lightgray');
    gradient.addColorStop(1, 'darkgray');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(m.x + meteorSize / 2, m.y + meteorSize / 2, meteorSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStars() {
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateMeteors(dt) {
  meteors.forEach(m => m.y += m.speed * dt);
  // remove off‑screen
  for (let i = meteors.length - 1; i >= 0; i--) {
    if (meteors[i].y > canvas.height) meteors.splice(i, 1);
  }
}

function spawnMeteor() {
  const x = Math.random() * (canvas.width - meteorSize);
  meteors.push({ x, y: -meteorSize, speed: 0.1 + Math.random() * 0.2 });
  playSpawnSound();
}

function rectIntersect(a, b) {
  return a.x < b.x + meteorSize && a.x + a.w > b.x && a.y < b.y + meteorSize && a.y + a.h > b.y;
}

function checkCollisions() {
  for (const m of meteors) {
    if (rectIntersect(ship, m)) {
      gameOver = true;
      playCollisionSound();
      break;
    }
  }
}

function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Time: ' + Math.floor(score) + 's', 10, 20);
}

function update(dt) {
  if (gameOver) return;
  ship.x += ship.dx * ship.speed;
  ship.y += ship.dy * ship.speed;
  // clamp
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

  const now = performance.now();
  if (now - lastSpawn > spawnInterval) {
    spawnMeteor();
    lastSpawn = now;
  }
  updateMeteors(dt);
  checkCollisions();
  if (!startTime) startTime = now;
  score = (now - startTime) / 1000;
}

function render() {
  // fill background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawShip();
  drawMeteors();
  drawScore();
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  render();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keyboard handling
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') ship.dx = -1;
  if (e.key === 'ArrowRight') ship.dx = 1;
  if (e.key === 'ArrowUp') ship.dy = -1;
  if (e.key === 'ArrowDown') ship.dy = 1;
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' && ship.dx < 0) ship.dx = 0;
  if (e.key === 'ArrowRight' && ship.dx > 0) ship.dx = 0;
  if (e.key === 'ArrowUp' && ship.dy < 0) ship.dy = 0;
  if (e.key === 'ArrowDown' && ship.dy > 0) ship.dy = 0;
});
