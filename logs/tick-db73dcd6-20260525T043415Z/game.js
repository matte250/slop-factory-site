// Asteroid Escape game
// Canvas element with id "game" is expected in the HTML.

const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas element with id "game" not found');
}
const ctx = canvas.getContext('2d');
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Adjust canvas size to fill its container
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  // Reinitialize stars for new size
  initStars();
}
window.addEventListener('resize', resize);
resize();

// Game state
let ship = { x: canvas.width / 2, y: canvas.height - 60, width: 30, height: 30, speed: 4 }; // Ship
let stars = []; // background stars
let asteroids = [];
let orbs = [];
let score = 0;
let highScore = Number(localStorage.getItem('highScore')) || 0;
let lives = 3;
let gameOver = false;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  const x = Math.random() * (canvas.width - size);
  const speed = Math.random() * 2 + 1;
  asteroids.push({ x, y: -size, size, speed });
}

function spawnOrb() {
  const radius = 8;
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const speed = 1.5;
  orbs.push({ x, y: -radius, radius, speed });
}

// Timers for spawning
setInterval(spawnAsteroid, 1200);
setInterval(spawnOrb, 3000);

function update() {
  if (gameOver) return;

  // Update background stars
  updateStars();

  // Ship movement (arrow keys or WASD)
  if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
  if (keys.ArrowRight || keys.d) ship.x += ship.speed;
  if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
  if (keys.ArrowDown || keys.s) ship.y += ship.speed;

  // Keep ship within canvas bounds
  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    // Simple AABB collision with ship
    if (
      ship.x < a.x + a.size &&
      ship.x + ship.width > a.x &&
      ship.y < a.y + a.size &&
      ship.y + ship.height > a.y
    ) {
      lives--;
      asteroids.splice(i, 1);
      if (lives <= 0) {
        gameOver = true;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('highScore', highScore);
        }
      }
      continue;
    }
    if (a.y > canvas.height) asteroids.splice(i, 1);
  }

  // Update orbs
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.y += o.speed;
    const dx = (ship.x + ship.width / 2) - o.x;
    const dy = (ship.y + ship.height / 2) - o.y;
    const dist = Math.hypot(dx, dy);
    if (dist < o.radius + Math.max(ship.width, ship.height) / 2) {
      score++;
      orbs.splice(i, 1);
      continue;
    }
    if (o.y - o.radius > canvas.height) orbs.splice(i, 1);
  }
}

function initStars(count = 150) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
}

function updateStars() {
  for (const s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = -s.radius;
      s.x = Math.random() * canvas.width;
    }
    // twinkle
    s.alpha += (Math.random() - 0.5) * 0.05;
    s.alpha = Math.max(0.3, Math.min(1, s.alpha));
  }
}

function drawStarfield() {
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw twinkling stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function draw() {
  drawStarfield();

  // Draw ship (glowing green triangle)
  ctx.save();
  ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
  // glow
  ctx.shadowColor = 'rgba(0,255,0,0.7)';
  ctx.shadowBlur = 8;
  // gradient fill
  const shipGrad = ctx.createLinearGradient(0, -ship.height / 2, 0, ship.height / 2);
  shipGrad.addColorStop(0, '#b6ffb6');
  shipGrad.addColorStop(1, '#00ff00');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(0, -ship.height / 2);
  ctx.lineTo(-ship.width / 2, ship.height / 2);
  ctx.lineTo(ship.width / 2, ship.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw asteroids
  ctx.fillStyle = '#888';
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw energy orbs
  ctx.fillStyle = '#ff0';
  orbs.forEach(o => {
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, 10, 40);
  ctx.fillText(`High: ${highScore}`, 10, 60);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
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
