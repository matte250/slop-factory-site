// Simple endless runner targeting canvas with id="game"
const canvas = document.getElementById('game');

const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Game config
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
const GRAVITY = 0.6;
const JUMP = -12;
const PLAYER_W = 30;
const PLAYER_H = 50;
const OBSTACLE_W = 30;
const OBSTACLE_GAP = 200; // distance between obstacles
const SPEED = 4;
const GROUND_HEIGHT = 40;

let player = {x: 50, y: canvas.height - PLAYER_H - GROUND_HEIGHT, w: PLAYER_W, h: PLAYER_H, vy: 0, onGround: true};
let obstacles = [];
let frames = 0;
let score = 0;
let gameOver = false;

function spawnObstacle() {
  const height = Math.random() * (PLAYER_H * 2) + 20; // variable height
  obstacles.push({x: canvas.width, y: canvas.height - GROUND_HEIGHT - height, w: OBSTACLE_W, h: height});
}

function reset() {
  player.y = canvas.height - PLAYER_H - GROUND_HEIGHT; player.vy = 0; player.onGround = true;
  obstacles = [];
  frames = 0; score = 0; gameOver = false;
}

function update() {
  if (gameOver) return;
  frames++;
  // player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y + player.h >= canvas.height - GROUND_HEIGHT) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }
  // obstacles movement
  obstacles.forEach(o => o.x -= SPEED);
  // remove off‑screen obstacles
  obstacles = obstacles.filter(o => o.x + o.w > 0);
  // spawn new obstacles periodically
  if (frames % Math.round(OBSTACLE_GAP / SPEED) === 0) spawnObstacle();
  // collision detection
  for (let o of obstacles) {
if (player.x < o.x + o.w && player.x + player.w > o.x &&
        player.y < o.y + o.h && player.y + player.h > o.y) {
      gameOver = true;
      playTone(220, 0.3); // collision sound
      break;
    }
  if (!gameOver) score = Math.floor(frames / 5);
}

function draw() {
  // background gradient sky
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#87CEEB'); // sky blue
  bgGrad.addColorStop(1, '#B0E0E6'); // light steel blue
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground rectangle
  const groundHeight = 40;
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

  // obstacles with gradient fill
  const obsGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  obsGrad.addColorStop(0, '#FF6F61');
  obsGrad.addColorStop(1, '#FF3B30');
  ctx.fillStyle = obsGrad;
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // player - rounded rectangle with gradient
  const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
  playerGrad.addColorStop(0, '#4A90E2');
  playerGrad.addColorStop(1, '#0A84FF');
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  const r = 5; // corner radius
  ctx.moveTo(player.x + r, player.y);
  ctx.lineTo(player.x + player.w - r, player.y);
  ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
  ctx.lineTo(player.x + player.w, player.y + player.h - r);
  ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
  ctx.lineTo(player.x + r, player.y + player.h);
  ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
  ctx.lineTo(player.x, player.y + r);
  ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
  ctx.closePath();
  ctx.fill();

  // score text
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);

  // game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
}
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// input handling
function jump() {
  if (player.onGround && !gameOver) {
    player.vy = JUMP;
    player.onGround = false;
    playTone(440, 0.1); // jump sound
  } else if (gameOver) {
    reset();
    requestAnimationFrame(loop);
  }
}

document.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
document.addEventListener('touchstart', jump);

// start game
requestAnimationFrame(loop);
