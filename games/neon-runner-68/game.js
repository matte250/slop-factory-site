// Neon Runner – simple side‑scroll canvas game
// Canvas element with id="game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

// ----- Audio setup -----
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playTone(freq, duration) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJumpSound() { playTone(300, 0.2); }
function playCollectSound() { playTone(800, 0.1); }
function playGameOverSound() { playTone(150, 0.5); }

// ----- Game constants -----
const GRAVITY = 0.6;
// colors & effects
const BG_GRADIENT_TOP = '#001';
const BG_GRADIENT_BOTTOM = '#220';
const PLAYER_COLOR = '#0ff';
const OBSTACLE_COLOR = '#555';
const ORB_COLOR = '#ff0';
const SHADOW_COLOR = '#0ff';
const SHADOW_BLUR = 15;
const JUMP_STRENGTH = -12;
const PLAYER_X = 80; // fixed horizontal position
const PLAYER_SIZE = 20;
const OBSTACLE_SPEED = 4;
const OBSTACLE_INTERVAL = 1500; // ms
const ORB_SPEED = OBSTACLE_SPEED;
const ORB_INTERVAL = 2000; // ms

let score = 0;
let gameOver = false;

// ----- Player -----
const player = {
  y: canvas.height - PLAYER_SIZE,
  vy: 0,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  jumping: false,
};

function jump() {
  initAudio();
  if (!player.jumping) {
    player.vy = JUMP_STRENGTH;
    player.jumping = true;
    playJumpSound();
  }
}

// ----- Input handling -----
window.addEventListener('keydown', e => {
  if (e.code === 'Space') jump();
});
canvas.addEventListener('click', jump);

// ----- Obstacles -----
const obstacles = [];
function spawnObstacle() {
  const height = 20 + Math.random() * 60; // 20–80px
  obstacles.push({
    x: canvas.width,
    y: canvas.height - height,
    width: 20,
    height,
  });
}
setInterval(spawnObstacle, OBSTACLE_INTERVAL);

// ----- Orbs (collectibles) -----
const orbs = [];
function spawnOrb() {
  const radius = 6;
  const y = canvas.height / 2 - Math.random() * 150;
  orbs.push({ x: canvas.width, y, radius, collected: false });
}
setInterval(spawnOrb, ORB_INTERVAL);

// ----- Collision helpers -----
function rectIntersect(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y;
}
function rectCircleIntersect(rect, circle) {
  const distX = Math.abs(circle.x - rect.x - rect.width / 2);
  const distY = Math.abs(circle.y - rect.y - rect.height / 2);
  if (distX > rect.width / 2 + circle.radius) return false;
  if (distY > rect.height / 2 + circle.radius) return false;
  if (distX <= rect.width / 2) return true;
  if (distY <= rect.height / 2) return true;
  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

// ----- Game loop -----
function update() {
  if (gameOver) return;

  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.vy = 0;
    player.jumping = false;
  }

  // Move obstacles leftward and check collisions
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.x -= OBSTACLE_SPEED;
    if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    else if (rectIntersect({ x: PLAYER_X, y: player.y, width: player.width, height: player.height }, obs)) {
      playGameOverSound();
      gameOver = true;
    }
  }

  // Move orbs leftward and collect
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    orb.x -= ORB_SPEED;
    if (orb.x + orb.radius < 0) orbs.splice(i, 1);
    else if (!orb.collected && rectCircleIntersect({ x: PLAYER_X, y: player.y, width: player.width, height: player.height }, orb)) {
      initAudio();
      playCollectSound();
      orb.collected = true;
      score += 1;
      orbs.splice(i, 1);
    }
  }
}

function render() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, BG_GRADIENT_TOP);
  bgGrad.addColorStop(1, BG_GRADIENT_BOTTOM);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player (neon line) with glow
  ctx.shadowColor = SHADOW_COLOR;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.fillStyle = PLAYER_COLOR;
  ctx.fillRect(PLAYER_X, player.y, player.width, player.height);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw obstacles (rounded dark blocks)
  ctx.fillStyle = OBSTACLE_COLOR;
  obstacles.forEach(o => {
    ctx.beginPath();
    const radius = 4;
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
  });

  // Draw orbs (glowing points with radial gradient)
  orbs.forEach(o => {
    const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
    grad.addColorStop(0, ORB_COLOR);
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Score text neon style
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.fillText('Score: ' + score, 10, 30);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f88';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  render();
  if (!gameOver) requestAnimationFrame(loop);
}

// Start the game
loop();
