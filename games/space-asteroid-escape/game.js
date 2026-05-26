// Simple Space Asteroid Escape game
// Canvas with id="game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// generate starfield
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  });
}

// Ship definition
const ship = {
  w: 40,
  h: 20,
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  lives: 3,
};

let left = false,
    right = false;

// Asteroid pool
const asteroids = [];
let asteroidTimer = 0;
let asteroidInterval = 90; // frames
let speedFactor = 1;
let score = 0;
let gameOver = false;

// Input handling
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = true;
  if (e.key === 'ArrowRight' || e.key === 'd') right = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'a') left = false;
  if (e.key === 'ArrowRight' || e.key === 'd') right = false;
});

function spawnAsteroid() {
  const radius = 15 + Math.random() * 10;
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const speed = 2 * speedFactor + Math.random();
  asteroids.push({ x, y: -radius, radius, speed });
}

function update() {
  if (gameOver) return;

  // move ship
  if (left) ship.x = Math.max(0, ship.x - ship.speed);
  if (right) ship.x = Math.min(canvas.width - ship.w, ship.x + ship.speed);

  // spawn asteroids
  if (asteroidTimer++ > asteroidInterval) {
    spawnAsteroid();
    asteroidTimer = 0;
    // gradually increase difficulty
    speedFactor += 0.02;
    asteroidInterval = Math.max(30, asteroidInterval - 0.5);
  }

  // update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    // collision detection (simple AABB vs circle)
    const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
    const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
    const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
    if (distX <= shipRect.w / 2 + a.radius && distY <= shipRect.h / 2 + a.radius) {
      // collision
      ship.lives--;
      sounds.collision.currentTime = 0;
      sounds.collision.play().catch(()=>{});
      asteroids.splice(i, 1);
      if (ship.lives <= 0) {
        gameOver = true;
        sounds.gameOver.currentTime = 0;
        sounds.gameOver.play().catch(()=>{});
      }
      continue;
    }
    // remove off‑screen asteroids and increment score
    if (a.y - a.radius > canvas.height) {
      asteroids.splice(i, 1);
      score++;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background space gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // starfield
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    // slight twinkle movement
    s.x += (Math.random() - 0.5) * 0.2;
    s.y += (Math.random() - 0.5) * 0.2;
    if (s.x < 0) s.x = canvas.width;
    if (s.x > canvas.width) s.x = 0;
    if (s.y < 0) s.y = canvas.height;
    if (s.y > canvas.height) s.y = 0;
  }

  // ship (draw as triangle for a nicer look)
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // asteroids
  ctx.fillStyle = '#888';
  for (const a of asteroids) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Lives: ${ship.lives}`, 10, 20);
  ctx.fillText(`Score: ${score}`, 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(loop);
  } else {
    draw(); // final frame with Game Over overlay
  }
}

// sound setup
const sounds = {
  // simple beep sound (collision)
  collision: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
  // short descending tone (game over)
  gameOver: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
  // low‑volume background hum
  bg: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
};
// configure background music
sounds.bg.loop = true;
sounds.bg.volume = 0.2;
sounds.bg.play().catch(()=>{});

// start the game
requestAnimationFrame(loop);
