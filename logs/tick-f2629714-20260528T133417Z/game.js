// Simple Asteroid Escape game – improved graphics with sound
// Canvas element with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ---------- Audio Setup ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type = 'sine', duration = 0.1, volume = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Background drone (low volume, repeats)
setInterval(() => playSound(60, 'sine', 0.5, 0.02), 5000);

// ---------- Canvas & Background ----------
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateStars(); // regenerate starfield on size change
}
window.addEventListener('resize', resize);
resize();

// Starfield background (simple white dots)
let stars = [];
function generateStars(count = 200) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
}
function drawStars() {
  ctx.save();
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Ship ----------
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 12,
  speed: 4,
  angle: 0, // radians, used for drawing direction
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function updateShip() {
  let dx = 0, dy = 0;
  if (keys.ArrowUp || keys.w) dy -= ship.speed;
  if (keys.ArrowDown || keys.s) dy += ship.speed;
  if (keys.ArrowLeft || keys.a) dx -= ship.speed;
  if (keys.ArrowRight || keys.d) dx += ship.speed;

  ship.x += dx;
  ship.y += dy;

  // Play thrust sound when moving
  if (dx !== 0 || dy !== 0) {
    playSound(400, 'square', 0.05, 0.05);
    ship.angle = Math.atan2(dy, dx);
  }

  // Keep within bounds
  ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
  ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#00ffff'; // bright cyan
  ctx.beginPath();
  ctx.moveTo(ship.radius, 0);
  ctx.lineTo(-ship.radius, ship.radius * 0.7);
  ctx.lineTo(-ship.radius, -ship.radius * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Asteroids ----------
const asteroids = [];
function spawnAsteroid() {
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 1 + Math.random() * 2;
  if (edge === 0) { // top
    x = Math.random() * canvas.width; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed;
  } else if (edge === 1) { // bottom
    x = Math.random() * canvas.width; y = canvas.height + 20; vx = (Math.random() - 0.5) * speed; vy = -speed;
  } else if (edge === 2) { // left
    x = -20; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * speed;
  } else { // right
    x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * speed;
  }
  const rot = (Math.random() - 0.5) * 0.04;
  asteroids.push({x, y, vx, vy, radius: 15 + Math.random() * 10, angle: 0, rot});
}
let spawnTimer = 0;

function updateAsteroids(dt) {
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnAsteroid();
    spawnTimer = 0.5 + Math.random();
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx * dt * 60;
    a.y += a.vy * dt * 60;
    a.angle += a.rot;
    if (a.x < -30 || a.x > canvas.width + 30 || a.y < -30 || a.y > canvas.height + 30) {
      asteroids.splice(i, 1);
    }
  }
}

function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.angle);
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  const points = 8;
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2;
    const r = a.radius * (0.7 + Math.random() * 0.3);
    ctx.lineTo(r * Math.cos(theta), r * Math.sin(theta));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------- Collision & Score ----------
function checkCollision() {
  for (const a of asteroids) {
    const dx = ship.x - a.x;
    const dy = ship.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ship.radius + a.radius) {
      // explosion sound
      playSound(80, 'sawtooth', 0.3, 0.2);
      cancelAnimationFrame(animId);
      alert('Game Over!');
      return true;
    }
  }
  return false;
}

let score = 0;
function updateScore(dt) {
  score += dt;
  ctx.fillStyle = 'white';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);
}

// ---------- Main Loop ----------
let lastTime = 0;
let animId;
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawStars();
  updateShip();
  updateAsteroids(dt);

  drawShip();
  for (const a of asteroids) {
    drawAsteroid(a);
  }

  updateScore(dt);

  if (!checkCollision()) {
    animId = requestAnimationFrame(loop);
  }
}
animId = requestAnimationFrame(loop);
