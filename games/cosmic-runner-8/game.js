// Simple Cosmic Runner game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  osc.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    osc.stop(audioCtx.currentTime + 0.1);
  }, dur);
}
function playCollision() { playTone(100, 150); }
function playMove() { playTone(400, 80); }
// Ensure audio context resumes on first user interaction
function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
document.addEventListener('keydown', resumeAudio, {once:true});
canvas.width = 800;
canvas.height = 600;

// Player ship (drawn as a triangle)
const ship = {
  width: 40,
  height: 20,
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  moveLeft: false,
  moveRight: false,
  draw() {
    ctx.fillStyle = '#0ff'; // cyan ship
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
  },
  update() {
    if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
    if (this.moveRight) this.x = Math.min(canvas.width - this.width, this.x + this.speed);
  }
};

// Asteroid class with gradient fill
class Asteroid {
  constructor() {
    this.radius = Math.random() * 15 + 10;
    this.x = Math.random() * (canvas.width - this.radius * 2) + this.radius;
    this.y = -this.radius;
    this.speed = Math.random() * 2 + 1;
  }
  draw() {
    // radial gradient for a glowing asteroid
    const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.2, this.x, this.y, this.radius);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, '#bbb');
    grad.addColorStop(1, '#777');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  update() {
    this.y += this.speed;
  }
  offScreen() {
    return this.y - this.radius > canvas.height;
  }
}

let asteroids = [];
let spawnTimer = 0;
let gameOver = false;
// Starfield
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({x: Math.random() * canvas.width, y: Math.random() * canvas.height});
}

function spawnAsteroid() {
  asteroids.push(new Asteroid());
}

function rectCircleCollide(rect, cx, cy, r) {
  const distX = Math.abs(cx - rect.x - rect.width / 2);
  const distY = Math.abs(cy - rect.y - rect.height / 2);
  if (distX > (rect.width / 2 + r)) return false;
  if (distY > (rect.height / 2 + r)) return false;
  if (distX <= (rect.width / 2)) return true;
  if (distY <= (rect.height / 2)) return true;
  const dx = distX - rect.width / 2;
  const dy = distY - rect.height / 2;
  return (dx * dx + dy * dy <= (r * r));
}

function update() {
  if (gameOver) return;
  // spawn logic
  spawnTimer--;
  if (spawnTimer <= 0) {
    spawnAsteroid();
    spawnTimer = Math.random() * 60 + 30; // 0.5-1.5 sec at 60fps
  }
  // update entities
  ship.update();
  asteroids.forEach(a => a.update());
  // collision detection
  for (let a of asteroids) {
    if (rectCircleCollide(ship, a.x, a.y, a.radius)) {
      gameOver = true;
      break;
    }
  }
  // remove off‑screen asteroids
  asteroids = asteroids.filter(a => !a.offScreen());
}

function draw() {
  // background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // starfield
  ctx.fillStyle = '#fff';
  stars.forEach(star => {
    ctx.fillRect(star.x, star.y, 2, 2);
    // move stars downward for parallax effect
    star.y += 0.5;
    if (star.y > canvas.height) star.y = 0;
  });
  ship.draw();
  asteroids.forEach(a => a.draw());
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// input handling
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') { ship.moveLeft = true; playMove(); }
  if (e.key === 'ArrowRight') { ship.moveRight = true; playMove(); }
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') ship.moveLeft = false;
  if (e.key === 'ArrowRight') ship.moveRight = false;
});

// start game
loop();
