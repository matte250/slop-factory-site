// Simple endless runner based on IDEA.md
// Canvas with id="game"

const canvas = document.getElementById('game');
if (!canvas) {
  throw new Error('Canvas element with id "game" not found');
}
const ctx = canvas.getContext('2d');
// Load sound effects (data URLs for simplicity)
const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA'); // short beep
const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA'); // short beep
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Player configuration
const player = {
  x: 50,
  size: 20,
  // ground position (bottom of canvas minus player size)
  groundY: HEIGHT - 20,
  y: HEIGHT - 20,
  vy: 0,
  gravity: 0.6,
  jumpStrength: -12,
  isJumping: false,
};

// Obstacle configuration
const obstacles = [];
const obstacleSpeed = 4;
let obstacleTimer = 0;
const obstacleInterval = 1500; // ms

let score = 0;
let lastTimestamp = 0;
let gameOver = false;

function spawnObstacle() {
  const size = 20 + Math.random() * 30; // random width/height
  obstacles.push({
    x: WIDTH,
    y: HEIGHT - size,
    width: size,
    height: size,
  });
}

function resetGame() {
  player.y = player.groundY;
  player.vy = 0;
  player.isJumping = false;
  obstacles.length = 0;
  obstacleTimer = 0;
  score = 0;
  gameOver = false;
  lastTimestamp = performance.now();
  requestAnimationFrame(loop);
}

function handleJump() {
  if (!player.isJumping) {
    player.vy = player.jumpStrength;
    player.isJumping = true;
    // play jump sound
    if (jumpSound && typeof jumpSound.play === 'function') {
      jumpSound.currentTime = 0;
      jumpSound.play();
    }
  }
}

// Input: spacebar or mouse click/tap
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') handleJump();
});
canvas.addEventListener('mousedown', handleJump);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleJump();
});

function update(delta) {
  // Player physics
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y >= player.groundY) {
    player.y = player.groundY;
    player.vy = 0;
    player.isJumping = false;
  }

  // Obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= obstacleSpeed;
    // Remove off‑screen obstacles
    if (obs.x + obs.width < 0) obstacles.splice(i, 1);
  }

  // Spawn new obstacles
  obstacleTimer += delta;
  if (obstacleTimer > obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Collision detection (AABB)
  for (const obs of obstacles) {
      if (
        player.x < obs.x + obs.width &&
        player.x + player.size > obs.x &&
        player.y < obs.y + obs.height &&
        player.y + player.size > obs.y
      ) {
        gameOver = true;
        // play game over sound
        if (gameOverSound && typeof gameOverSound.play === 'function') {
          gameOverSound.currentTime = 0;
          gameOverSound.play();
        }
        break;
      }
  }

  // Score increases with time
  score += delta / 1000;
}

function draw() {
  // Background gradient (sky to ground)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#87CEEB'); // light sky blue
  bgGrad.addColorStop(1, '#f0e68c'); // light ground yellow
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground line
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, player.groundY + player.size);
  ctx.lineTo(WIDTH, player.groundY + player.size);
  ctx.stroke();

  // Draw player (rounded square with gradient)
  const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.size);
  playerGrad.addColorStop(0, '#ff4500'); // orange-red top
  playerGrad.addColorStop(1, '#ff8c00'); // orange bottom
  ctx.fillStyle = playerGrad;
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.size - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + radius);
  ctx.lineTo(player.x + player.size, player.y + player.size - radius);
  ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - radius, player.y + player.size);
  ctx.lineTo(player.x + radius, player.y + player.size);
  ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();

  // Draw obstacles (shadowed rectangles with gradient)
  for (const obs of obstacles) {
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(obs.x + 3, obs.y + 3, obs.width, obs.height);
    // obstacle gradient
    const obsGrad = ctx.createLinearGradient(0, obs.y, 0, obs.y + obs.height);
    obsGrad.addColorStop(0, '#808080');
    obsGrad.addColorStop(1, '#a9a9a9');
    ctx.fillStyle = obsGrad;
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  }

  // Draw score
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (gameOver) {
    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
    ctx.fillText('Final Score: ' + Math.floor(score), WIDTH / 2, HEIGHT / 2 + 20);
    ctx.textAlign = 'start';
  }
}

function loop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;
  if (!gameOver) {
    update(delta);
    draw();
    requestAnimationFrame(loop);
  } else {
    draw(); // draw final frame with overlay
  }
}

// Start the game
resetGame();
