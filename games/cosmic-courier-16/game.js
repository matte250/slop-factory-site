// Simple Cosmic Courier game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 600;

// Initialize starfield with two depth layers
const farStarCount = Math.floor(canvas.width * canvas.height * 0.0001);
const nearStarCount = Math.floor(canvas.width * canvas.height * 0.00005);
const farStars = [];
const nearStars = [];
for (let i = 0; i < farStarCount; i++) {
  farStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 0.2 + 0.1, // slower
  });
}
for (let i = 0; i < nearStarCount; i++) {
  nearStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: Math.random() * 0.5 + 0.3, // faster
  });
}

// Audio context and simple sound helpers
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.stop(audioCtx.currentTime + duration / 1000);
}
function playPowerUp() { playTone(800, 150); }
function playCollision() { playTone(200, 300); }

function updateStars(dt) {
  // far layer
  farStars.forEach(s => {
    s.y += s.speed * dt * 0.03;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
  });
  // near layer
  nearStars.forEach(s => {
    s.y += s.speed * dt * 0.07;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
  });
}

// Game state
let ship = { x: canvas.width / 2, y: canvas.height - 60, r: 12, vx: 0, vy: 0, speed: 2 };
let asteroids = [];
let powerUps = [];
let fuel = 100; // percent
let score = 0;
let gameOver = false;

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
  // Unlock audio on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.key] = true;
});
window.addEventListener('keyup', e => keys[e.key] = false);

function spawnAsteroid() {
  const size = Math.random() * 20 + 10;
  asteroids.push({
    x: Math.random() * canvas.width,
    y: -size,
    r: size,
    vy: Math.random() * 1.5 + 0.5,
  });
}
function spawnPowerUp() {
  const size = 10;
  powerUps.push({
    x: Math.random() * canvas.width,
    y: -size,
    r: size,
    vy: 1,
  });
}

function update(dt) {
  if (gameOver) return;

  // Update starfield background
  updateStars(dt);

  // Ship controls
  if (keys['ArrowLeft']) ship.vx = -ship.speed;
  else if (keys['ArrowRight']) ship.vx = ship.speed;
  else ship.vx = 0;

  if (keys['ArrowUp']) ship.vy = -ship.speed;
  else if (keys['ArrowDown']) ship.vy = ship.speed;
  else ship.vy = 0;

  ship.x += ship.vx;
  ship.y += ship.vy;

  // Keep ship inside canvas
  ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
  ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

  // Fuel consumption
  fuel -= 0.02 * dt;
  if (fuel <= 0) gameOver = true;

  // Asteroids movement
  asteroids.forEach(a => a.y += a.vy);
  asteroids = asteroids.filter(a => a.y - a.r < canvas.height);

  // Power‑ups movement
  powerUps.forEach(p => p.y += p.vy);
  powerUps = powerUps.filter(p => p.y - p.r < canvas.height);

  // Collision detection
  for (let i = 0; i < asteroids.length; i++) {
    const a = asteroids[i];
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    if (dx * dx + dy * dy < (a.r + ship.r) ** 2) {
      playCollision();
      gameOver = true;
    }
  }
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    const dx = p.x - ship.x;
    const dy = p.y - ship.y;
    if (dx * dx + dy * dy < (p.r + ship.r) ** 2) {
      playPowerUp();
      fuel = Math.min(100, fuel + 20);
      powerUps.splice(i, 1);
    }
  }

  // Score increases over time (simulates deliveries)
  score += dt * 0.01;

  // Random spawns
  if (Math.random() < 0.02) spawnAsteroid();
  if (Math.random() < 0.005) spawnPowerUp();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Starfield background with moving stars (gradient nebula)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001020');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw far stars
  ctx.fillStyle = '#888';
  farStars.forEach(s => { ctx.fillRect(s.x, s.y, 1, 1); });
  // Draw near stars
  ctx.fillStyle = '#fff';
  nearStars.forEach(s => { ctx.fillRect(s.x, s.y, 2, 2); });

  // Ship - draw as a triangle rocket
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.r);
  ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
  ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
  ctx.closePath();
  ctx.fill();

  // Asteroids
  ctx.fillStyle = '#a52a2a';
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Power‑ups
  ctx.fillStyle = '#0f0';
  powerUps.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
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
