// Neon Runner Game
// Canvas setup
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Support high‑DPI displays
const dpr = window.devicePixelRatio || 1;
canvas.width = (canvas.clientWidth || 800) * dpr;
canvas.height = (canvas.clientHeight || 400) * dpr;
ctx.scale(dpr, dpr);
// logical size used for drawing calculations
const logicalWidth = canvas.width / dpr;
const logicalHeight = canvas.height / dpr;

// Game settings
let speed = 2;
let frame = 0;
let gridOffset = 0; // for moving grid effect
let score = 0; // distance traveled
const playerSize = 30;
const laneCount = 3;
const laneWidth = logicalWidth / laneCount;
let playerX = laneWidth * 1 + (laneWidth - playerSize) / 2;
let playerY = logicalHeight - playerSize - 10;
let obstacles = [];
let gameOver = false;

// Audio setup (create once)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioInitialized = false;
function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}

// Input handling
document.addEventListener('keydown', (e) => {
  if (gameOver) return;
  // Unlock AudioContext on first user interaction
  if (!audioInitialized) {
    audioCtx.resume();
    audioInitialized = true;
  }
  if (e.key === 'ArrowLeft') {
    if (playerX > laneWidth * 0) playerX -= laneWidth;
    playBeep(300, 80);
  } else if (e.key === 'ArrowRight') {
    if (playerX < laneWidth * (laneCount - 1)) playerX += laneWidth;
    playBeep(300, 80);
  }
});

function spawnObstacle() {
  const lane = Math.floor(Math.random() * laneCount);
  const x = lane * laneWidth + (laneWidth - playerSize) / 2;
  const y = -playerSize;
  obstacles.push({ x, y, w: playerSize, h: playerSize });
}

function update() {
  if (gameOver) return;
  frame++;
  // increase speed over time
  if (frame % 600 === 0) speed += 0.5;
  // spawn obstacles periodically
  if (frame % 100 === 0) spawnObstacle();

  // move obstacles
  obstacles.forEach(o => o.y += speed);
  // increase score based on distance traveled
  score += speed;
  // remove off-screen using logical height
  obstacles = obstacles.filter(o => o.y < logicalHeight);

  // collision detection
  for (const o of obstacles) {
    if (
      playerX < o.x + o.w &&
      playerX + playerSize > o.x &&
      playerY < o.y + o.h &&
      playerY + playerSize > o.y
    ) {
      // play collision sound
      playBeep(150, 200);
      gameOver = true;
      break;
    }
  }
}

function draw() {
  // background gradient (dark to deep blue)
  const grad = ctx.createLinearGradient(0, 0, 0, logicalHeight);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#004');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // moving neon grid overlay
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1;
  const gridSize = 40;
  gridOffset = (gridOffset + speed) % gridSize; // scroll with speed
  for (let i = -gridSize; i < logicalWidth + gridSize; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i + gridOffset, 0);
    ctx.lineTo(i + gridOffset, logicalHeight);
    ctx.stroke();
  }
  for (let j = -gridSize; j < logicalHeight + gridSize; j += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, j + gridOffset);
    ctx.lineTo(logicalWidth, j + gridOffset);
    ctx.stroke();
  }

  // helper to draw neon rectangle
  function drawNeonRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(x, y, w, h);
    // reset shadow for other drawing
    ctx.shadowBlur = 0;
  }

  // draw player with neon glow
  drawNeonRect(playerX, playerY, playerSize, playerSize, '#0ff');

  // draw obstacles with neon red glow
  obstacles.forEach(o => drawNeonRect(o.x, o.y, o.w, o.h, '#f00'));

  // draw score
  ctx.fillStyle = '#0ff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);

  // game over text with glow
  if (gameOver) {
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 20;
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', logicalWidth / 2, logicalHeight / 2);
    ctx.shadowBlur = 0;
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// start game
requestAnimationFrame(loop);
