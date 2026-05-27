// Meteor Dodge game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Set canvas size to fill window
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Create star field for background
const stars = [];
function initStars(count = 100) {
  stars.length = 0;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
}
initStars();

// Update stars on resize
window.addEventListener('resize', () => initStars());

// Player ship
const ship = {
  width: 40,
  height: 20,
  x: 0,
  y: 0,
  speed: 6,
  moveLeft: false,
  moveRight: false,
};
function resetShip() {
  ship.x = (canvas.width - ship.width) / 2;
  ship.y = canvas.height - ship.height - 10;
}
resetShip();

// Meteors
const meteors = [];
let spawnTimer = 0;
const spawnInterval = 1000; // ms
let lastTime = 0;
let score = 0;
let gameOver = false;

// Audio context and helper
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type='sine', duration=0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function spawnMeteor() {
  const size = Math.random() * 30 + 20;
  meteors.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2 + Math.random() * 2,
  });
  // sound for new meteor
  playSound(150, 'sine', 0.05);
}

function update(dt) {
  if (gameOver) return;
  // player movement
  if (ship.moveLeft) ship.x -= ship.speed;
  if (ship.moveRight) ship.x += ship.speed;
  // keep within bounds
  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

  // meteors
  spawnTimer += dt;
  if (spawnTimer > spawnInterval) {
    spawnMeteor();
    spawnTimer = 0;
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed;
    // remove off-screen
    if (m.y > canvas.height) { meteors.splice(i, 1); score++; playSound(300, 'sine', 0.05); }
    // collision
    if (
      m.x < ship.x + ship.width &&
      m.x + m.size > ship.x &&
      m.y < ship.y + ship.height &&
      m.y + m.size > ship.y
    ) {
      gameOver = true;
      // collision sound
      playSound(100, 'sawtooth', 0.2);
    }
  }
}

function draw() {
  // background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  // ship (triangle)
  const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.height);
  shipGradient.addColorStop(0, '#4caf50');
  shipGradient.addColorStop(1, '#2e7d32');
  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.height);
  ctx.lineTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();
  // meteors with radial gradient
  meteors.forEach(m => {
    const grad = ctx.createRadialGradient(
      m.x + m.size / 2,
      m.y + m.size / 2,
      m.size * 0.1,
      m.x + m.size / 2,
      m.y + m.size / 2,
      m.size / 2
    );
    grad.addColorStop(0, '#ff8a80');
    grad.addColorStop(1, '#d32f2f');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 30);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Input handling
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') ship.moveLeft = true;
  if (e.key === 'ArrowRight') ship.moveRight = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') ship.moveLeft = false;
  if (e.key === 'ArrowRight') ship.moveRight = false;
});
