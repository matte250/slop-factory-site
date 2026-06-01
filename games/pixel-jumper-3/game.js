// Simple endless runner: Pixel Jumper
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Sound effects
const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // simple beep
const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAD//w=='); // simple crash
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 200;

// Player square
const player = {
  x: 50,
  y: canvas.height - 30,
  size: 20,
  vy: 0,
  grounded: true,
};
const GRAVITY = 0.8;
const JUMP_STRENGTH = -12;

// Spikes
const spikes = [];
const SPIKE_WIDTH = 20;
const SPIKE_HEIGHT = 30;
let spikeTimer = 0;
const SPIKE_INTERVAL = 90; // frames

let gameOver = false;

function reset() {
  player.y = canvas.height - 30;
  player.vy = 0;
  player.grounded = true;
  spikes.length = 0;
  spikeTimer = 0;
  gameOver = false;
  loop();
}

function spawnSpike() {
  spikes.push({ x: canvas.width, y: canvas.height - SPIKE_HEIGHT, w: SPIKE_WIDTH, h: SPIKE_HEIGHT });
}

function update() {
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y + player.size >= canvas.height) {
    player.y = canvas.height - player.size;
    player.vy = 0;
    player.grounded = true;
  }

  // Spikes movement and recycling
  for (let i = spikes.length - 1; i >= 0; i--) {
    const s = spikes[i];
    s.x -= 4;
    // Remove off‑screen spikes
    if (s.x + s.w < 0) spikes.splice(i, 1);
  }

  // Spawn spikes
  if (spikeTimer-- <= 0) {
    spawnSpike();
    spikeTimer = SPIKE_INTERVAL + Math.random() * 30;
  }

  // Collision detection
  for (const s of spikes) {
    if (
      player.x < s.x + s.w &&
      player.x + player.size > s.x &&
      player.y < s.y + s.h &&
      player.y + player.size > s.y
    ) {
      gameOver = true;
      // Play crash sound
      crashSound.currentTime = 0;
      crashSound.play();
    }
  }
}

function draw() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#87CEEB'); // sky blue
  grad.addColorStop(1, '#fff8dc'); // light ground
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground line
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();

  // Draw player as rounded square
  ctx.fillStyle = '#0a0';
  const r = 4; // corner radius
  ctx.beginPath();
  ctx.moveTo(player.x + r, player.y);
  ctx.lineTo(player.x + player.size - r, player.y);
  ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + r);
  ctx.lineTo(player.x + player.size, player.y + player.size - r);
  ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - r, player.y + player.size);
  ctx.lineTo(player.x + r, player.y + player.size);
  ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - r);
  ctx.lineTo(player.x, player.y + r);
  ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
  ctx.closePath();
  ctx.fill();

  // Draw spikes as triangles
  ctx.fillStyle = '#a00';
  for (const s of spikes) {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  if (!gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling
function jump() {
  if (player.grounded && !gameOver) {
    player.vy = JUMP_STRENGTH;
    player.grounded = false;
    // Play jump sound
    jumpSound.currentTime = 0;
    jumpSound.play();
  } else if (gameOver) {
    reset();
  }
}
window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
canvas.addEventListener('click', jump);

// Start game
reset();
