// Simple Astro Dodge game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Star field background
const stars = Array.from({ length: 120 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.2 + 0.3,
  alpha: Math.random()
}));
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0015');
  grad.addColorStop(1, '#000010');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    s.alpha += (Math.random() - 0.5) * 0.07;
    if (s.alpha < 0.2) s.alpha = 0.2;
    if (s.alpha > 1) s.alpha = 1;
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

// Player ship (triangle)
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 15,
  speed: 3,
  dx: 0,
  dy: 0,
  draw() {
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x - this.size, this.y + this.size);
    ctx.lineTo(this.x + this.size, this.y + this.size);
    ctx.closePath();
    ctx.fill();
  },
  update() {
    this.x += this.dx;
    this.y += this.dy;
    // keep inside canvas
    this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));
  }
};

// Meteor class
class Meteor {
  constructor() {
    const edge = Math.random() < 0.5 ? 'x' : 'y';
    if (edge === 'x') {
      this.x = Math.random() < 0.5 ? -20 : canvas.width + 20;
      this.y = Math.random() * canvas.height;
    } else {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() < 0.5 ? -20 : canvas.height + 20;
    }
    const angle = Math.atan2(canvas.height/2 - this.y, canvas.width/2 - this.x);
    const speed = 1 + Math.random() * 2;
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    this.r = 10 + Math.random() * 10;
  }
  draw() {
    ctx.fillStyle = 'gray';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
  }
}

let meteors = [];
let gameOver = false;
let spawnTimer = 0;

function spawnMeteor() {
  playSpawnSound();
  meteors.push(new Meteor());
}

function checkCollision(m) {
  const dx = m.x - ship.x;
  const dy = m.y - ship.y;
  const dist = Math.hypot(dx, dy);
  return dist < m.r + ship.size;
}

function update() {
  if (gameOver) return;
    // Fade previous frame for motion trail effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw star field background
    drawBackground();

  // Update ship
  ship.update();
  ship.draw();

  // Spawn meteors
  if (spawnTimer++ > 60) { // roughly one per second at 60fps
    spawnMeteor();
    spawnTimer = 0;
  }

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.update();
    m.draw();
    if (checkCollision(m)) {
      playExplosionSound();
      gameOver = true;
    }
    // remove off‑screen meteors
    if (m.x < -50 || m.x > canvas.width + 50 || m.y < -50 || m.y > canvas.height + 50) {
      meteors.splice(i, 1);
    }
  }

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    return;
  }
  requestAnimationFrame(update);
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioInitialized = false;
function initAudio() {
  if (audioInitialized) return;
  audioInitialized = true;
  // background hum
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 60; // low pitch
  gain.gain.value = 0.02;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
}
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playSpawnSound() {
  playTone(400, 0.05);
}
function playExplosionSound() {
  playTone(100, 0.3);
}
// Controls – arrow keys
window.addEventListener('keydown', e => {
  initAudio();
  if (e.key === 'ArrowLeft') ship.dx = -ship.speed;
  if (e.key === 'ArrowRight') ship.dx = ship.speed;
  if (e.key === 'ArrowUp') ship.dy = -ship.speed;
  if (e.key === 'ArrowDown') ship.dy = ship.speed;
});
window.addEventListener('keyup', e => {
  if (['ArrowLeft','ArrowRight'].includes(e.key)) ship.dx = 0;
  if (['ArrowUp','ArrowDown'].includes(e.key)) ship.dy = 0;
});

// Optional mouse control – click to move ship
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  ship.x = e.clientX - rect.left;
  ship.y = e.clientY - rect.top;
});

update();
