// Canvas Dodge game
// Canvas element with id="game" is expected in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Adjust canvas to fill its container (fallback to 800x600)
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Starfield background
const stars = Array.from({length: 100}, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
}));
function drawStars() {
  // Fill background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    // Simple parallax motion
    s.x -= 0.5;
    if (s.x < 0) s.x = canvas.width;
  }
}

// Ship definition
const ship = {
  w: 30,
  h: 30,
  x: canvas.width / 4,
  y: canvas.height / 2,
  speed: 4,
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Audio setup (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context runs after user interaction
window.addEventListener('click', () => audioCtx.resume());
function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Crash sound (lower tone, longer)
function playCrash() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 150;
  osc.type = 'sawtooth';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}
let lastMoveSound = 0;
function updateShip() {
  const prevX = ship.x;
  const prevY = ship.y;
  if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
  if (keys.ArrowRight || keys.d) ship.x += ship.speed;
  if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
  if (keys.ArrowDown || keys.s) ship.y += ship.speed;
  // Keep inside bounds (optional lose condition if off‑screen)
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));
  // Play movement sound if ship actually moved and enough time passed
  if ((ship.x !== prevX || ship.y !== prevY) && performance.now() - lastMoveSound > 150) {
    playBeep(600, 0.04);
    lastMoveSound = performance.now();
  }
}

// Asteroid pool
const asteroids = [];
let asteroidTimer = 0;
function spawnAsteroid() {
  const size = Math.random() * 40 + 10; // 10‑50px
  const speed = Math.random() * 2 + 1; // 1‑3 px/frame
  asteroids.push({
    x: canvas.width + size,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    speed,
  });
}

function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x -= a.speed;
    if (a.x + a.w < 0) asteroids.splice(i, 1);
  }
  // spawn interval
  asteroidTimer--;
  if (asteroidTimer <= 0) {
    spawnAsteroid();
    asteroidTimer = Math.floor(Math.random() * 60) + 30; // 0.5‑1.5 sec at 60fps
  }
}

function rectsCollide(r1, r2) {
  return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x &&
         r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

let score = 0;
let gameOver = false;

function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2 - 80, canvas.height / 2 + 40);
    return;
  }

  // Update
  updateShip();
  updateAsteroids();

  // Collision detection
  for (const a of asteroids) {
    if (rectsCollide(ship, a)) {
      gameOver = true;
      playCrash();
      break;
    }
  }

  // Score based on time survived
  score += 1 / 60; // assuming ~60fps

  // Draw background and stars (with simple parallax motion)
  drawStars();

  // Ship – draw as a simple triangle for a nicer look
  ctx.fillStyle = 'lime';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Asteroids – draw as circles with a subtle gradient
  for (const a of asteroids) {
    const grad = ctx.createRadialGradient(
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w * 0.2,
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 2,
    );
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Score overlay
  ctx.fillStyle = 'black';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  requestAnimationFrame(gameLoop);
}

// Start the game after DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(gameLoop));
} else {
  requestAnimationFrame(gameLoop);
}
