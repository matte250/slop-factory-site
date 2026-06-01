// Astro Dodge – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// ----- Helpers -----
function rand(min, max) { return Math.random() * (max - min) + min; }

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ----- Starfield background -----
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: rand(0, canvas.width), y: rand(0, canvas.height), r: rand(0.5, 1.5) });
}
function drawStars() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----- Player ship -----
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 12,
  speed: 2,
  fuel: 100,
  dx: 0,
  dy: 0,
};

function drawShip() {
  const angle = Math.atan2(ship.dy, ship.dx) || 0;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(angle);
  // ship body – triangle
  ctx.fillStyle = gameOver ? '#777' : '#0ff';
  ctx.beginPath();
  ctx.moveTo(0, -ship.r);
  ctx.lineTo(ship.r, ship.r);
  ctx.lineTo(-ship.r, ship.r);
  ctx.closePath();
  ctx.fill();
  // thrust flame
  if (ship.dx || ship.dy) {
    ctx.fillStyle = '#ff8';
    ctx.beginPath();
    ctx.moveTo(0, ship.r);
    ctx.lineTo(4, ship.r + 8);
    ctx.lineTo(-4, ship.r + 8);
    ctx.closePath();
    ctx.fill();
    // thrust sound
    playTone(200, 0.05);
  }
  ctx.restore();
}

// ----- Input handling -----
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function updateShip() {
  let ax = 0, ay = 0;
  if (keys['ArrowLeft'] || keys['a']) ax -= 1;
  if (keys['ArrowRight'] || keys['d']) ax += 1;
  if (keys['ArrowUp'] || keys['w']) ay -= 1;
  if (keys['ArrowDown'] || keys['s']) ay += 1;
  if (ax || ay) {
    const len = Math.hypot(ax, ay);
    ax /= len; ay /= len;
    ship.dx = ax * ship.speed;
    ship.dy = ay * ship.speed;
    ship.fuel = Math.max(0, ship.fuel - 0.05);
  } else {
    ship.dx = ship.dy = 0;
  }
  ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x + ship.dx));
  ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y + ship.dy));
}

function drawStars() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ----- Player ship -----
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 12,
  speed: 2,
  fuel: 100,
  dx: 0,
  dy: 0,
};

function drawShip() {
  const angle = Math.atan2(ship.dy, ship.dx) || 0;
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(angle);
  // ship body – triangle
  ctx.fillStyle = gameOver ? '#777' : '#0ff';
  ctx.beginPath();
  ctx.moveTo(0, -ship.r);
  ctx.lineTo(ship.r, ship.r);
  ctx.lineTo(-ship.r, ship.r);
  ctx.closePath();
  ctx.fill();
  // thrust flame
  if (ship.dx || ship.dy) {
    ctx.fillStyle = '#ff8';
    ctx.beginPath();
    ctx.moveTo(0, ship.r);
    ctx.lineTo(4, ship.r + 8);
    ctx.lineTo(-4, ship.r + 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// ----- Input handling -----
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function updateShip() {
  let ax = 0, ay = 0;
  if (keys['ArrowLeft'] || keys['a']) ax -= 1;
  if (keys['ArrowRight'] || keys['d']) ax += 1;
  if (keys['ArrowUp'] || keys['w']) ay -= 1;
  if (keys['ArrowDown'] || keys['s']) ay += 1;
  if (ax || ay) {
    const len = Math.hypot(ax, ay);
    ax /= len; ay /= len;
    ship.dx = ax * ship.speed;
    ship.dy = ay * ship.speed;
    ship.fuel = Math.max(0, ship.fuel - 0.05);
  } else {
    ship.dx = ship.dy = 0;
  }
  ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x + ship.dx));
  ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y + ship.dy));
}

// ----- Asteroids -----
const asteroids = [];
function spawnAsteroid() {
  const edge = Math.random() < 0.5 ? 'h' : 'v';
  const r = rand(10, 30);
  let x, y, vx, vy;
  if (edge === 'h') {
    x = rand(0, canvas.width);
    y = Math.random() < 0.5 ? -r : canvas.height + r;
    vy = rand(0.5, 2) * (y < 0 ? 1 : -1);
    vx = rand(-1, 1);
  } else {
    x = Math.random() < 0.5 ? -r : canvas.width + r;
    y = rand(0, canvas.height);
    vx = rand(0.5, 2) * (x < 0 ? 1 : -1);
    vy = rand(-1, 1);
  }
  // create rough polygon shape
  const points = [];
  const sides = Math.floor(rand(5, 9));
  for (let i = 0; i < sides; i++) {
    const ang = (i / sides) * Math.PI * 2;
    const rad = r * rand(0.7, 1);
    points.push({ x: Math.cos(ang) * rad, y: Math.sin(ang) * rad });
  }
  asteroids.push({ x, y, vx, vy, r, points });
}
let asteroidTimer = 0;
function updateAsteroids(dt) {
  asteroidTimer += dt;
  if (asteroidTimer > 1000) { spawnAsteroid(); asteroidTimer = 0; }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx; a.y += a.vy;
    if (a.x < -a.r || a.x > canvas.width + a.r || a.y < -a.r || a.y > canvas.height + a.r) {
      asteroids.splice(i, 1);
    }
  }
}
function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.strokeStyle = '#a52a2a';
  ctx.fillStyle = '#8b4513';
  ctx.beginPath();
  const p0 = a.points[0];
  ctx.moveTo(p0.x, p0.y);
  for (let i = 1; i < a.points.length; i++) {
    const p = a.points[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function checkCollision() {
  for (const a of asteroids) {
    const d = Math.hypot(ship.x - a.x, ship.y - a.y);
    if (d < ship.r + a.r) return true;
  }
  return false;
}

let lastTime = 0;
let gameOver = false;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) {
    updateShip();
    updateAsteroids(dt);
    if (checkCollision() || ship.fuel <= 0) gameOver = true;
  }
  // Render
  drawStars();
  drawShip();
  ctx.strokeStyle = '#555';
  for (const a of asteroids) drawAsteroid(a);
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Fuel: ' + Math.floor(ship.fuel), 10, 20);
  if (gameOver) {
    ctx.fillStyle = '#f44';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
