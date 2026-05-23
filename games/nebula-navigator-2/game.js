// Nebula Navigator: simple canvas game
const canvas = document.getElementById('game');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq=440, duration=0.2) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function startEngineSound(){
  // simple low rumble while moving
  if (engineOsc) return;
  engineOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  engineOsc.frequency.value = 80;
  engineOsc.type = 'square';
  engineOsc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.02;
  engineOsc.start();
}
function stopEngineSound(){
  if (!engineOsc) return;
  engineOsc.stop();
  engineOsc.disconnect();
  engineOsc = null;
}
let engineOsc = null;
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;
// Initialize starfield
const stars = [];
function initStars(count) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      brightness: Math.random()
    });
  }
}
initStars(150);

// Ship definition
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 20,
  speed: 3,
  dx: 0,
  dy: 0,
  draw() {
    // Ship with gradient fill and white outline
    const grad = ctx.createLinearGradient(0, this.y - this.size, 0, this.y + this.size);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size);
    ctx.lineTo(this.x - this.size, this.y + this.size);
    ctx.lineTo(this.x + this.size, this.y + this.size);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

// Asteroid pool
const asteroids = [];
function spawnAsteroid() {
  const size = Math.random() * 30 + 10;
  asteroids.push({
    x: canvas.width + size,
    y: Math.random() * canvas.height,
    size,
    speed: Math.random() * 2 + 1,
    draw() {
      // Asteroid with radial gradient for depth
      const grad = ctx.createRadialGradient(this.x, this.y, this.size * 0.2, this.x, this.y, this.size);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#3e2723');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      // subtle glow
      ctx.shadowColor = 'rgba(255,255,255,0.2)';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  });
}
let asteroidTimer = 0;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function updateShip() {
  ship.dx = ship.dy = 0;
  if (keys['ArrowLeft']) ship.dx = -ship.speed;
  if (keys['ArrowRight']) ship.dx = ship.speed;
  if (keys['ArrowUp']) ship.dy = -ship.speed;
  if (keys['ArrowDown']) ship.dy = ship.speed;
  // engine sound based on movement
  if (ship.dx !== 0 || ship.dy !== 0) {
    startEngineSound();
  } else {
    stopEngineSound();
  }
  ship.x = Math.max(ship.size, Math.min(canvas.width - ship.size, ship.x + ship.dx));
  ship.y = Math.max(ship.size, Math.min(canvas.height - ship.size, ship.y + ship.dy));
}

function updateAsteroids(delta) {
  asteroidTimer += delta;
  if (asteroidTimer > 1000) {
    spawnAsteroid();
    asteroidTimer = 0;
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x -= a.speed;
    if (a.x + a.size < 0) asteroids.splice(i, 1);
  }
}

function checkCollision() {
  for (const a of asteroids) {
    const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
    if (dist < ship.size + a.size) {
      // Game over - reset with sound
      playBeep(200, 0.5); // low tone for crash
      alert('Game Over');
      ship.x = canvas.width / 2;
      ship.y = canvas.height / 2;
      asteroids.length = 0;
      stopEngineSound();
      break;
    }
  }
}

let lastTime = 0;
function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  // Draw background gradient and starfield
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // simple twinkling stars
  stars.forEach(s => {
    ctx.fillStyle = s.brightness > 0.5 ? '#fff' : '#aaa';
    ctx.fillRect(s.x, s.y, 2, 2);
  });

  updateShip();
  updateAsteroids(delta);
  checkCollision();
  ship.draw();
  for (const a of asteroids) a.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
