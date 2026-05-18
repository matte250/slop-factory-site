// Neon Runner simple canvas game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Audio setup
let audioCtx = null;
function initAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playTone(freq, duration){
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// ambient hum
function startAmbient(){
  initAudio();
  setInterval(()=>playTone(60,0.2), 3000);
}

// Game settings
const laneCount = 3;
const laneWidth = canvas.width / laneCount;
const playerSize = 30;
let playerLane = 1; // 0:left,1:center,2:right
let playerY = canvas.height - playerSize - 10;
let obstacles = [];
let obstacleSpeed = 2;
let spawnTimer = 0;
let score = 0;
let gameOver = false;

function drawRoundedRect(x, y, size, fillColor, glowColor) {
  ctx.fillStyle = fillColor;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 15;
  // Use roundRect if available (Chrome 89+), fallback to rect
  if (ctx.roundRect) {
    ctx.roundRect(x, y, size, size, 6);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + 6, y);
    ctx.arcTo(x + size, y, x + size, y + size, 6);
    ctx.arcTo(x + size, y + size, x, y + size, 6);
    ctx.arcTo(x, y + size, x, y, 6);
    ctx.arcTo(x, y, x + size, y, 6);
    ctx.closePath();
  }
  ctx.fill();
  // reset shadow for other drawings
  ctx.shadowBlur = 0;
}

function drawPlayer() {
  const x = playerLane * laneWidth + laneWidth / 2 - playerSize / 2;
  drawRoundedRect(x, playerY, playerSize, '#0ff', '#0ff');
}

function drawObstacles() {
  obstacles.forEach(o => {
    const x = o.lane * laneWidth + laneWidth / 2 - o.size / 2;
    const hue = (o.lane * 120) % 360; // varied color per lane
    const fill = `hsl(${hue}, 100%, 60%)`;
    const glow = `hsl(${hue}, 100%, 80%)`;
    drawRoundedRect(x, o.y, o.size, fill, glow);
  });
}

function updateObstacles(delta) {
  spawnTimer += delta;
  if (spawnTimer > 1000) { // spawn every second
    spawnTimer = 0;
    const lane = Math.floor(Math.random() * laneCount);
    obstacles.push({ lane, y: -30, size: 30 });
  }
  obstacles.forEach(o => o.y += obstacleSpeed);
  // remove passed obstacles
  obstacles = obstacles.filter(o => o.y < canvas.height);
}

function checkCollision() {
  for (const o of obstacles) {
    const ox = o.lane * laneWidth + laneWidth / 2 - o.size / 2;
    const oy = o.y;
    const px = playerLane * laneWidth + laneWidth / 2 - playerSize / 2;
    const py = playerY;
    if (
      ox < px + playerSize &&
      ox + o.size > px &&
      oy < py + playerSize &&
      oy + o.size > py
    ) {
      return true;
    }
  }
  return false;
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
}

let lastTime = 0;
// start ambient hum
startAmbient();
function drawBackground() {
  // dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#080814');
  grad.addColorStop(1, '#040410');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // neon grid lines for lanes
  ctx.strokeStyle = 'rgba(0,255,255,0.2)';
  ctx.lineWidth = 2;
  for (let i = 1; i < laneCount; i++) {
    const x = i * laneWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (gameOver) {
    // overlay dark translucent screen
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    ctx.fillText('Score: ' + Math.floor(score), canvas.width / 2 - 60, canvas.height / 2 + 30);
    return;
  }
  // draw background first
  drawBackground();
  updateObstacles(delta);
  if (checkCollision()) { gameOver = true; }
  drawPlayer();
  drawObstacles();
  drawScore();
  score += delta * 0.01; // distance based
  obstacleSpeed = 2 + score * 0.001; // gradually increase speed
  requestAnimationFrame(loop);
}

function moveLeft() { if (playerLane > 0) { playerLane--; playTone(400,0.1); } }
function moveRight() { if (playerLane < laneCount-1) { playerLane++; playTone(400,0.1); } }

window.addEventListener('keydown', e => {
  initAudio(); // ensure audio context is resumed on user interaction
  if (e.key === 'ArrowLeft' || e.key === 'a') moveLeft();
  if (e.key === 'ArrowRight' || e.key === 'd') moveRight();
});

requestAnimationFrame(loop);
