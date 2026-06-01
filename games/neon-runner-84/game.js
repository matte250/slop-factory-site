// Neon Runner game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let player = { x: 50, y: canvas.height / 2, w: 20, h: 20, vy: 0 };
const gravity = 0.4;
const thrust = -8;
let obstacles = [];
let frame = 0;
let speed = 2;
let score = 0;
let gameOver = false;
// starfield for background
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    alpha: Math.random() * 0.5 + 0.5,
  });
}
// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playThrustSound() { playTone(300, 0.08); }
function playCrashSound() { playTone(100, 0.3); }
let crashPlayed = false;

function spawnObstacle() {
  const gap = 100; // vertical gap for ship to pass
  const minH = 20;
  const maxTop = canvas.height - gap - minH;
  const topH = Math.random() * maxTop + minH;
  const bottomY = topH + gap;
  obstacles.push({ x: canvas.width, top: topH, bottom: bottomY, w: 30 });
}

function update() {
  if (gameOver) return;

  frame++;
  // player physics
  player.vy += gravity;
  player.y += player.vy;

  // move obstacles
  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // move stars for parallax effect
  stars.forEach(star => {
    star.x -= speed * 0.3;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
  });

  // spawn obstacles periodically
  if (frame % Math.floor(150 / speed) === 0) spawnObstacle();

  // gradually increase speed
  if (frame % 300 === 0) speed += 0.2;

  // collision detection
  obstacles.forEach(o => {
    const hitX = player.x < o.x + o.w && player.x + player.w > o.x;
    const hitY = player.y < o.top || player.y + player.h > o.bottom;
    if (hitX && hitY) {
      gameOver = true;
      if (!crashPlayed) { playCrashSound(); crashPlayed = true; }
    }
  });

  // fall off screen
  if (player.y < 0 || player.y + player.h > canvas.height) {
    gameOver = true;
    if (!crashPlayed) { playCrashSound(); crashPlayed = true; }
  }

  // score based on frames survived
  score = Math.floor(frame / 10);
}

function draw() {
  // clear with gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // draw starfield background
  ctx.fillStyle = '#fff';
  stars.forEach(star => {
    ctx.globalAlpha = star.alpha;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // draw player (neon ship) with glow triangle
  ctx.fillStyle = '#0ff';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.h / 2);
  ctx.lineTo(player.x + player.w, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // draw obstacles as neon spikes
  ctx.fillStyle = '#f0f';
  ctx.shadowColor = '#f0f';
  ctx.shadowBlur = 8;
  obstacles.forEach(o => {
    // top spike (triangle)
    ctx.beginPath();
    ctx.moveTo(o.x, o.top);
    ctx.lineTo(o.x + o.w / 2, 0);
    ctx.lineTo(o.x + o.w, o.top);
    ctx.closePath();
    ctx.fill();
    // bottom spike (inverted triangle)
    ctx.beginPath();
    ctx.moveTo(o.x, o.bottom);
    ctx.lineTo(o.x + o.w / 2, canvas.height);
    ctx.lineTo(o.x + o.w, o.bottom);
    ctx.closePath();
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// thrust on click / tap
canvas.addEventListener('mousedown', () => {
  player.vy = thrust;
  playThrustSound();
});
canvas.addEventListener('touchstart', () => {
  player.vy = thrust;
  playThrustSound();
});

loop();
