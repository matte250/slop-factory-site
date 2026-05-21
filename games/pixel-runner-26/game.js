// Simple endless runner for canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Support high‑DPI displays
const dpr = window.devicePixelRatio || 1;
canvas.width = (canvas.clientWidth || 800) * dpr;
canvas.height = (canvas.clientHeight || 200) * dpr;
ctx.scale(dpr, dpr);

// player setup
const player = { x: 50, y: canvas.height - 30, w: 20, h: 30, vy: 0, onGround: true };
const GRAVITY = 0.5;
const JUMP_VELOCITY = -10;

// obstacle pool
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 1500; // ms
let speed = 3; // scrolling speed (pixels per frame)
let lastTime = 0;
let gameOver = false;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
function jump() {
  if (player.onGround) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    playTone(440, 100); // jump beep
  }
}

// Simple background ambience
const bgInterval = setInterval(() => {
  if (!gameOver) playTone(180, 80);
}, 4000);
window.addEventListener('click', jump);
window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });

function spawnObstacle() {
  const height = 30 + Math.random() * 40; // 30‑70px tall
  const width = 20 + Math.random() * 30;  // 20‑50px wide
  obstacles.push({ x: canvas.width, y: canvas.height - height, w: width, h: height });
}

function update(delta) {
  // player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y + player.h >= canvas.height) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // obstacles movement
  obstacles.forEach(ob => ob.x -= speed);
  // remove off‑screen obstacles
  obstacles = obstacles.filter(ob => ob.x + ob.w > 0);

  // spawn logic
  obstacleTimer += delta;
  if (obstacleTimer > obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
    // gradually increase difficulty
    speed += 0.01;
    obstacleInterval = Math.max(500, obstacleInterval - 1);
  }

  // collision detection (AABB)
  for (const ob of obstacles) {
    if (
      player.x < ob.x + ob.w &&
      player.x + player.w > ob.x &&
      player.y < ob.y + ob.h &&
      player.y + player.h > ob.y
    ) {
      gameOver = true;
      break;
    }
  }
}

function draw() {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#87ceeb');
  skyGrad.addColorStop(1, '#fff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ground line
  const groundY = canvas.height - 20;
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, groundY, canvas.width, 20);

  // draw player as a rounded rectangle (pixel‑style)
  ctx.fillStyle = '#0f0';
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.w - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
  ctx.lineTo(player.x + player.w, player.y + player.h - radius);
  ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
  ctx.lineTo(player.x + radius, player.y + player.h);
  ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();

  // draw obstacles with rounded corners
  ctx.fillStyle = '#f00';
  obstacles.forEach(ob => {
    const r = 3;
    ctx.beginPath();
    ctx.moveTo(ob.x + r, ob.y);
    ctx.lineTo(ob.x + ob.w - r, ob.y);
    ctx.quadraticCurveTo(ob.x + ob.w, ob.y, ob.x + ob.w, ob.y + r);
    ctx.lineTo(ob.x + ob.w, ob.y + ob.h - r);
    ctx.quadraticCurveTo(ob.x + ob.w, ob.y + ob.h, ob.x + ob.w - r, ob.y + ob.h);
    ctx.lineTo(ob.x + r, ob.y + ob.h);
    ctx.quadraticCurveTo(ob.x, ob.y + ob.h, ob.x, ob.y + ob.h - r);
    ctx.lineTo(ob.x, ob.y + r);
    ctx.quadraticCurveTo(ob.x, ob.y, ob.x + r, ob.y);
    ctx.closePath();
    ctx.fill();
  });

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  if (!gameOver) update(delta);
  draw();

  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
