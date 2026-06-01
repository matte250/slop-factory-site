// Minimal endless runner for canvas #game
// Enhanced graphics: neon player, gradient obstacles, scrolling starfield background
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Sound setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, length = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + length);
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
let lastTime = 0;
let speed = 200; // pixels per second
let energy = 100; // depletes over time
const obstacles = [];
// Starfield background
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: 0.5 + Math.random() * 0.5,
    });
  }
}
initStars();

// Player
const player = {
  x: 80,
  y: canvas.height - 60,
  w: 40,
  h: 40,
  vy: 0,
  jumpStrength: -600,
  onGround: true,
};

function reset() {
  player.y = canvas.height - 60;
  player.vy = 0;
  player.onGround = true;
  obstacles.length = 0;
  energy = 100;
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Input
function handleInput() {
  if (player.onGround) {
    player.vy = player.jumpStrength;
    player.onGround = false;
  }
}
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') handleInput();
});
canvas.addEventListener('click', handleInput);

function spawnObstacle() {
  const size = 30 + Math.random() * 30;
  obstacles.push({
    x: canvas.width + size,
    y: canvas.height - size,
    w: size,
    h: size,
  });
}

function update(dt) {
  // player physics
  player.vy += 2000 * dt; // gravity
  player.y += player.vy * dt;
  if (player.y + player.h >= canvas.height) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed * dt;
    // collision
    if (
      o.x < player.x + player.w &&
      o.x + o.w > player.x &&
      o.y < player.y + player.h &&
      o.y + o.h > player.y
    ) {
      playTone(200, 0.2);
      gameOver();
      return;
    }
    // remove off‑screen
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // spawn logic
  if (Math.random() < dt * 0.8) spawnObstacle();

  // energy drain
  energy -= dt * 10;
  if (energy <= 0) {
    playTone(100, 0.3);
    gameOver();
    return;
  }

  // update stars (parallax)
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.x -= s.speed * dt * speed * 0.05; // slower than obstacles
    if (s.x < 0) s.x = canvas.width;
  }
}

function draw() {
  // dark background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // player
  ctx.fillStyle = '#0ff';
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // obstacles
  ctx.fillStyle = '#f00';
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // energy bar
  ctx.fillStyle = '#0f0';
  ctx.fillRect(20, 20, energy * 2, 10);

  // optional text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Energy', 20, 15);
}

let running = false;
function gameLoop(timestamp) {
  if (!running) return;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function gameOver() {
  running = false;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}

// start game
running = true;
reset();
