// Simple side‑scrolling asteroid miner with improved graphics and sound
// Canvas with id="game" must exist in the page.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Audio setup using Web Audio API
let audioCtx = null;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playTone(freq, duration = 0.1) {
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
function playExplosionSound() { playTone(150, 0.2); }
function playGameOverSound() { playTone(60, 0.5); }

// Background stars for parallax effect
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  });
}

// Particle effect for explosions
const particles = [];
function spawnExplosion(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 30 + Math.random() * 20,
      size: 2 + Math.random() * 2
    });
  }
}

// Game state
const state = {
  ship: { x: 80, y: canvas.height / 2, w: 40, h: 20, fuel: 100, health: 100 },
  asteroids: [],
  fuelDrain: 0.02,
  healthLoss: 20,
  speed: 2,
  lastSpawn: 0,
  spawnInterval: 1500,
  keys: {}
};

// Input handling
window.addEventListener('keydown', e => { state.keys[e.code] = true; initAudio(); });
window.addEventListener('keyup', e => state.keys[e.code] = false);

function spawnAsteroid() {
  const size = 20 + Math.random() * 30;
  state.asteroids.push({
    x: canvas.width + size,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    speed: 1 + Math.random() * 2
  });
}

function update(dt) {
  // Ship controls (arrow up/down)
  if (state.keys['ArrowUp']) state.ship.y -= 3;
  if (state.keys['ArrowDown']) state.ship.y += 3;
  // Keep ship in bounds
  state.ship.y = Math.max(0, Math.min(canvas.height - state.ship.h, state.ship.y));

  // Fuel consumption
  state.ship.fuel = Math.max(0, state.ship.fuel - state.fuelDrain * dt);

  // Update background stars
  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Spawn asteroids
  if (performance.now() - state.lastSpawn > state.spawnInterval) {
    spawnAsteroid();
    state.lastSpawn = performance.now();
  }

  // Move asteroids leftward and handle collisions
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.x -= a.speed;
    // Collision with ship
    if (a.x < state.ship.x + state.ship.w && a.x + a.w > state.ship.x &&
        a.y < state.ship.y + state.ship.h && a.y + a.h > state.ship.y) {
      state.ship.health = Math.max(0, state.ship.health - state.healthLoss);
      spawnExplosion(a.x + a.w / 2, a.y + a.h / 2);
      playExplosionSound();
      state.asteroids.splice(i, 1);
      continue;
    }
    // Remove off‑screen
    if (a.x + a.w < 0) state.asteroids.splice(i, 1);
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background stars
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // Draw ship as a sleek triangle with gradient
  ctx.save();
  const ship = state.ship;
  const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y);
  grad.addColorStop(0, '#0f0');
  grad.addColorStop(1, '#070');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw asteroids with radial gradient for depth
  for (const a of state.asteroids) {
    const radGrad = ctx.createRadialGradient(
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w * 0.2,
      a.x + a.w / 2,
      a.y + a.h / 2,
      a.w / 2
    );
    radGrad.addColorStop(0, '#aaa');
    radGrad.addColorStop(1, '#555');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosion particles
  for (const p of particles) {
    ctx.fillStyle = `rgba(255,165,0,${p.life / 50})`;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${Math.floor(state.ship.fuel)}%`, 10, 20);
  ctx.fillText(`Health: ${Math.floor(state.ship.health)}%`, 10, 40);
}

let last = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  // Lose condition
  if (state.ship.fuel <= 0 || state.ship.health <= 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    playGameOverSound();
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  } else {
    requestAnimationFrame(loop);
  }
}

requestAnimationFrame(loop);
