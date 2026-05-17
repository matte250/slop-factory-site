const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Star field for background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  });
}

// Audio assets
const hitSound = new Audio('https://cdn.jsdelivr.net/gh/akshayinc/minecraft-sound-assets@master/hit.wav');
const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/akshayinc/minecraft-sound-assets@master/background.mp3');
bgMusic.loop = true;
let musicStarted = false;

const ship = { x: canvas.width / 2 - 20, y: canvas.height - 30, w: 40, h: 20, speed: 5 };
let asteroids = [];
let lastSpawn = 0;
let score = 0;
let lives = 3;
const keys = {};

function spawnAsteroid() {
  const size = 20 + Math.random() * 30;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    w: size,
    h: size,
    speed: 2 + Math.random() * 3,
  });
}

function update(dt) {
  // Ship movement
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

  // Update asteroids
  for (const a of asteroids) a.y += a.speed;
  asteroids = asteroids.filter(a => a.y < canvas.height);

  // Spawn new asteroids
  if (Date.now() - lastSpawn > 800) {
    spawnAsteroid();
    lastSpawn = Date.now();
  }

  // Collision detection
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    const collided = !(ship.x > a.x + a.w || ship.x + ship.w < a.x || ship.y > a.y + a.h || ship.y + ship.h < a.y);
    if (collided) {
      hitSound.currentTime = 0;
      hitSound.play();
      lives--;
      asteroids.splice(i, 1);
      if (lives === 0) {
        cancelAnimationFrame(animId);
        alert('Game Over');
        return;
      }
    }
  }
  score += dt / 1000;
}

function draw() {
  // Dark space background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw stars
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw ship as a triangle
  ctx.fillStyle = '#00ffdd';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Draw asteroids with gradient
  for (const a of asteroids) {
    const grad = ctx.createRadialGradient(
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w * 0.2,
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 2
    );
    grad.addColorStop(0, '#888888');
    grad.addColorStop(1, '#222222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = 'yellow';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
  ctx.fillText(`Lives: ${lives}`, 10, 40);
}

let lastTime = 0;
let animId;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  if (lives > 0) animId = requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!musicStarted) {
    bgMusic.play();
    musicStarted = true;
  }
});
window.addEventListener('keyup', e => (keys[e.key] = false));
