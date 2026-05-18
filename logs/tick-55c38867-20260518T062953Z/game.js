// Minimal Stellar Drift game
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Ship state
let ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  thrusting: false,
};
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let lastThrustTime = 0;
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
function playThrust() {
  const now = performance.now();
  if (now - lastThrustTime > 100) { // throttle to 10 per sec
    playTone(200, 0.08);
    lastThrustTime = now;
  }
}
function playCollect() { playTone(800, 0.12); }
function playExplosion() { playTone(100, 0.6); }
// Starfield background
const stars = [];
function initStars(count = 150) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
}
initStars();

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
window.addEventListener('keyup', e => (keys[e.code] = false));

// Entities
let asteroids = [];
let orbs = [];
let score = 0;
let gameOver = false;

function spawnAsteroid() {
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 1 + Math.random() * 1.5;
  switch (side) {
    case 0: // top
      x = Math.random() * canvas.width;
      y = -20;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
      break;
    case 1: // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + 20;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
      break;
    case 2: // left
      x = -20;
      y = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
      break;
    case 3: // right
      x = canvas.width + 20;
      y = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
      break;
  }
  asteroids.push({ x, y, vx, vy, r: 15 + Math.random() * 10 });
}

function spawnOrb() {
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 0.5 + Math.random() * 0.5;
  switch (side) {
    case 0:
      x = Math.random() * canvas.width;
      y = -10;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
      break;
    case 1:
      x = Math.random() * canvas.width;
      y = canvas.height + 10;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
      break;
    case 2:
      x = -10;
      y = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
      break;
    case 3:
      x = canvas.width + 10;
      y = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
      break;
  }
  orbs.push({ x, y, vx, vy, r: 5 });
}

// Simple collision test
function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function update(dt) {
  // Update starfield (slow drift)
  stars.forEach(s => {
    s.x -= 0.2;
    if (s.x < 0) s.x = canvas.width;
    s.y += 0.1;
    if (s.y > canvas.height) s.y = 0;
  });
  if (gameOver) return;
  // Controls
  if (keys['ArrowLeft']) ship.angle -= 0.12;
  if (keys['ArrowRight']) ship.angle += 0.12;
  if (keys['ArrowUp']) {
    const thrust = 0.08;
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
    ship.thrusting = true;
    playThrust();
  } else {
    ship.thrusting = false;
  }
  // Apply drift (slow friction)
  ship.vx *= 0.99;
  ship.vy *= 0.99;
  ship.x += ship.vx;
  ship.y += ship.vy;

  // Keep drifting off-screen detection
  if (
    ship.x < -30 || ship.x > canvas.width + 30 ||
    ship.y < -30 || ship.y > canvas.height + 30
  ) {
    gameOver = true;
  }

  // Update asteroids
  asteroids.forEach(a => {
    a.x += a.vx;
    a.y += a.vy;
    // off‑screen removal
    if (a.x < -40 || a.x > canvas.width + 40 || a.y < -40 || a.y > canvas.height + 40) {
      a.remove = true;
    }
    // Collision with ship
    if (dist(a.x, a.y, ship.x, ship.y) < a.r + ship.radius) {
      playExplosion();
      gameOver = true;
    }
  });
  asteroids = asteroids.filter(a => !a.remove);

  // Update orbs
  orbs.forEach(o => {
    o.x += o.vx;
    o.y += o.vy;
    if (o.x < -20 || o.x > canvas.width + 20 || o.y < -20 || o.y > canvas.height + 20) {
      o.remove = true;
    }
    if (dist(o.x, o.y, ship.x, ship.y) < o.r + ship.radius) {
      score += 1;
      playCollect();
      o.remove = true;
    }
  });
  orbs = orbs.filter(o => !o.remove);

  // Random spawns
  if (Math.random() < 0.02) spawnAsteroid();
  if (Math.random() < 0.015) spawnOrb();
}

function draw() {
  // Space gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Starfield (twinkling)
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship with thrust flame
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fill();
  // Thrust flame
  if (ship.thrusting) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Asteroids with simple shading
  asteroids.forEach(a => {
    const gradA = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    gradA.addColorStop(0, '#aaa');
    gradA.addColorStop(1, '#555');
    ctx.fillStyle = gradA;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Orbs with glow effect
  orbs.forEach(o => {
    const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2);
    orbGrad.addColorStop(0, '#ff0');
    orbGrad.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = orbGrad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // UI overlay
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f44';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Export for debugging (optional)
export { ship, asteroids, orbs, score, gameOver };
