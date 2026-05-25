// Simple Solar Flare Dodger game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'sine', duration = 0.1, volume = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Player ship
const ship = { w: 40, h: 20, x: canvas.width / 2 - 20, y: canvas.height - 30, speed: 5 };

// Asteroids
const asteroids = [];
let asteroidTimer = 0;
let asteroidInterval = 60; // frames

// Power‑ups (simple score boost)
const powerUps = [];
let powerTimer = 0;
let powerInterval = 300; // frames

// Background stars for visual depth
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    alpha: Math.random()
  });
}

let score = 0;

// Particle explosions for collisions
const explosions = [];
let shields = 3;
let gameOver = false;

function drawShip() {
  // Draw a simple triangular ship with gradient and glow
  const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
  grad.addColorStop(0, '#00ff80');
  grad.addColorStop(1, '#006640');
  ctx.fillStyle = grad;
  // Glow effect
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#00ff80';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  // Reset shadow for other drawings
  ctx.shadowBlur = 0;
}

function updateShip() {
  if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
  if (keys['ArrowRight']) ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);
}

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: 2 + Math.random() * 2 });
}

function drawAsteroids() {
  // Draw each asteroid with a radial gradient for depth
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateAsteroids() {
  asteroids.forEach(a => a.y += a.speed);
  // Remove off‑screen
  while (asteroids.length && asteroids[0].y - asteroids[0].size > canvas.height) asteroids.shift();
}

function spawnPower() {
  powerUps.push({ x: Math.random() * (canvas.width - 20), y: -20, w: 15, h: 15, speed: 1.5 });
}


function drawStars() {
  // Dark space background with subtle vertical gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Render stars
  stars.forEach(s => {
    ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    // Slight twinkling effect
    s.alpha += (Math.random() - 0.5) * 0.05;
    if (s.alpha < 0) s.alpha = 0;
    if (s.alpha > 1) s.alpha = 1;
  });
}

// Draw power‑ups (glowing circles)
function drawPowerUps() {
  powerUps.forEach(p => {
    const grad = ctx.createRadialGradient(p.x + p.w / 2, p.y + p.h / 2, 0, p.x + p.w / 2, p.y + p.h / 2, p.w);
    grad.addColorStop(0, 'rgba(255,255,0,0.8)');
    grad.addColorStop(1, 'rgba(255,165,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Particle system for explosions
function spawnExplosion(x, y, radius) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    explosions.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 30,
      size: Math.random() * 2 + 1,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`
    });
  }
}

function drawExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const p = explosions[i];
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 30;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // update
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) explosions.splice(i, 1);
  }
}


function checkCollisions() {
  // Ship vs asteroids
  asteroids.forEach((a, i) => {
    if (ship.x < a.x + a.size && ship.x + ship.w > a.x - a.size &&
        ship.y < a.y + a.size && ship.y + ship.h > a.y - a.size) {
      shields--;
      // play collision sound and spawn explosion
      playTone(150, 'square', 0.1, 0.2);
      spawnExplosion(a.x, a.y);
      asteroids.splice(i, 1);
    }
  });
  // Ship vs power‑ups
  powerUps.forEach((p, i) => {
    if (ship.x < p.x + p.w && ship.x + ship.w > p.x &&
        ship.y < p.y + p.h && ship.y + ship.h > p.y) {
      score += 10;
      // play collection sound
      playTone(800, 'triangle', 0.08, 0.1);
      powerUps.splice(i, 1);
    }
  });
  if (shields <= 0) gameOver = true;
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Shields: ${shields}`, 10, 40);
}

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
window.addEventListener('keyup', e => keys[e.key] = false);

function loop() {
  if (gameOver) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    return;
  }
    drawStars();
  updateShip();
  drawShip();

  if (++asteroidTimer > asteroidInterval) { spawnAsteroid(); asteroidTimer = 0; }
  updateAsteroids();
  drawAsteroids();

  if (++powerTimer > powerInterval) { spawnPower(); powerTimer = 0; }
  updatePowerUps();
  drawPowerUps();

  // render particle explosions
  drawExplosions();

  checkCollisions();
  drawHUD();
  requestAnimationFrame(loop);
}

loop();
