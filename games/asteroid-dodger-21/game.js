// Asteroid Dodger – minimal implementation
// Canvas with id "game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// ----- Visual enhancements -----
// Create a simple starfield background
const STAR_COUNT = 100;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.2 + 0.3,
    opacity: Math.random() * 0.5 + 0.5,
  });
}


// ----- Game state -----
let ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 15,
  angle: 0,
  vx: 0,
  vy: 0,
  thrust: 0.1,
  turnSpeed: 0.07,
  fuel: 100,
};

// ----- Audio -----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustNode = null;
const crashSound = new Audio('https://www.myinstants.com/media/sounds/explosion.mp3'); // simple explosion sound
function startThrustSound() {
  if (thrustNode) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  thrustNode = { osc, gain };
}
function stopThrustSound() {
  if (!thrustNode) return;
  thrustNode.osc.stop();
  thrustNode = null;
}

let asteroids = [];
let keys = {};
let lastTime = 0;

// ----- Input -----
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function spawnAsteroid() {
  const size = Math.random() * 30 + 15;
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  // Start just outside canvas
  if (side === 0) { x = -size; y = Math.random() * canvas.height; }
  else if (side === 1) { x = canvas.width + size; y = Math.random() * canvas.height; }
  else if (side === 2) { x = Math.random() * canvas.width; y = -size; }
  else { x = Math.random() * canvas.width; y = canvas.height + size; }
  // Random velocity toward center
  const speed = Math.random() * 0.6 + 0.2;
  const dx = canvas.width / 2 - x;
  const dy = canvas.height / 2 - y;
  const len = Math.hypot(dx, dy);
  vx = (dx / len) * speed;
  vy = (dy / len) * speed;
  asteroids.push({ x, y, vx, vy, r: size });
}

function update(dt) {
  // Controls
  if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed * dt;
  if (keys['ArrowRight']) ship.angle += ship.turnSpeed * dt;
  if (keys['ArrowUp']) {
    ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
    ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    ship.fuel = Math.max(0, ship.fuel - 0.02 * dt);
    startThrustSound();
  } else {
    stopThrustSound();
  }

  // Move ship
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;

  // Wrap ship around edges
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  // Update asteroids
  asteroids.forEach(a => {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    // wrap
    if (a.x < -a.r) a.x = canvas.width + a.r;
    if (a.x > canvas.width + a.r) a.x = -a.r;
    if (a.y < -a.r) a.y = canvas.height + a.r;
    if (a.y > canvas.height + a.r) a.y = -a.r;
  });

  // Collision detection
  for (let a of asteroids) {
    const dx = ship.x - a.x;
    const dy = ship.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ship.r + a.r) {
      // Lose condition
      alert('Game Over – collision!');
      resetGame();
      return;
    }
  }
  if (ship.fuel <= 0) {
    alert('Game Over – out of fuel!');
    resetGame();
    return;
  }
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#0a001f');
  bgGrad.addColorStop(1, '#001b3d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Starfield
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.fill();
  });

  // Draw ship with thrust flame
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.beginPath();
  ctx.moveTo(ship.r, 0);
  ctx.lineTo(-ship.r / 2, ship.r / 2);
  ctx.lineTo(-ship.r / 2, -ship.r / 2);
  ctx.closePath();
  ctx.fillStyle = '#eeeeee';
  ctx.fill();
  // Thrust flame when accelerating
  if (keys['ArrowUp']) {
    ctx.beginPath();
    ctx.moveTo(-ship.r / 2, ship.r / 4);
    ctx.lineTo(-ship.r * 1.5, 0);
    ctx.lineTo(-ship.r / 2, -ship.r / 4);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();

  // Draw asteroids with radial gradient
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#777777');
    grad.addColorStop(1, '#222222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fuel bar with background
  ctx.fillStyle = '#333';
  const barWidth = 100;
  ctx.fillRect(10, 10, barWidth, 8);
  ctx.fillStyle = 'lime';
  ctx.fillRect(10, 10, (ship.fuel / 100) * barWidth, 8);
  ctx.strokeStyle = 'white';
  ctx.strokeRect(10, 10, barWidth, 8);
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 16; // normalize to ~60fps steps
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  ship = { x: canvas.width / 2, y: canvas.height / 2, r: 15, angle: 0, vx: 0, vy: 0, thrust: 0.1, turnSpeed: 0.07, fuel: 100 };
  asteroids = [];
}

// Spawn asteroids periodically
setInterval(spawnAsteroid, 1500);
requestAnimationFrame(loop);
