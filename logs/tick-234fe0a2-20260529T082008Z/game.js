// Minimal Cosmic Dodger game
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// generate star field background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1 });
}

// particle effect for explosions
const particles = [];
function spawnExplosion(x, y) {
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: Math.random() * 2 + 1, life: 60 });
  }
}


// Ship configuration
const ship = { w: 40, h: 20, x: canvas.width / 2 - 20, y: canvas.height - 30, speed: 5 };

// Asteroid pool
const asteroids = [];
let asteroidTimer = 0;
const asteroidFreq = 60; // frames
let score = 0;
let gameOver = false;

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  const angle = Math.random() * Math.PI * 2;
  asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, w: size, h: size, speed: Math.random() * 2 + 2, angle });
  const size = Math.random() * 30 + 20;
  asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, w: size, h: size, speed: Math.random() * 2 + 2 });
}

function update() {
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  if (gameOver) return;
  // Move ship based on input
  if (keys['ArrowLeft'] && ship.x > 0) ship.x -= ship.speed;
  if (keys['ArrowRight'] && ship.x + ship.w < canvas.width) ship.x += ship.speed;

  // Spawn asteroids
  if (asteroidTimer++ > asteroidFreq) { spawnAsteroid(); playTone(300, 80); asteroidTimer = 0; }

  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    // Remove off‑screen
    if (a.y > canvas.height) { asteroids.splice(i, 1); score++; }
    // Collision
    if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
      spawnExplosion(ship.x + ship.w / 2, ship.y);
      playTone(150, 300);
      gameOver = true; break;
    }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // draw stars background
  ctx.fillStyle = '#888';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  // Draw ship as a triangle
  ctx.fillStyle = '#0af';
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  // Draw asteroids
  ctx.fillStyle = '#a44';
  asteroids.forEach(a => ctx.fillRect(a.x, a.y, a.w, a.h));
  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

const keys = {};
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  setTimeout(() => osc.stop(), duration);
}

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

loop();
