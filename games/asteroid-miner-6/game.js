// Asteroid Miner – enhanced graphics & sound
// Targets canvas with id="game"

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// --- Audio setup ---------------------------------------------------
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration = 0.1, type = 'sine', volume = 0.2) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
// simple ambient hum (low ping every few seconds)
setInterval(() => playTone(80, 0.2, 'sine', 0.05), 6000);

// --- Game state ----------------------------------------------------
let score = 0;
let fuel = 100; // percent
let lastTime = 0;

// --- Player (drone) ------------------------------------------------
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 12,
  speed: 150, // pixels per second
  vx: 0,
  vy: 0,
};

// --- Input handling ------------------------------------------------
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function updatePlayer(dt) {
  player.vx = 0; player.vy = 0;
  if (keys['ArrowUp'] || keys['w']) player.vy = -1;
  if (keys['ArrowDown'] || keys['s']) player.vy = 1;
  if (keys['ArrowLeft'] || keys['a']) player.vx = -1;
  if (keys['ArrowRight'] || keys['d']) player.vx = 1;
  const len = Math.hypot(player.vx, player.vy);
  if (len > 0) {
    player.vx *= player.speed * dt / len;
    player.vy *= player.speed * dt / len;
    player.x += player.vx;
    player.y += player.vy;
    // keep inside bounds
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
  }
}

// --- Starfield background ------------------------------------------
const stars = [];
(function generateStars() {
  const count = 100;
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }
})();

function drawStars() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Asteroid class ------------------------------------------------
class Asteroid {
  constructor() {
    this.r = 15 + Math.random() * 20;
    // spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { // left
      this.x = -this.r;
      this.y = Math.random() * canvas.height;
    } else if (edge === 1) { // right
      this.x = canvas.width + this.r;
      this.y = Math.random() * canvas.height;
    } else if (edge === 2) { // top
      this.x = Math.random() * canvas.width;
      this.y = -this.r;
    } else { // bottom
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + this.r;
    }
    const angle = Math.atan2(canvas.height/2 - this.y, canvas.width/2 - this.x);
    const speed = 50 + Math.random() * 70;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    // gradient for visual depth
    this.gradient = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
    this.gradient.addColorStop(0, '#bbb');
    this.gradient.addColorStop(1, '#555');
  }
  update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- Ore (collectible) -------------------------------------------
class Ore {
  constructor() {
    this.r = 6;
    this.x = Math.random() * (canvas.width - 2 * this.r) + this.r;
    this.y = Math.random() * (canvas.height - 2 * this.r) + this.r;
    this.gradient = ctx.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
    this.gradient.addColorStop(0, '#ff0');
    this.gradient.addColorStop(1, '#b90');
  }
  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = this.gradient;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let asteroids = [];
let ores = [];

function spawnAsteroid() { asteroids.push(new Asteroid()); }
function spawnOre() { ores.push(new Ore()); }

let asteroidTimer = 0;
let oreTimer = 0;

function checkCollisions() {
  // player vs asteroids
  for (const a of asteroids) {
    const dx = a.x - player.x;
    const dy = a.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.r + player.r) {
      // collision sound
      playTone(150, 0.3, 'triangle', 0.3);
      return true;
    }
  }
  // player vs ores
  for (let i = ores.length - 1; i >= 0; i--) {
    const o = ores[i];
    const dx = o.x - player.x;
    const dy = o.y - player.y;
    if (Math.hypot(dx, dy) < o.r + player.r) {
      score += 10;
      ores.splice(i, 1);
      // collect sound
      playTone(800, 0.08, 'sawtooth', 0.2);
    }
  }
  return false;
}

// --- HUD ----------------------------------------------------------
function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
}

// --- Game Over ---------------------------------------------------
function gameOver() {
  // crash sound already played in collision; add a final tone
  playTone(100, 0.5, 'sine', 0.4);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f00';
  ctx.font = '48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
}

// --- Main loop ----------------------------------------------------
function loop(timestamp) {
  const dt = (timestamp - lastTime) / 1000; // seconds
  lastTime = timestamp;

  // draw background first
  drawStars();

  // Update fuel
  fuel -= dt * 2; // deplete slowly

  // spawn logic
  asteroidTimer += dt;
  oreTimer += dt;
  if (asteroidTimer > 1.2) { spawnAsteroid(); asteroidTimer = 0; }
  if (oreTimer > 3) { spawnOre(); oreTimer = 0; }

  // update entities
  asteroids.forEach(a => a.update(dt));
  updatePlayer(dt);

  // draw ores then asteroids then player
  ores.forEach(o => o.draw());
  asteroids.forEach(a => a.draw());

  // player with glowing gradient
  ctx.save();
  const grad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
  grad.addColorStop(0, '#0f0');
  grad.addColorStop(1, '#060');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawHUD();

  // collision / end check
  if (fuel <= 0 || checkCollisions()) {
    gameOver();
    return;
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
