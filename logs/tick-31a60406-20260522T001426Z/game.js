// Minimal endless‑runner for canvas with id "game"
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas #game not found');
const ctx = canvas.getContext('2d');
// Audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Game parameters
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const PLAYER_SIZE = 30;
const SCROLL_SPEED = 4;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_GAP = 150; // distance between obstacles

let player = { x: 50, y: canvas.height - PLAYER_SIZE, vy: 0, width: PLAYER_SIZE, height: PLAYER_SIZE, onGround: true };
let obstacles = [];
let frameCount = 0;
let gameOver = false;

function spawnObstacle() {
  const height = Math.random() * (canvas.height / 2) + 20;
  const type = Math.random() < 0.5 ? 'spike' : 'low'; // spike: tall, low: short bar
  const obs = {
    x: canvas.width,
    y: type === 'spike' ? canvas.height - height : canvas.height - PLAYER_SIZE - 10,
    width: OBSTACLE_WIDTH,
    height,
    type,
  };
  obstacles.push(obs);
}

function update() {
  if (gameOver) return;
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= canvas.height - PLAYER_SIZE) {
    player.y = canvas.height - PLAYER_SIZE;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Obstacles movement and removal
  obstacles.forEach(o => (o.x -= SCROLL_SPEED));
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  // Spawn new obstacles
  if (frameCount % Math.round(OBSTACLE_GAP / SCROLL_SPEED) === 0) spawnObstacle();

  // Collision detection
  for (const o of obstacles) {
    const hit =
      player.x < o.x + o.width &&
      player.x + player.width > o.x &&
      player.y < o.y + o.height &&
      player.y + player.height > o.y;
    if (hit) { gameOver = true; playTone(150, 0.3); break; }
  }
  frameCount++;
}

function draw() {
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#87ceeb'); // sky blue
  grad.addColorStop(1, '#e0f7fa'); // light cyan
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // No need to clear; gradient already fills background
  // ground line
  ctx.fillStyle = '#555';
  ctx.fillRect(0, canvas.height - 5, canvas.width, 5);
  // player
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  // obstacles
  ctx.fillStyle = '#f00';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Input – tap/click to jump
canvas.addEventListener('click', () => {
  // Ensure audio context is running
  if (audioCtx.state !== 'running') audioCtx.resume();
  if (player.onGround) {
    player.vy = JUMP_VELOCITY;
    playTone(300, 0.1); // jump sound
  }
});
  if (player.onGround) player.vy = JUMP_VELOCITY;
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (player.onGround) player.vy = JUMP_VELOCITY;
});

// Start game
requestAnimationFrame(loop);
