// Space Dodger – minimal implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
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
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

const ship = { x: 30, y: canvas.height / 2, w: 40, h: 30, speed: 5 };
let asteroids = [];
let score = 0;
let gameOver = false;
let up = false, down = false;

// background stars for visual effect
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
}

function spawnAsteroid() {
  // play a subtle spawn sound
  playTone(300, 0.05);
  const size = 20 + Math.random() * 30;
  asteroids.push({
    x: canvas.width + size,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    speed: 2 + Math.random() * 3,
  });
}

function update() {
  if (gameOver) return;
  if (up) ship.y -= ship.speed;
  if (down) ship.y += ship.speed;
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x -= a.speed;
    // collision
    if (
      a.x < ship.x + ship.w && a.x + a.w > ship.x &&
      a.y < ship.y + ship.h && a.y + a.h > ship.y
    ) {
      gameOver = true;
    }
    // passed ship → score
    if (a.x + a.w < 0) {
      asteroids.splice(i, 1);
      score++;
    }
  }

  // occasional spawn
  if (Math.random() < 0.02) spawnAsteroid();
}

function draw() {
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => ctx.fillRect(s.x, s.y, 1, 1));

  // ship – draw as triangle pointing right
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h / 2);
  ctx.lineTo(ship.x + ship.w, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // asteroids – draw as circles with a radial gradient
  asteroids.forEach(a => {
    const radGrad = ctx.createRadialGradient(
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w * 0.1,
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 2
    );
    radGrad.addColorStop(0, '#aaa');
    radGrad.addColorStop(1, '#555');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keyboard input
// Ensure audio context is running on first interaction
function ensureAudio(){ if(audioCtx.state === 'suspended') audioCtx.resume(); }
window.addEventListener('keydown', e => { ensureAudio();
  if (e.key === 'ArrowUp') up = true;
  if (e.key === 'ArrowDown') down = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp') up = false;
  if (e.key === 'ArrowDown') down = false;
});

// Pointer (tap / click) input – simple up/down based on click position
canvas.addEventListener('pointerdown', e => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  if (y < ship.y) up = true; else down = true;
});
canvas.addEventListener('pointerup', () => {
  up = down = false;
});
