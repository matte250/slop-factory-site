// Meteor Dodge game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 600;

// Ship (triangle shape)
const ship = {
  w: 40, // base width
  h: 30, // height of triangle
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  color: '#0ff'
};

// Meteors and background stars
const meteors = [];
// generate simple star field
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1
  });
}
const meteorConfig = {
  minSize: 20,
  maxSize: 50,
  minSpeed: 2,
  maxSpeed: 6,
  spawnInterval: 1000 // ms
};
let lastSpawn = 0;
let score = 0;
let gameOver = false;

function spawnMeteor() {
  // play spawn sound
  playSound(300, 0.05);
  const size = Math.random() * (meteorConfig.maxSize - meteorConfig.minSize) + meteorConfig.minSize;
  const x = Math.random() * (canvas.width - size);
  const speed = Math.random() * (meteorConfig.maxSpeed - meteorConfig.minSpeed) + meteorConfig.minSpeed;
  meteors.push({ x, y: -size, size, speed, color: '#f44' });
}

function update(dt) {
  // ship movement (keyboard)
  if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
  if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

  // meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed;
    // collision with ship
    if (
      m.x < ship.x + ship.w &&
      m.x + m.size > ship.x &&
      m.y < ship.y + ship.h &&
      m.y + m.size > ship.y
    ) {
      gameOver = true;
      playSound(800, 0.3); // crash sound
    }
    // offscreen (escaped meteor)
    if (m.y > canvas.height) {
      meteors.splice(i, 1);
      score++;
      playSound(500, 0.1); // score increment sound
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
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
  // ship (triangle)
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  // meteors with gradient
  meteors.forEach(m => {
    const grad = ctx.createRadialGradient(
      m.x + m.size / 2,
      m.y + m.size / 2,
      m.size * 0.1,
      m.x + m.size / 2,
      m.y + m.size / 2,
      m.size / 2
    );
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.5, m.color);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // score
  ctx.fillStyle = '#0f0';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = performance.now();
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) {
    if (timestamp - lastSpawn > meteorConfig.spawnInterval) {
      spawnMeteor();
      lastSpawn = timestamp;
    }
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}

// input handling
const keys = {};
window.addEventListener('keydown', e => (keys[e.key] = true));
window.addEventListener('keyup', e => (keys[e.key] = false));
// resume audio context on first user interaction
window.addEventListener('click', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
});

// start
requestAnimationFrame(loop);
