// Simple Orbit Escape game with improved graphics and sound
// Targets a <canvas id="game"> element.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Center point of canvas
const CENTER = { x: canvas.width / 2, y: canvas.height / 2 };
// Visual constants
const STAR_RADIUS = 30;
const SHIP_ORBIT = 100;
const SHIP_SIZE = 12;

let shipAngle = 0; // radians
let asteroids = [];
let powerUps = [];
let lastSpawn = 0;
let lastPowerSpawn = 0;
const SPAWN_INTERVAL = 1200; // ms for asteroids
const POWER_SPAWN_INTERVAL = 8000; // ms for power‑ups

// ---------- Audio ----------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  // Ensure the AudioContext is running (required after a user gesture)
  if (audioCtx.state !== 'running') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// ---------- Utility ----------
function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

// ---------- Asteroid ----------
function spawnAsteroid() {
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = randomRange(0.8, 2.2);
  if (side === 0) { // top
    x = Math.random() * canvas.width;
    y = -12;
  } else if (side === 1) { // right
    x = canvas.width + 12;
    y = Math.random() * canvas.height;
  } else if (side === 2) { // bottom
    x = Math.random() * canvas.width;
    y = canvas.height + 12;
  } else { // left
    x = -12;
    y = Math.random() * canvas.height;
  }
  // direction toward center
  const dx = CENTER.x - x;
  const dy = CENTER.y - y;
  const len = Math.hypot(dx, dy);
  vx = (dx / len) * speed;
  vy = (dy / len) * speed;
  const radius = randomRange(6, 12);
  asteroids.push({ x, y, vx, vy, r: radius });
}

// ---------- Power‑up ----------
function spawnPowerUp() {
  const angle = Math.random() * Math.PI * 2;
  const distance = randomRange(80, 180);
  const x = CENTER.x + Math.cos(angle) * distance;
  const y = CENTER.y + Math.sin(angle) * distance;
  powerUps.push({ x, y, r: 8, collected: false });
}

function update(dt) {
  // move asteroids
  asteroids.forEach(a => {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
  });
  // remove far‑away asteroids
  asteroids = asteroids.filter(a => {
    const dx = a.x - CENTER.x;
    const dy = a.y - CENTER.y;
    return Math.hypot(dx, dy) > canvas.width * 0.6;
  });

  // move power‑ups (slow drift outward)
  powerUps.forEach(p => {
    const ox = p.x - CENTER.x;
    const oy = p.y - CENTER.y;
    const len = Math.hypot(ox, oy);
    p.x += (ox / len) * 0.2 * dt;
    p.y += (oy / len) * 0.2 * dt;
  });
  // remove collected or out‑of‑bounds power‑ups
  powerUps = powerUps.filter(p => !p.collected && Math.hypot(p.x - CENTER.x, p.y - CENTER.y) < canvas.width * 0.7);

  // collision detection with ship
  const shipX = CENTER.x + Math.cos(shipAngle) * SHIP_ORBIT;
  const shipY = CENTER.y + Math.sin(shipAngle) * SHIP_ORBIT;
  for (const a of asteroids) {
    const d = Math.hypot(a.x - shipX, a.y - shipY);
    if (d < a.r + SHIP_SIZE) {
playTone(150, 0.5);
       alert('Game Over');
       // reset game state
      asteroids = [];
      powerUps = [];
      shipAngle = 0;
      return;
    }
  }
  // collect power‑ups
  for (const p of powerUps) {
    const d = Math.hypot(p.x - shipX, p.y - shipY);
    if (d < p.r + SHIP_SIZE) {
      p.collected = true;
      playTone(300, 0.2);
      // Example effect: temporarily speed up ship rotation
      // (implementation left simple for brevity)
    }
  }
}

// ---------- Drawing ----------
function drawBackground() {
  // space background
  ctx.fillStyle = '#001020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // tiny stars
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 80; i++) {
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    ctx.fillRect(sx, sy, 1, 1);
  }
}

function drawStar() {
  const grad = ctx.createRadialGradient(CENTER.x, CENTER.y, STAR_RADIUS * 0.2, CENTER.x, CENTER.y, STAR_RADIUS);
  grad.addColorStop(0, '#ffcc66');
  grad.addColorStop(1, '#ff6600');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(CENTER.x, CENTER.y, STAR_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}

function drawShip() {
  const shipX = CENTER.x + Math.cos(shipAngle) * SHIP_ORBIT;
  const shipY = CENTER.y + Math.sin(shipAngle) * SHIP_ORBIT;
  ctx.fillStyle = '#00e5ff';
  ctx.strokeStyle = '#003344';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(shipX, shipY);
  ctx.lineTo(
    shipX + Math.cos(shipAngle + Math.PI * 0.75) * SHIP_SIZE,
    shipY + Math.sin(shipAngle + Math.PI * 0.75) * SHIP_SIZE
  );
  ctx.lineTo(
    shipX + Math.cos(shipAngle - Math.PI * 0.75) * SHIP_SIZE,
    shipY + Math.sin(shipAngle - Math.PI * 0.75) * SHIP_SIZE
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawAsteroids() {
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPowerUps() {
  ctx.fillStyle = '#ffdd00';
  powerUps.forEach(p => {
    if (p.collected) return;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function draw() {
  drawBackground();
  drawStar();
  drawShip();
  drawAsteroids();
  drawPowerUps();
}

let lastTime = performance.now();
function loop(now) {
  const dt = (now - lastTime) / 16;
  lastTime = now;
  if (now - lastSpawn > SPAWN_INTERVAL) {
    spawnAsteroid();
    lastSpawn = now;
  }
  if (now - lastPowerSpawn > POWER_SPAWN_INTERVAL) {
    spawnPowerUp();
    lastPowerSpawn = now;
  }
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Controls ----------
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') shipAngle -= 0.08;
  if (e.key === 'ArrowRight') shipAngle += 0.08;
});
