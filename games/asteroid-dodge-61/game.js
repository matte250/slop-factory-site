// Simple asteroid dodge game targeting canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

const ship = {x: canvas.width / 2 - 15, y: canvas.height - 30, w: 30, h: 30, speed: 5, lastShot: 0};
const keys = {};

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioInitialized = false;
function initAudio() {
  if (audioInitialized) return;
  // Resume playback on first user interaction (required by browsers)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  audioInitialized = true;
}
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playShoot() { initAudio(); playTone(800, 0.07); }
function playExplosion() { initAudio(); playTone(200, 0.15); }
function playGameOver() { initAudio(); playTone(100, 0.5); }

document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => keys[e.code] = false);

let asteroids = [];
let bullets = [];
let stars = [];
let lastAsteroid = 0;
let gameOver = false;

// Initialize starfield
function initStars(count = 120) {
  stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      twinkleSpeed: Math.random() * 0.02 + 0.01
    });
  }
}

function drawStars() {
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    // twinkle effect by modulating radius slightly
    const radius = s.radius + Math.sin(Date.now() * s.twinkleSpeed) * 0.3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

initStars();

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    w: size,
    h: size,
    speed: 2 + Math.random() * 3,
    angle: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.04 // small rotation per frame
  });
}

function rectIntersect(a, b) {
  return !(b.x > a.x + a.w || b.x + b.w < a.x || b.y > a.y + a.h || b.y + b.h < a.y);
}

function shoot() {
  if (Date.now() - ship.lastShot < 300) return;
  bullets.push({x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7});
  ship.lastShot = Date.now();
  playShoot();
}

function update() {
  // Ship movement
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
  if (keys['Space']) shoot();

  // Move asteroids, bullets, and rotate asteroids
  asteroids.forEach(a => {
    a.y += a.speed;
    a.angle += a.rotationSpeed;
  });
  bullets.forEach(b => b.y -= b.speed);

  // Update starfield (slow scroll)
  stars.forEach(s => {
    s.y += 0.3;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  // Remove off‑screen bullets/asteroids
  bullets = bullets.filter(b => b.y + b.h > 0);
  asteroids = asteroids.filter(a => a.y < canvas.height + a.h);

  // Ship‑asteroid collision
  for (const a of asteroids) {
    if (rectIntersect(ship, a)) {
      gameOver = true;
      playGameOver();
      break;
    }
  }

  // Bullet‑asteroid collision
  for (let i = bullets.length - 1; i >= 0; i--) {
    for (let j = asteroids.length - 1; j >= 0; j--) {
      if (rectIntersect(bullets[i], asteroids[j])) {
        bullets.splice(i, 1);
        asteroids.splice(j, 1);
        break;
      }
    }
  }
}

function draw() {
  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#000014');
  bg.addColorStop(1, '#000040');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Background stars
  drawStars();

  // Ship (triangle)
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Asteroids (rotating circles)
  ctx.fillStyle = 'gray';
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x + a.w / 2, a.y + a.h / 2);
    ctx.rotate(a.angle);
    ctx.beginPath();
    ctx.arc(0, 0, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Bullets (small circles)
  ctx.fillStyle = 'yellow';
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

let lastTime = 0;
function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) {
    if (timestamp - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = timestamp;
    }
    update(delta);
    draw();
    requestAnimationFrame(loop);
  } else {
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  }
}
requestAnimationFrame(loop);
