// Simple temporal rewind game
// Canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

// Player (dot) stays at a fixed x, moves forward visually by background scroll
const player = { x: 100, y: canvas.height / 2, radius: 8 };

// Obstacles move left; on rewind they move right for a short time
let obstacles = [];
const obstacleWidth = 20;
const obstacleGap = 120; // vertical gap between top/bottom parts
const spawnInterval = 1500; // ms
let lastSpawn = 0;
let speed = 2; // pixels per frame
let rewind = false;
let rewindTimer = 0;

function spawnObstacle() {
  const gapY = Math.random() * (canvas.height - obstacleGap - 40) + 20;
  // top obstacle
  obstacles.push({ x: canvas.width, y: 0, w: obstacleWidth, h: gapY });
  // bottom obstacle
  obstacles.push({ x: canvas.width, y: gapY + obstacleGap, w: obstacleWidth, h: canvas.height - (gapY + obstacleGap) });
}

function update(dt) {
  // spawn
  if (performance.now() - lastSpawn > spawnInterval) {
    spawnObstacle();
    lastSpawn = performance.now();
  }

  // move obstacles
  const move = rewind ? speed : -speed; // rewind moves them right
  obstacles.forEach(o => o.x += move);
  // remove off‑screen
  obstacles = obstacles.filter(o => o.x + o.w > 0 && o.x < canvas.width);

  // rewind timer
  if (rewind) {
    rewindTimer -= dt;
    if (rewindTimer <= 0) {
      rewind = false;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // player
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  // obstacles
  ctx.fillStyle = '#0a0';
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
}

let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Trigger rewind on tap / click
canvas.addEventListener('pointerdown', () => {
  rewind = true;
  rewindTimer = 2000; // ms
});
