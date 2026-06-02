// Simple Pixel Runner implementation
// Target canvas with id="game"
const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context is resumed on first user interaction
function resumeAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
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

const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 200;

// Game settings
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
let speed = 4;
let score = 0;
let gameOver = false;

// Player
const player = {
  x: 50,
  y: canvas.height - 40,
  w: 20,
  h: 30,
  vy: 0,
  onGround: true,
  draw() {
    // Player gradient fill
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0, '#ff0'); // top yellow
    grad.addColorStop(1, '#ffa500'); // bottom orange
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.w, this.h);
  },
  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    if (this.y + this.h >= canvas.height) {
      this.y = canvas.height - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  },
  jump() {
    if (this.onGround) {
      this.vy = JUMP_STRENGTH;
      this.onGround = false;
      // Play jump sound (high pitch)
      playTone(440, 0.1);
    }
  }
};

// Obstacles (simple gaps as rectangles)
const obstacles = [];
function addObstacle() {
  const width = 20 + Math.random() * 30;
  const height = 20 + Math.random() * 30;
  obstacles.push({
    x: canvas.width,
    y: canvas.height - height,
    w: width,
    h: height
  });
}
let obstacleTimer = 0;

function updateObstacles() {
  obstacleTimer--;
  if (obstacleTimer <= 0) {
    addObstacle();
    obstacleTimer = 90 - Math.min(score, 80); // increase frequency
  }
  obstacles.forEach(o => o.x -= speed);
  // remove off‑screen
  while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) {
    obstacles.shift();
    score++;
  }
}

function drawObstacles() {
  ctx.fillStyle = '#f00';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
}

function checkCollision() {
  for (const o of obstacles) {
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      // Play collision sound (low pitch)
      playTone(200, 0.2);
      gameOver = true;
    }
  }
}

function loop() {
  if (gameOver) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px monospace';
    ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
    ctx.fillText('Score: '+score, canvas.width/2-80, canvas.height/2+40);
    return;
  }
  // Draw background gradient and ground
const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
bgGradient.addColorStop(0, '#87CEEB'); // sky
bgGradient.addColorStop(1, '#fff'); // horizon
ctx.fillStyle = bgGradient;
ctx.fillRect(0, 0, canvas.width, canvas.height);
// Ground
ctx.fillStyle = '#654321';
ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
// Clear previous frame (only the play area above ground)
ctx.clearRect(0, 0, canvas.width, canvas.height - 20);
  player.update();
  player.draw();
  updateObstacles();
  drawObstacles();
  checkCollision();
  ctx.fillStyle = '#000';
  ctx.font = '16px monospace';
  ctx.fillText('Score: '+score, 10,20);
  requestAnimationFrame(loop);
}

// Controls
window.addEventListener('keydown', e => {
  resumeAudio();
  if (e.code === 'Space' || e.key === ' ') player.jump();
});
canvas.addEventListener('touchstart', () => player.jump());

// Start
loop();
