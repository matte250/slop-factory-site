// Cosmic Defender – enhanced graphics
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Generate starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
  });
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playLaserSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 800;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
function playExplosionSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = 150;
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.4);
}
function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
// Ensure context resumes on first interaction
window.addEventListener('click', resumeAudio, {once:true});
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 600;

// Ship state
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 12,
};
const thrust = 0.1;
const rotateSpeed = 0.07;
const friction = 0.99;

// Shot state
const lasers = [];
const laserSpeed = 5;
const laserLife = 60; // frames

// Asteroid state
const asteroids = [];
const asteroidMinSize = 15;
const asteroidMaxSize = 40;
const spawnInterval = 120; // frames
let spawnTimer = spawnInterval;

function spawnAsteroid() {
  // Spawn at random edge
  const side = Math.floor(Math.random() * 4);
  let x, y, dx, dy;
  const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
  if (side === 0) { // top
    x = Math.random() * canvas.width; y = -size;
    dx = (Math.random() - 0.5) * 1.5; dy = Math.random() * 1.5 + 0.5;
  } else if (side === 1) { // right
    x = canvas.width + size; y = Math.random() * canvas.height;
    dx = -Math.random() * 1.5 - 0.5; dy = (Math.random() - 0.5) * 1.5;
  } else if (side === 2) { // bottom
    x = Math.random() * canvas.width; y = canvas.height + size;
    dx = (Math.random() - 0.5) * 1.5; dy = -Math.random() * 1.5 - 0.5;
  } else { // left
    x = -size; y = Math.random() * canvas.height;
    dx = Math.random() * 1.5 + 0.5; dy = (Math.random() - 0.5) * 1.5;
  }
  asteroids.push({x, y, dx, dy, r: size});
}

function update() {
  // Controls
  if (keys['ArrowLeft'] || keys['a']) ship.angle -= rotateSpeed;
  if (keys['ArrowRight'] || keys['d']) ship.angle += rotateSpeed;
  if (keys['ArrowUp'] || keys['w']) {
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
  }
  if (keys[' ']) {
    // fire laser
    if (laserCooldown <= 0) {
      lasers.push({x: ship.x, y: ship.y, angle: ship.angle, ttl: laserLife});
      laserCooldown = 15;
      playLaserSound();
    }
  }
  // Apply physics
  ship.vx *= friction; ship.vy *= friction;
  ship.x += ship.vx; ship.y += ship.vy;
  // Wrap ship around edges
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  // Update lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.x += Math.cos(l.angle) * laserSpeed;
    l.y += Math.sin(l.angle) * laserSpeed;
    l.ttl--;
    if (l.ttl <= 0) lasers.splice(i, 1);
  }

  // Update asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.dx; a.y += a.dy;
    // Wrap asteroids
    if (a.x < -a.r) a.x = canvas.width + a.r;
    if (a.x > canvas.width + a.r) a.x = -a.r;
    if (a.y < -a.r) a.y = canvas.height + a.r;
    if (a.y > canvas.height + a.r) a.y = -a.r;
    // Collision with ship
    const dx = a.x - ship.x, dy = a.y - ship.y;
    if (Math.hypot(dx, dy) < a.r + ship.radius) {
      // Game over – simple reset
      alert('Game Over');
      resetGame();
      return;
    }
    // Collision with lasers
    for (let j = lasers.length - 1; j >= 0; j--) {
      const l = lasers[j];
      const dlx = a.x - l.x, dly = a.y - l.y;
if (Math.hypot(dlx, dly) < a.r) {
          // destroy asteroid and laser
          playExplosionSound();
          asteroids.splice(i, 1);
          lasers.splice(j, 1);
          break;
        }
    }
  }

  // Spawn new asteroids
  spawnTimer--;
  if (spawnTimer <= 0) { spawnAsteroid(); spawnTimer = spawnInterval; }

  laserCooldown = Math.max(0, laserCooldown - 1);
}

function draw() {
  // Background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Starfield
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship with glow
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // glow
  ctx.shadowColor = 'cyan';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fillStyle = '#00ffff';
  ctx.fill();
  ctx.shadowBlur = 0; // reset
  ctx.restore();

  // Lasers with slight trail
  lasers.forEach(l => {
    const grad = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, 4);
    grad.addColorStop(0, 'rgba(255,0,0,0.9)');
    grad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Asteroids with shading
  ctx.strokeStyle = '#888888';
  ctx.fillStyle = '#555555';
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function resetGame() {
  ship.x = canvas.width / 2; ship.y = canvas.height / 2; ship.vx = ship.vy = 0; ship.angle = 0;
  lasers.length = 0; asteroids.length = 0; spawnTimer = spawnInterval;
}

const keys = {};
let laserCooldown = 0;
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Start
resetGame();
requestAnimationFrame(loop);
