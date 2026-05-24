// Simple endless runner using canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;
// Visual settings
const groundHeight = 20;
const skyColor = '#87CEEB';
const groundColor = '#654321';

// Game parameters
let speed = 2; // base scroll speed
let gravity = 0.6;
let spawnTimer = 0;
let gameOver = false;

// Player square
const player = {
  w: 30,
  h: 30,
  x: 50,
  y: canvas.height - groundHeight - 30,
  vy: 0,
  color: '#ff5733',
  jump() {
    if (this.onGround) this.vy = -12;
  },
  get onGround() {
    return this.y >= canvas.height - groundHeight - this.h;
  },
  update() {
    this.vy += gravity;
    this.y += this.vy;
    if (this.y > canvas.height - groundHeight - this.h) this.y = canvas.height - groundHeight - this.h;
  },
  draw() {
    // Gradient for a nicer look
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0, '#ff9');
    grad.addColorStop(1, this.color);
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
};

// Obstacles
const obstacles = [];
function spawnObstacle() {
  const size = 20 + Math.random() * 30;
  const hue = Math.floor(Math.random() * 360);
  obstacles.push({
    w: size,
    h: size,
    x: canvas.width,
    y: canvas.height - groundHeight - size,
    color: `hsl(${hue}, 70%, 30%)`
  });
}

// Clouds for background
const clouds = [];
let cloudSpawnTimer = 0;
function spawnCloud() {
  const w = 40 + Math.random() * 60;
  const h = w * 0.6;
  const y = 20 + Math.random() * (canvas.height / 2 - 40);
  clouds.push({ x: canvas.width, y, w, h, speed: speed * 0.5 });
}
function updateClouds() {
  cloudSpawnTimer++;
  if (cloudSpawnTimer > 150) {
    spawnCloud();
    cloudSpawnTimer = 0;
  }
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x -= c.speed;
    if (c.x + c.w < 0) clouds.splice(i, 1);
  }
}
function drawClouds() {
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}


function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }
}

function drawObstacles() {
  obstacles.forEach(o => {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
}

function checkCollision() {
  for (const o of obstacles) {
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      return true;
    }
  }
  return false;
}

function gameLoop() {
  if (gameOver) return;
  // Draw background
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Ground
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // Update speed gradually
  speed += 0.0005;

  // Spawn obstacles
  spawnTimer++;
  if (spawnTimer > 100) {
    spawnObstacle();
    spawnTimer = 0;
  }

  // Draw and update clouds
  updateClouds();
  drawClouds();

  // Update and draw entities
  player.update();
  player.draw();
  updateObstacles();
  drawObstacles();

  // Collision detection
  if (checkCollision()) {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    return;
  }

  requestAnimationFrame(gameLoop);
}

// Input handling – space or click to jump
window.addEventListener('keydown', e => { if (e.code === 'Space') player.jump(); });
canvas.addEventListener('click', () => player.jump());

// Start the game
gameLoop();
