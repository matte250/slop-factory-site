// Flip Runner – simple canvas game
// Canvas element with id="game" is assumed to exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

// Audio setup
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
  osc.stop(audioCtx.currentTime + duration);
}

// Game settings
const GRAVITY = 0.6;
const PLAYER_SIZE = 30;
const PLAYER_X = 80;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_GAP = 200; // distance between spawn attempts (px)
const OBSTACLE_SPEED = 4;

let lastObstacleTime = 0;
let gameOver = false;

// Player state
const player = {
  x: PLAYER_X,
  y: canvas.height - PLAYER_SIZE,
  vy: 0,
  onFloor: true,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
};

// Obstacles array
const obstacles = [];

// Flip gravity on click/tap
canvas.addEventListener('click', () => {
  // Resume audio context (required by some browsers)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (gameOver) return;
  player.onFloor = !player.onFloor;
  // Give an instant impulse away from the surface
  player.vy = player.onFloor ? -12 : 12;
  // Play flip sound
  playTone(440, 0.1);
});

function spawnObstacle() {
  const onFloor = Math.random() < 0.5;
  const y = onFloor ? canvas.height - OBSTACLE_WIDTH : 0;
  obstacles.push({
    x: canvas.width,
    y,
    width: OBSTACLE_WIDTH,
    height: OBSTACLE_WIDTH,
    onFloor,
  });
}

function update(delta) {
  // Player physics
  player.vy += player.onFloor ? GRAVITY : -GRAVITY;
  player.y += player.vy;

  // Keep player from leaving the canvas (simple bound)
  if (player.onFloor) {
    if (player.y > canvas.height - PLAYER_SIZE) {
      player.y = canvas.height - PLAYER_SIZE;
      player.vy = 0;
    }
    if (player.y < 0) player.y = 0; // prevent going through ceiling
  } else {
    if (player.y < 0) {
      player.y = 0;
      player.vy = 0;
    }
    if (player.y > canvas.height - PLAYER_SIZE) player.y = canvas.height - PLAYER_SIZE;
  }

  // Obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBSTACLE_SPEED;
    // Remove off‑screen obstacles
    if (o.x + o.width < 0) obstacles.splice(i, 1);
  }

  // Spawn new obstacles
  if (performance.now() - lastObstacleTime > OBSTACLE_GAP) {
    spawnObstacle();
    lastObstacleTime = performance.now();
  }

  // Collision detection
  for (const o of obstacles) {
    if (
      player.x < o.x + o.width &&
      player.x + player.width > o.x &&
      player.y < o.y + o.height &&
      player.y + player.height > o.y
    ) {
      gameOver = true;
      // Play collision sound
      playTone(220, 0.3);
    }
  }
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Floor and ceiling lines
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 1);
  ctx.lineTo(canvas.width, canvas.height - 1);
  ctx.moveTo(0, 1);
  ctx.lineTo(canvas.width, 1);
  ctx.stroke();

  // Draw player as a rounded square
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  const radius = 6;
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.width - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.width, player.y, player.x + player.width, player.y + radius);
  ctx.lineTo(player.x + player.width, player.y + player.height - radius);
  ctx.quadraticCurveTo(player.x + player.width, player.y + player.height, player.x + player.width - radius, player.y + player.height);
  ctx.lineTo(player.x + radius, player.y + player.height);
  ctx.quadraticCurveTo(player.x, player.y + player.height, player.x, player.y + player.height - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.fill();

  // Draw obstacles with slight color variation
  for (const o of obstacles) {
    ctx.fillStyle = o.onFloor ? '#f44' : '#44f';
    ctx.fillRect(o.x, o.y, o.width, o.height);
  }

  // Score (optional)
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(performance.now() / 1000), 10, 30);

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) update(delta);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
