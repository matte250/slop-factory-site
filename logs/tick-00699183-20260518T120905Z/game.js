// Simple Asteroid Dodge game with enhanced graphics
// Targets <canvas id="game"></canvas>

const canvas = document.getElementById('game');
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, time) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + time);
}
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Pre‑generate star field for background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  });
}

function drawBackground() {
  // move stars slowly down for parallax effect
  for (const s of stars) {
    s.y += 0.2;
    if (s.y > canvas.height) s.y = 0;
  }

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Ship definition – draw as a triangle with gradient
const ship = {
  width: 40,
  height: 20,
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  moveLeft: false,
  moveRight: false,
  draw() {
    // draw ship as a gradient triangle
    const gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(1, '#006400');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
  },
  update() {
    if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
    if (this.moveRight) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
  }
};

// Asteroid pool
let asteroids = [];
let spawnTimer = 0;
let spawnInterval = 90; // frames
let speedFactor = 1;
let gameOver = false;
let score = 0;

function spawnAsteroid() {
  // play spawn sound
  playBeep(300, 0.02);
  const size = Math.random() * 30 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2 * speedFactor + Math.random() * 2
  });
}

function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    // remove if off screen
    if (a.y > canvas.height) {
      asteroids.splice(i, 1);
      score++;
      // gradually increase difficulty
      if (score % 10 === 0) speedFactor += 0.2;
    } else if (collision(a, ship)) {
      gameOver = true;
    }
  }
}

function drawAsteroids() {
  for (const a of asteroids) {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.1,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function collision(ast, shp) {
  const collided = (
    ast.x < shp.x + shp.width &&
    ast.x + ast.size > shp.x &&
    ast.y < shp.y + shp.height &&
    ast.y + ast.size > shp.y
  );
  if (collided) {
    // play crash sound
    playBeep(100, 0.3);
  }
  return collided;
}
  return (
    ast.x < shp.x + shp.width &&
    ast.x + ast.size > shp.x &&
    ast.y < shp.y + shp.height &&
    ast.y + ast.size > shp.y
  );
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);
}

function gameLoop() {
  if (gameOver) {
    // Dark overlay for game over
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4444';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
    return;
  }

  // draw starry background
  drawBackground();

  ship.update();
  ship.draw();

  if (spawnTimer++ >= spawnInterval) {
    spawnAsteroid();
    spawnTimer = 0;
    // slightly speed up spawns
    if (spawnInterval > 30) spawnInterval -= 0.5;
  }

  updateAsteroids();
  drawAsteroids();
  drawScore();

  requestAnimationFrame(gameLoop);
}

// Input handling
window.addEventListener('keydown', e => {
  // Ensure audio context is running
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (e.key === 'ArrowLeft') ship.moveLeft = true;
  if (e.key === 'ArrowRight') ship.moveRight = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') ship.moveLeft = false;
  if (e.key === 'ArrowRight') ship.moveRight = false;
});

// Start game
requestAnimationFrame(gameLoop);
