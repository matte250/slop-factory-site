// Minimal Gravity Runner game implementation
// Assumes an HTML canvas element with id="game"

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Set canvas size if not set via CSS/HTML
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 400;

// Game configuration
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 2; // forward speed (px/frame)
const GRAVITY_STRENGTH = 0.5; // acceleration per frame
const OBSTACLE_SPACING = 200; // distance between obstacles
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 80;

// Visual tweaks
const BG_GRADIENT = (ctx) => {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#1e1e2f');
  grad.addColorStop(1, '#0a0a10');
  return grad;
};
const PLAYER_COLOR = '#ffdd00'; // bright yellow
const OBSTACLE_COLOR = '#555'; // darker gray
// Simple starfield for parallax effect
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
}
function drawStars(offset) {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    const sx = (s.x - offset) % canvas.width;
    ctx.beginPath();
    ctx.arc(sx < 0 ? sx + canvas.width : sx, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

let lastTimestamp = 0;
let score = 0;
let gameOver = false;

// Player state
const player = {
  x: 50,
  y: canvas.height / 2 - PLAYER_SIZE / 2,
  vx: PLAYER_SPEED,
  vy: 0,
  size: PLAYER_SIZE,
  // gravity direction: 0 = down, Math.PI/2 = left, Math.PI = up, 3*Math.PI/2 = right
  gravityAngle: Math.PI / 2, // start falling left
};

// Obstacles are simple rectangles placed ahead of the player
const obstacles = [];
let nextObstacleX = canvas.width + OBSTACLE_SPACING;

function spawnObstacle() {
  const gapY = Math.random() * (canvas.height - OBSTACLE_HEIGHT * 2) + OBSTACLE_HEIGHT;
  // Top obstacle
  obstacles.push({
    x: nextObstacleX,
    y: 0,
    width: OBSTACLE_WIDTH,
    height: gapY - OBSTACLE_HEIGHT / 2,
  });
  // Bottom obstacle
  obstacles.push({
    x: nextObstacleX,
    y: gapY + OBSTACLE_HEIGHT / 2,
    width: OBSTACLE_WIDTH,
    height: canvas.height - (gapY + OBSTACLE_HEIGHT / 2),
  });
  nextObstacleX += OBSTACLE_SPACING;
}

function update(delta) {
  if (gameOver) return;

  // Apply gravity based on current angle
  const gx = Math.cos(player.gravityAngle) * GRAVITY_STRENGTH;
  const gy = Math.sin(player.gravityAngle) * GRAVITY_STRENGTH;
  player.vx += gx * delta;
  player.vy += gy * delta;

  // Forward motion (constant speed to the right)
  player.x += player.vx * delta;
  player.y += player.vy * delta;

  // Simple bounds check – keep player within canvas vertically
  if (player.y < 0) {
    player.y = 0;
    player.vy = 0;
  } else if (player.y + player.size > canvas.height) {
    player.y = canvas.height - player.size;
    player.vy = 0;
  }

  // Move obstacles left relative to player movement to keep camera static
  const camShift = player.vx * delta;
  obstacles.forEach(o => (o.x -= camShift));

  // Remove off‑screen obstacles
  while (obstacles.length && obstacles[0].x + obstacles[0].width < 0) {
    obstacles.shift();
  }

  // Spawn new obstacles as needed
  if (nextObstacleX - player.x < canvas.width) {
    spawnObstacle();
  }

  // Collision detection
  for (const o of obstacles) {
    if (
      player.x < o.x + o.width &&
      player.x + player.size > o.x &&
      player.y < o.y + o.height &&
      player.y + player.size > o.y
    ) {
      gameOver = true; playTone(150, 0.3); // collision sound
      break;
    }
  }

  // Update score (distance traveled)
  score = Math.floor(player.x - 50);
}

function draw() {
  // Background gradient
  ctx.fillStyle = BG_GRADIENT(ctx);
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Parallax starfield
  drawStars(player.x * 0.5);

  // Draw player (bright yellow square with slight shadow)
  ctx.fillStyle = PLAYER_COLOR;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 5;
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.shadowBlur = 0; // reset

  // Draw obstacles (darker gray) with rounded corners
  ctx.fillStyle = OBSTACLE_COLOR;
  for (const o of obstacles) {
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(o.x + radius, o.y);
    ctx.lineTo(o.x + o.width - radius, o.y);
    ctx.quadraticCurveTo(o.x + o.width, o.y, o.x + o.width, o.y + radius);
    ctx.lineTo(o.x + o.width, o.y + o.height - radius);
    ctx.quadraticCurveTo(o.x + o.width, o.y + o.height, o.x + o.width - radius, o.y + o.height);
    ctx.lineTo(o.x + radius, o.y + o.height);
    ctx.quadraticCurveTo(o.x, o.y + o.height, o.x, o.y + o.height - radius);
    ctx.lineTo(o.x, o.y + radius);
    ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
    ctx.closePath();
    ctx.fill();
  }

  // Draw score with contrasting color
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffdd00';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  }
}

function loop(timestamp) {
  const delta = (timestamp - lastTimestamp) / 16.666; // normalize to ~60fps units
  lastTimestamp = timestamp;
  if (!gameOver) update(delta);
  draw();
  requestAnimationFrame(loop);
}

// Input handling – left/right arrows change gravity direction
// Simple sound generation using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  // Ensure context is running (required by some browsers)
  if (audioCtx.state !== 'running') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  // quick fade in/out to avoid click
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') {
    // Gravity pulls to the left
    player.gravityAngle = Math.PI; // left
    playTone(330, 0.1); // lower tone for left
  } else if (e.code === 'ArrowRight') {
    // Gravity pulls to the right
    player.gravityAngle = 0; // right (downward in canvas coords)
    playTone(440, 0.1); // higher tone for right
  }
});

// Start the game loop
requestAnimationFrame(loop);
