// Minimal endless runner based on Neon Reflex idea
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
canvas.width = 400;
canvas.height = 600;

const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const laneX = i => laneWidth * i + laneWidth / 2; // center of lane

// Helper to draw a neon rectangle with optional glow
function drawNeonRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.shadowBlur = 15;
  ctx.shadowColor = color;
  ctx.fillRect(x, y, w, h);
  ctx.shadowBlur = 0; // reset
}

// Helper to draw a rounded rectangle (unused for now but nice)
function drawRoundedRect(x, y, w, h, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

let playerLane = 1; // start middle lane
let score = 0;
const playerSize = 30;
const playerY = canvas.height - 80;

let obstacles = [];
let obstacleSize = 30;
// Starfield background
let stars = [];
function spawnStar() {
  stars.push({ x: Math.random() * canvas.width, y: -2, size: 2 + Math.random() * 2 });
}

let spawnTimer = 0;
let speed = 2;
let gameOver = false;

function spawnObstacle() {
  const lane = Math.floor(Math.random() * laneCount);
  obstacles.push({ lane, y: -obstacleSize });
}

function update() {
  if (gameOver) return;
  // draw background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#111');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw starfield
  if (Math.random() < 0.2) spawnStar();
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#fff';
  for (let s = stars.length - 1; s >= 0; s--) {
    const star = stars[s];
    star.y += speed * 0.5;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    if (star.y > canvas.height) stars.splice(s, 1);
  }
  ctx.shadowBlur = 0;

  // draw lane markers
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  for (let i = 1; i < laneCount; i++) {
    ctx.beginPath();
    ctx.moveTo(laneWidth * i, 0);
    ctx.lineTo(laneWidth * i, canvas.height);
    ctx.stroke();
  }

  // draw score
  ctx.fillStyle = '#0ff';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  // increment score based on speed
  score += speed * 0.1;

  // draw player with neon effect
  drawNeonRect(laneX(playerLane) - playerSize / 2, playerY, playerSize, playerSize, '#0ff');

  // update obstacles
  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = Math.max(30, 100 - speed * 5); // faster spawns as speed increases
  }

  // draw obstacles with neon glow
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += speed;
    drawNeonRect(laneX(o.lane) - obstacleSize / 2, o.y, obstacleSize, obstacleSize, '#f00');
    // collision
    if (
      o.lane === playerLane &&
      o.y + obstacleSize > playerY &&
      o.y < playerY + playerSize
    ) {
      playSound(200, 0.3);
      gameOver = true;
    }
    // remove off‑screen
    if (o.y > canvas.height) obstacles.splice(i, 1);
  }

  // increase speed gradually
  speed += 0.001;

  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  } else {
    requestAnimationFrame(update);
  }
}

// input handling
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' && playerLane > 0) {
    playerLane--;
    playSound(600);
  }
  if (e.key === 'ArrowRight' && playerLane < laneCount - 1) {
    playerLane++;
    playSound(800);
  }
});

// start loop
update();
