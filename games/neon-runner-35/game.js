// Simple endless runner based on IDEA.md
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800; // fixed size, adjust as needed
canvas.height = 200;

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure context is resumed on first interaction
window.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
function playSound(freq, duration) {
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
function playJumpSound() { playSound(440, 0.1); }
function playSlideSound() { playSound(200, 0.08); }
function playHitSound() { playSound(100, 0.3); }

// Game parameters
let speed = 3; // base scroll speed
let gravity = 0.5;
let jumpSpeed = 12;
let obstacleFreq = 1500; // ms between obstacles
let lastObstacle = 0;
let score = 0;
let running = true;

// Player object
const player = {
  w: 20,
  h: 20,
  x: 50,
  y: canvas.height - 20, // ground position
  vy: 0,
  onGround: true,
  sliding: false,
  slideTimer: 0,
};

const obstacles = [];

function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnObstacle() {
  const size = Math.random() * 30 + 20; // 20-50px
  obstacles.push({ x: canvas.width, y: canvas.height - size, w: size, h: size });
}

function update(dt) {
  // player physics
  if (!player.onGround) player.vy += gravity;
  player.y += player.vy;
  if (player.y >= canvas.height - player.h) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // slide handling (down arrow)
  if (player.sliding) {
    player.slideTimer -= dt;
    if (player.slideTimer <= 0) {
      player.sliding = false;
      player.h = 20;
    }
  }

  // obstacles movement & collision
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    if (rectCollide(player, o)) { playHitSound(); running = false; }
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // spawn new obstacles
  if (performance.now() - lastObstacle > obstacleFreq) {
    spawnObstacle();
    lastObstacle = performance.now();
  }

  // increase difficulty over time
  speed += 0.001;
  score += dt * 0.01;
}

function draw() {
  // neon background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#003');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // motion blur effect
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground line (glow)
  ctx.fillStyle = '#0ff';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#0ff';
  ctx.fillRect(0, canvas.height - 2, canvas.width, 2);
  ctx.shadowBlur = 0;

  // player with neon glow
  ctx.fillStyle = '#0ff';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#0ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;

  // obstacles with varied neon colors
  obstacles.forEach(o => {
    const hue = Math.floor(Math.random() * 360);
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  });

  // score overlay
  ctx.fillStyle = '#fff';
  ctx.shadowBlur = 4;
  ctx.shadowColor = '#000';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  ctx.shadowBlur = 0;
}

let lastTime = 0;
function loop(timestamp) {
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    return;
  }
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Input handling
window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    if (player.onGround) {
      player.vy = -jumpSpeed;
      player.onGround = false;
      playJumpSound();
    }
  }
  if (e.code === 'ArrowDown') {
    if (!player.sliding && player.onGround) {
      player.sliding = true;
      player.h = 10; // reduce height
      player.slideTimer = 300; // ms
      playSlideSound();
    }
  }
});
window.addEventListener('mousedown', () => {
  // treat click as jump
  if (player.onGround) {
    player.vy = -jumpSpeed;
    player.onGround = false;
  }
});
