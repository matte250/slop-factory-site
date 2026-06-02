// Simple Cosmic Courier game
// Canvas with id="game" is expected in the HTML.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// Ensure audio context runs after user interaction
window.addEventListener('click', () => {
  if (audioCtx.state !== 'running') audioCtx.resume();
});
window.addEventListener('keydown', () => {
  if (audioCtx.state !== 'running') audioCtx.resume();
});
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur / 1000);
  osc.start(now);
  osc.stop(now + dur / 1000);
}

// Game state
let ship, asteroids, orbs, shield, lastTime, gameOver;
// Starfield for background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  });
}

// Utility functions
const rand = (min, max) => Math.random() * (max - min) + min;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Entities
class Ship {
  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 60;
    this.r = 15; // radius
    this.vx = 0;
    this.vy = -2;
    this.angle = 0;
    this.speed = 2.5;
  }
  update(keys) {
    if (keys['ArrowLeft']) this.x -= this.speed;
    if (keys['ArrowRight']) this.x += this.speed;
    if (keys['ArrowUp']) this.y -= this.speed;
    if (keys['ArrowDown']) this.y += this.speed;
    // keep within bounds
    this.x = Math.max(this.r, Math.min(canvas.width - this.r, this.x));
    this.y = Math.max(this.r, Math.min(canvas.height - this.r, this.y));
  }
  draw() {
    // ship with shiny gradient
    const grad = ctx.createLinearGradient(-this.r, -this.r, this.r, this.r);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#00a');
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -this.r);
    ctx.lineTo(this.r, this.r);
    ctx.lineTo(-this.r, this.r);
    ctx.closePath();
    ctx.fill();
    // thin stroke outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }
}

class Asteroid {
  constructor() {
    this.r = rand(15, 30);
    this.x = rand(this.r, canvas.width - this.r);
    this.y = -this.r;
    this.speed = rand(1, 3);
    this.angle = rand(0, Math.PI * 2);
    this.rotationSpeed = rand(-0.02, 0.02);
    // create a radial gradient for a rock‑like look
    this.gradient = ctx.createRadialGradient(0, 0, this.r * 0.3, 0, 0, this.r);
    this.gradient.addColorStop(0, '#555');
    this.gradient.addColorStop(1, '#222');
  }
  update(dt) {
    this.y += this.speed * dt;
    this.angle += this.rotationSpeed * dt;
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Orb {
  constructor() {
    this.r = 8;
    this.x = rand(this.r, canvas.width - this.r);
    this.y = -this.r;
    this.speed = 1.5;
  }
  update(dt) {
    this.y += this.speed * dt;
  }
  draw() {
    // glowing orb using radial gradient
    const grad = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(0.7, '#ff8');
    grad.addColorStop(1, '#440');
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => (keys[e.key] = true));
window.addEventListener('keyup', e => (keys[e.key] = false));

function reset() {
  ship = new Ship();
  asteroids = [];
  orbs = [];
  shield = 100; // percent
  lastTime = performance.now();
  gameOver = false;
  requestAnimationFrame(loop);
}

function spawnAsteroid() {
  asteroids.push(new Asteroid());
}
function spawnOrb() {
  orbs.push(new Orb());
}

function update(dt) {
  ship.update(keys);
  // move and cull asteroids
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.update(dt);
    if (a.y - a.r > canvas.height) asteroids.splice(i, 1);
else if (distance(a, ship) < a.r + ship.r) {
        shield -= 20;
        // play collision sound
        playTone(220, 150);
        asteroids.splice(i, 1);
      }
  }
  // move and cull orbs
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.update(dt);
    if (o.y - o.r > canvas.height) orbs.splice(i, 1);
else if (distance(o, ship) < o.r + ship.r) {
        shield = Math.min(100, shield + 15);
        // play orb collection sound
        playTone(440, 100);
        orbs.splice(i, 1);
      }
  }
  // spawn logic
  if (Math.random() < 0.02) spawnAsteroid();
  if (Math.random() < 0.008) spawnOrb();
  // shield decay
  shield -= dt * 0.5; // gradually lose energy
  if (shield <= 0) gameOver = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // deep space background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // draw twinkling stars
  ctx.fillStyle = '#fff';
  stars.forEach(st => {
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
    ctx.fill();
    // slight drift downwards; reset when off‑screen
    st.y += st.speed;
    if (st.y > canvas.height) {
      st.y = -st.radius;
      st.x = Math.random() * canvas.width;
    }
  });
  // draw entities
  ship.draw();
  asteroids.forEach(a => a.draw());
  orbs.forEach(o => o.draw());
  // UI – shield bar
  ctx.fillStyle = '#0f0';
  const barWidth = 200;
  ctx.fillRect(10, 10, (shield / 100) * barWidth, 12);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(10, 10, barWidth, 12);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 16; // normalize to ~60fps units
  lastTime = timestamp;
  if (!gameOver) update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

reset();
