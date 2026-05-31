// Asteroid Escape game
// Canvas element with id "game" is expected in the HTML.

const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas element with id "game" not found');
}
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}


// Adjust canvas size to fill its container
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resize);
resize();

// Game state
let ship = { x: canvas.width / 2, y: canvas.height - 60, width: 30, height: 30, speed: 4 };
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
// Unlock audio on first user interaction
window.addEventListener('click', () => audioCtx.resume(), { once: true });

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  const x = Math.random() * (canvas.width - size);
  const speed = Math.random() * 2 + 1;
  const rot = 0;
  const rotSpeed = (Math.random() * 0.04 - 0.02); // radians per frame
  asteroids.push({ x, y: -size, size, speed, rot, rotSpeed });
}

function spawnOrb() {
  const radius = 8;
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const speed = 1.5;
  orbs.push({ x, y: -radius, radius, speed });
}

// Timers
setInterval(spawnAsteroid, 1200);
setInterval(spawnOrb, 3000);

function update() {
  if (gameOver) return;
  // Ship movement (arrow keys or WASD)
  if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
  if (keys.ArrowRight || keys.d) ship.x += ship.speed;
  if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
  if (keys.ArrowDown || keys.s) ship.y += ship.speed;
  // Keep ship in bounds
  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

  // Move asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    a.rot += a.rotSpeed; // update rotation
    // Collision with ship (simple AABB)
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
    // Remove off‑screen
    if (a.y > canvas.height) asteroids.splice(i, 1);
  }

  // Move orbs
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

function drawStarfield() {
  // Gradient background with twinkling stars
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, '#001');
  grd.addColorStop(1, '#000');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    const size = Math.random() * 1.5 + 0.5;
    const brightness = Math.random() * 0.5 + 0.5;
    ctx.fillStyle = `rgba(255,255,255,${brightness})`;
    ctx.fillRect(sx, sy, size, size);
  }
}

function draw() {
  drawStarfield();

  // Draw ship (gradient triangle with glow)
  ctx.save();
  ctx.translate(ship.x + ship.width / 2, ship.y + ship.height / 2);
  // Glow effect
  ctx.shadowColor = 'rgba(0,255,0,0.6)';
  ctx.shadowBlur = 10;
  const shipGrad = ctx.createLinearGradient(0, -ship.height / 2, 0, ship.height / 2);
  shipGrad.addColorStop(0, '#a0ff90');
  shipGrad.addColorStop(1, '#00aa00');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(0, -ship.height / 2);
  ctx.lineTo(-ship.width / 2, ship.height / 2);
  ctx.lineTo(ship.width / 2, ship.height / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw asteroids with rotation and gradient
  asteroids.forEach(a => {
    ctx.save();
    const cx = a.x + a.size / 2;
    const cy = a.y + a.size / 2;
    ctx.translate(cx, cy);
    ctx.rotate(a.rot);
    const grad = ctx.createRadialGradient(0, 0, a.size * 0.1, 0, 0, a.size / 2);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#aaa');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Draw orbs with glowing gradient
  orbs.forEach(o => {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI
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
