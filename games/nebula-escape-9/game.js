// Simple Nebula Escape game
// Canvas with id="game"

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Starfield background
const STAR_COUNT = 150;
const stars = [];
function initStars() {
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
  }
}
initStars();

// Ship definition
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 10,
};

// Asteroid pool
const asteroids = [];
const ASTEROID_MIN_SPEED = 0.5;
const ASTEROID_MAX_SPEED = 2.5;
const ASTEROID_MIN_RADIUS = 15;
const ASTEROID_MAX_RADIUS = 30;

let score = 0;
let lastTime = performance.now();
let gameOver = false;

// Input handling
const keys = {};
window.addEventListener('keydown', e => (keys[e.key] = true));
window.addEventListener('keyup', e => (keys[e.key] = false));

// Sound setup using Web Audio API
let audioCtx;
try {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.warn('Web Audio API not supported');
}
let thrustOsc = null;
function startThrustSound() {
  if (!audioCtx) return;
  if (thrustOsc) return; // already playing
  thrustOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  thrustOsc.type = 'sawtooth';
  thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  thrustOsc.connect(gain).connect(audioCtx.destination);
  thrustOsc.start();
}
function stopThrustSound() {
  if (!thrustOsc) return;
  thrustOsc.stop();
  thrustOsc.disconnect();
  thrustOsc = null;
}
function playExplosionSound() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
  noise.connect(gain).connect(audioCtx.destination);
  noise.start();
}


function spawnAsteroid() {
  const radius = Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS) + ASTEROID_MIN_RADIUS;
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED) + ASTEROID_MIN_SPEED;
  // Start at random edge
  let x, y;
  if (Math.random() < 0.5) {
    x = Math.random() * canvas.width;
    y = Math.random() < 0.5 ? -radius : canvas.height + radius;
  } else {
    x = Math.random() < 0.5 ? -radius : canvas.width + radius;
    y = Math.random() * canvas.height;
  }
  asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius });
}

function update(dt) {
  if (gameOver) return;

  // Ship controls
  if (keys['ArrowLeft']) ship.angle -= 3 * dt;
  if (keys['ArrowRight']) ship.angle += 3 * dt;
  if (keys['ArrowUp']) {
    const thrust = 50 * dt;
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
    startThrustSound();
  } else {
    stopThrustSound();
  }

  // Apply friction
  ship.vx *= 0.99;
  ship.vy *= 0.99;

  // Move ship
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  wrap(ship);

  // Move asteroids
  for (const a of asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    wrap(a);
  }

  // Collision detection
  for (const a of asteroids) {
    const dx = ship.x - a.x;
    const dy = ship.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ship.radius + a.radius) {
      gameOver = true;
      playExplosionSound();
      break;
    }
  }

  // Score based on survival time
  score += dt;
}

function wrap(obj) {
  if (obj.x < -obj.radius) obj.x = canvas.width + obj.radius;
  if (obj.x > canvas.width + obj.radius) obj.x = -obj.radius;
  if (obj.y < -obj.radius) obj.y = canvas.height + obj.radius;
  if (obj.y > canvas.height + obj.radius) obj.y = -obj.radius;
}

function draw() {
  // Draw background with starfield gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.fillRect(s.x, s.y, 1, 1);
  }

  // Draw ship with gradient fill and outline
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship shape (triangle)
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  // Gradient fill for ship
  const shipGrad = ctx.createLinearGradient(-8, -6, 12, 0);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#050');
  ctx.fillStyle = shipGrad;
  ctx.fill();
  // Stroke outline
  ctx.strokeStyle = '#0c0';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Draw asteroids with radial gradient
  for (const a of asteroids) {
    const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Score display
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Spawn asteroids periodically
setInterval(spawnAsteroid, 2000);
spawnAsteroid(); // initial
requestAnimationFrame(loop);
