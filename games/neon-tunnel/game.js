// Neon Tunnel Infinite Runner
// Canvas id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Player ship
const player = {
  x: 80,
  y: canvas.height / 2,
  w: 30,
  h: 20,
  speed: 5,
  dy: 0,
  dx: 0,
  update() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
    // keep inside canvas
    this.x = Math.max(0, Math.min(canvas.width - this.w, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.h, this.y));
  },
  draw() {
    // neon glow effect
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.h / 2);
    ctx.lineTo(this.x + this.w, this.y);
    ctx.lineTo(this.x + this.w, this.y + this.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; updateDir(); });
window.addEventListener('keyup', e => { keys[e.key] = false; updateDir(); });
function updateDir() {
  player.dx = 0;
  player.dy = 0;
  if (keys['ArrowUp'] || keys['w']) player.dy = -1;
  if (keys['ArrowDown'] || keys['s']) player.dy = 1;
  if (keys['ArrowLeft'] || keys['a']) player.dx = -1;
  if (keys['ArrowRight'] || keys['d']) player.dx = 1;
}

// Obstacles and orbs
const obstacles = [];
const orbs = [];
let frame = 0;
let score = 0;
let gameOver = false;

function spawnObstacle() {
  const size = Math.random() * 40 + 20;
  obstacles.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    speed: 4
  });
}

function spawnOrb() {
  const r = 8;
  orbs.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - r * 2) + r,
    r,
    speed: 4
  });
}

function updateEntities(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    const e = arr[i];
    e.x -= e.speed;
    if (e.x + (e.w || e.r * 2) < 0) arr.splice(i, 1);
  }
}

function checkCollisions() {
  // player vs obstacles
  for (const o of obstacles) {
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameOver = true;
      playGameOver();
    }
  }
  // player vs orbs
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    const dx = (player.x + player.w / 2) - orb.x;
    const dy = (player.y + player.h / 2) - orb.y;
    const dist = Math.hypot(dx, dy);
    if (dist < orb.r + Math.max(player.w, player.h) / 2) {
      score++;
      orbs.splice(i, 1);
      playCollect();
    }
  }
}

let tunnelOffset = 0;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.stop(audioCtx.currentTime + duration / 1000);
}
function playCollect() { playTone(800, 100); }
function playGameOver() { playTone(200, 400); }

function drawBackground() {
  // gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // moving neon tunnel lines with glow
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = -canvas.width; i < canvas.width * 2; i += 80) {
    const x = (i + tunnelOffset) % canvas.width;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  tunnelOffset = (tunnelOffset + 2) % 80;
}

function drawObstacles() {
  // neon obstacle with outer glow
  for (const o of obstacles) {
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f0f';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.restore();
  }
}

function drawOrbs() {
  // glowing orbs
  for (const orb of orbs) {
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff0';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawScore() {
  ctx.fillStyle = '#0ff';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + score, 20, 30);
}

function loop() {
  if (gameOver) {
    ctx.fillStyle = '#900';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    ctx.font = '24px monospace';
    ctx.fillText('Score: ' + score, canvas.width / 2 - 60, canvas.height / 2 + 40);
    return;
  }
  drawBackground();
  if (frame % 120 === 0) spawnObstacle(); // every 2 secs at 60fps
  if (frame % 90 === 0) spawnOrb();
  frame++;
  updateEntities(obstacles);
  updateEntities(orbs);
  player.update();
  checkCollisions();
  drawObstacles();
  drawOrbs();
  player.draw();
  drawScore();
  requestAnimationFrame(loop);
}

loop();
