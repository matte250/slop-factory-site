// Meteor Dodger – simple endless arcade game
// Canvas with id="game" must exist in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

// Ship configuration
const ship = {
  w: 40,
  h: 20,
  x: WIDTH / 2 - 20,
  y: HEIGHT - 30,
  speed: 5,
};

// Meteor pool and background stars
const meteors = [];
const spawnInterval = 60; // frames
// Generate starfield
const STAR_COUNT = 100;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    r: Math.random() * 2 + 0.5,
  });
}
let frameCount = 0;
let gameOver = false;

// Input handling – arrow keys and mouse move
let moveLeft = false,
    moveRight = false;

document.addEventListener('keydown', e => {
  // Ensure audio context is running after user interaction
  if (audioCtx.state !== 'running') audioCtx.resume();
  // Play movement sound on key press
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    playTone(600, 0.04);
  }
  if (e.key === 'ArrowLeft') moveLeft = true;
  if (e.key === 'ArrowRight') moveRight = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') moveLeft = false;
  if (e.key === 'ArrowRight') moveRight = false;
});
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  ship.x = e.clientX - rect.left - ship.w / 2;
  // Clamp to canvas bounds
  ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));
});

function spawnMeteor() {
  const radius = 10 + Math.random() * 15;
  const x = Math.random() * (WIDTH - radius * 2) + radius;
  const speed = 2 + Math.random() * 3;
  meteors.push({ x, y: -radius, r: radius, s: speed });
  // Play a short rise tone for each meteor spawn
  playTone(300 + Math.random() * 200, 0.05);
}

function update() {
  if (gameOver) return;

  // Move ship (keyboard)
  if (moveLeft) ship.x -= ship.speed;
  if (moveRight) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(WIDTH - ship.w, ship.x));

  // Spawn meteors
  if (frameCount % spawnInterval === 0) spawnMeteor();
  frameCount++;

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.s;
    // Remove off‑screen meteors
    if (m.y - m.r > HEIGHT) meteors.splice(i, 1);
    // Collision with ship
    if (
      m.y + m.r > ship.y &&
      m.x + m.r > ship.x &&
      m.x - m.r < ship.x + ship.w
    ) {
      gameOver = true;
    }
    // Meteor reaches bottom and blocks ship (optional lose condition)
    if (m.y + m.r >= HEIGHT && m.x > ship.x && m.x < ship.x + ship.w) {
      gameOver = true;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  // Draw background gradient (deep space)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Draw stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ship as triangle with gradient
  const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
  shipGradient.addColorStop(0, '#0f0');
  shipGradient.addColorStop(1, '#050');
  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Draw meteors with radial gradient and glow
  meteors.forEach(m => {
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    grad.addColorStop(0, '#ff8');
    grad.addColorStop(1, '#c44');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#f88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
  }
}

function loop() {
  if (!gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

loop();
