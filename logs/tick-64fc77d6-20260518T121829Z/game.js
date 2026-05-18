// Simple Cosmic Dodge game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Player (triangle ship)
const player = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  size: 20, // ship size (length of base)
  speed: 4,
  color: '#0ff',
  shield: false,
  shieldTimer: 0,
};

// Stars for background
// Sound effects
const sounds = {
  // collision sound (game over)
  collision: new Audio('https://www.soundjay.com/button/sounds/button-10.wav'),
  // shield block sound
  shield: new Audio('https://www.soundjay.com/button/sounds/button-09.wav'),
  // power‑up collect sound
  powerup: new Audio('https://www.soundjay.com/button/sounds/button-16.wav'),
  // background music (loop)
  bg: new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3')
};
sounds.bg.loop = true;
sounds.bg.volume = 0.2;
sounds.bg.play();
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
  });
}

// Asteroids
const asteroids = [];
const asteroidSpawnRate = 90; // frames
let frameCount = 0;

// Power‑ups (simple shield)
const powerUps = [];
const powerUpSpawnRate = 600;

// Input handling
const keys = {};
window.addEventListener('keydown', e => {keys[e.key] = true;});
window.addEventListener('keyup', e => {keys[e.key] = false;});

function updatePlayer() {
  if (keys.ArrowUp || keys.w) player.y -= player.speed;
  if (keys.ArrowDown || keys.s) player.y += player.speed;
  if (keys.ArrowLeft || keys.a) player.x -= player.speed;
  if (keys.ArrowRight || keys.d) player.x += player.speed;
  // keep inside canvas
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
  if (player.shield) {
    player.shieldTimer--;
    if (player.shieldTimer <= 0) player.shield = false;
  }
}

function spawnAsteroid() {
  const size = Math.random() * 30 + 10;
  const x = Math.random() * (canvas.width - size);
  const speed = Math.random() * 2 + 1;
  asteroids.push({x, y: -size, size, speed});
}

function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    if (a.y > canvas.height) asteroids.splice(i, 1);
  }
}

function spawnPowerUp() {
  const size = 15;
  const x = Math.random() * (canvas.width - size);
  const y = -size;
  const speed = 2;
  powerUps.push({x, y, size, speed});
}

function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    p.y += p.speed;
    if (p.y > canvas.height) powerUps.splice(i, 1);
  }
}

function checkCollisions() {
  // Asteroid collisions
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    if (
      player.x < a.x + a.size &&
       player.x + player.size > a.x &&
      player.y < a.y + a.size &&
       player.y + player.size > a.y
    ) {
if (player.shield) {
          // shield blocks asteroid
          sounds.shield.play();
          asteroids.splice(i, 1);
        } else {
          // collision ends game
          sounds.collision.play();
          gameOver();
          return;
        }
    }
  }
  // Power‑up collisions
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    if (
      player.x < p.x + p.size &&
       player.x + player.size > p.x &&
      player.y < p.y + p.size &&
       player.y + player.size > p.y
    ) {
      player.shield = true;
      player.shieldTimer = 300; // frames
      powerUps.splice(i, 1);
    }
  }
}

let running = true;

function updateStars() {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.y += 0.5;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }
}
function gameOver() {
  running = false;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // player
  ctx.fillStyle = player.shield ? '#ff0' : player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
  // asteroids
  ctx.fillStyle = '#777';
  asteroids.forEach(a => ctx.fillRect(a.x, a.y, a.size, a.size));
  // power‑ups
  ctx.fillStyle = '#0f0';
  powerUps.forEach(p => ctx.fillRect(p.x, p.y, p.size, p.size));
}

function loop() {
  if (!running) return;
  frameCount++;
  updatePlayer();
  if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
  if (frameCount % powerUpSpawnRate === 0) spawnPowerUp();
  updateAsteroids();
  updatePowerUps();
  checkCollisions();
  draw();
  requestAnimationFrame(loop);
}

// start game
requestAnimationFrame(loop);
