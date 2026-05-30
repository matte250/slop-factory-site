// Asteroid Dodge – improved graphics
// Targets canvas with id "game" in the host HTML

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
canvas.width = canvas.clientWidth || 800;
// Create starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  });
}
function drawStars() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
}
canvas.height = canvas.clientHeight || 600;

// Player ship
const ship = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  w: 30,
  h: 30,
  speed: 5,
  draw() {
    // Draw triangular ship
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.h / 2);
    ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
    ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
};

let keys = {};
let audioStarted = false;
function ensureAudio(){ if (!audioStarted) { audioCtx.resume(); audioStarted = true; } }
window.addEventListener('keydown', e => {keys[e.key] = true; ensureAudio();});
window.addEventListener('keyup', e => {keys[e.key] = false;});

// Asteroids
let asteroids = [];
function spawnAsteroid() {
  // Play spawn sound
  beep(300, 80);
  const size = Math.random() * 30 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size) + size / 2,
    y: -size,
    r: size / 2,
    speed: Math.random() * 2 + 1,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  });
}
let spawnTimer = 0;

// Simple timer (seconds)
let timeLeft = 60; // 60‑second game
let lastSecond = Date.now();

function update(dt) {
  // Move ship
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  if (keys['ArrowUp']) ship.y -= ship.speed;
  if (keys['ArrowDown']) ship.y += ship.speed;
  // Clamp inside canvas
  ship.x = Math.max(ship.w / 2, Math.min(canvas.width - ship.w / 2, ship.x));
  ship.y = Math.max(ship.h / 2, Math.min(canvas.height - ship.h / 2, ship.y));

  // Spawn asteroids
  spawnTimer += dt;
  if (spawnTimer > 0.5) { // every 0.5 s
    spawnAsteroid();
    spawnTimer = 0;
  }

  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    a.angle += a.rotSpeed;
    // Remove off‑screen
    if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
    // Collision detection (circle‑rect)
    const dx = Math.abs(a.x - ship.x);
    const dy = Math.abs(a.y - ship.y);
    if (dx > (ship.w / 2 + a.r) || dy > (ship.h / 2 + a.r)) continue;
    if (dx <= ship.w / 2 || dy <= ship.h / 2) {
      endGame();
      return;
    }
    const cornerDistSq = (dx - ship.w / 2) ** 2 + (dy - ship.h / 2) ** 2;
    if (cornerDistSq <= a.r ** 2) { endGame(); return; }
  }

  // Timer countdown
  const now = Date.now();
  if (now - lastSecond >= 1000) {
    timeLeft--;
    lastSecond = now;
    if (timeLeft <= 0) endGame();
  }
}

function draw() {
  // Background starfield
  drawStars();
  // Update star positions for a slight drift effect
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });

  ship.draw();
  asteroids.forEach(a => a.draw());
  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Time: ' + timeLeft, 10, 30);
}

let lastTime = 0;
let gameOver = false;
function loop(timestamp) {
  if (gameOver) return;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
function endGame() {
  // Play crash sound
  beep(120, 300);
  gameOver = true;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f00';
  ctx.font = '40px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
}
requestAnimationFrame(loop);
