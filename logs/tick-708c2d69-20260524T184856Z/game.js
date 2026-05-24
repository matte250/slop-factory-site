// Enhanced Asteroid Dodge game targeting <canvas id="game"></canvas>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Make canvas fill its container and adapt on resize
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ----- Audio setup -----
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustOsc = null;
function startThrustSound() {
  if (thrustOsc) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = 80; // low rumble
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  thrustOsc = osc;
}
function stopThrustSound() {
  if (thrustOsc) {
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
}
function playExplosionSound() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}

// ----- Starfield background -----
const stars = [];
const STAR_COUNT = 100;
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.5 + 0.5,
  });
}
function drawStars() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Ship state
let ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  radius: 12,
  vx: 0,
  vy: 0,
};

const keys = { left: false, right: false, up: false };

// Asteroid state
let asteroids = [];
let asteroidTimer = 0;
let score = 0;
let startTime = performance.now();
let dodged = 0;

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnAsteroid() {
  // Choose edge (0:top,1:right,2:bottom,3:left)
  const edge = Math.floor(rand(0, 4));
  let x, y, vx, vy;
  const speed = rand(0.5, 2);
  switch (edge) {
    case 0: // top
      x = rand(0, canvas.width); y = -30; vx = rand(-1, 1) * speed; vy = speed; break;
    case 1: // right
      x = canvas.width + 30; y = rand(0, canvas.height); vx = -speed; vy = rand(-1, 1) * speed; break;
    case 2: // bottom
      x = rand(0, canvas.width); y = canvas.height + 30; vx = rand(-1, 1) * speed; vy = -speed; break;
    case 3: // left
      x = -30; y = rand(0, canvas.height); vx = speed; vy = rand(-1, 1) * speed; break;
  }
  const radius = rand(12, 28);
  // Create a simple irregular shape by storing vertex offsets
  const vertices = [];
  const sides = Math.floor(rand(5, 9));
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const offset = rand(radius * 0.6, radius);
    vertices.push({ angle, offset });
  }
  asteroids.push({ x, y, vx, vy, radius, vertices });
}

function update(dt) {
  // Ship rotation
  if (keys.left) ship.angle -= 3 * dt;
  if (keys.right) ship.angle += 3 * dt;
  // Thrust
  if (keys.up) {
    const thrust = 150 * dt; // stronger thrust for better feel
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
  }
  // Apply velocity & friction
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  ship.vx *= 0.99;
  ship.vy *= 0.99;
  // Wrap ship
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  // Asteroids logic
  asteroidTimer -= dt;
  if (asteroidTimer <= 0) {
    spawnAsteroid();
    asteroidTimer = rand(0.6, 1.8);
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    // Remove off‑screen
    if (a.x < -50 || a.x > canvas.width + 50 || a.y < -50 || a.y > canvas.height + 50) {
      asteroids.splice(i, 1);
      dodged++;
    }
  }

  // Collision detection
  for (const a of asteroids) {
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.radius + ship.radius) {
      playExplosionSound();
      alert(`Game over! Time: ${((performance.now() - startTime) / 1000).toFixed(1)}s, Dodged: ${dodged}`);
      window.location.reload();
      return;
    }
  }

  // Score based on time survived
  score = ((performance.now() - startTime) / 1000).toFixed(1);
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -9);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.fillStyle = '#0ff'; // cyan hull
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Thrust flame
  if (keys.up) {
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-20 - Math.random() * 10, 0);
    ctx.lineTo(-12, 6);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();
}

function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.beginPath();
  const { vertices, radius } = a;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const x = Math.cos(v.angle) * v.offset;
    const y = Math.sin(v.angle) * v.offset;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#888';
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function draw() {
  drawStars();
  drawShip();
  for (const a of asteroids) drawAsteroid(a);
  // UI overlay
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText(`Time: ${score}s`, 12, 22);
  ctx.fillText(`Dodged: ${dodged}`, 12, 42);
}

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keyboard handling
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') keys.left = true;
  else if (e.code === 'ArrowRight') keys.right = true;
  else if (e.code === 'ArrowUp') {
    keys.up = true;
    startThrustSound();
  }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') keys.left = false;
  else if (e.code === 'ArrowRight') keys.right = false;
  else if (e.code === 'ArrowUp') {
    keys.up = false;
    stopThrustSound();
  }
});
}
function drawStars() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Ship state
let ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  radius: 12,
  vx: 0,
  vy: 0,
};

const keys = { left: false, right: false, up: false };

// Asteroid state
let asteroids = [];
let asteroidTimer = 0;
let score = 0;
let startTime = performance.now();
let dodged = 0;

function rand(min, max) { return Math.random() * (max - min) + min; }

function spawnAsteroid() {
  // Choose edge (0:top,1:right,2:bottom,3:left)
  const edge = Math.floor(rand(0, 4));
  let x, y, vx, vy;
  const speed = rand(0.5, 2);
  switch (edge) {
    case 0: // top
      x = rand(0, canvas.width); y = -30; vx = rand(-1, 1) * speed; vy = speed; break;
    case 1: // right
      x = canvas.width + 30; y = rand(0, canvas.height); vx = -speed; vy = rand(-1, 1) * speed; break;
    case 2: // bottom
      x = rand(0, canvas.width); y = canvas.height + 30; vx = rand(-1, 1) * speed; vy = -speed; break;
    case 3: // left
      x = -30; y = rand(0, canvas.height); vx = speed; vy = rand(-1, 1) * speed; break;
  }
  const radius = rand(12, 28);
  // Create a simple irregular shape by storing vertex offsets
  const vertices = [];
  const sides = Math.floor(rand(5, 9));
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const offset = rand(radius * 0.6, radius);
    vertices.push({ angle, offset });
  }
  asteroids.push({ x, y, vx, vy, radius, vertices });
}

function update(dt) {
  // Ship rotation
  if (keys.left) ship.angle -= 3 * dt;
  if (keys.right) ship.angle += 3 * dt;
  // Thrust
  if (keys.up) {
    const thrust = 150 * dt; // stronger thrust for better feel
    ship.vx += Math.cos(ship.angle) * thrust;
    ship.vy += Math.sin(ship.angle) * thrust;
  }
  // Apply velocity & friction
  ship.x += ship.vx * dt;
  ship.y += ship.vy * dt;
  ship.vx *= 0.99;
  ship.vy *= 0.99;
  // Wrap ship
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  // Asteroids logic
  asteroidTimer -= dt;
  if (asteroidTimer <= 0) {
    spawnAsteroid();
    asteroidTimer = rand(0.6, 1.8);
  }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    // Remove off‑screen
    if (a.x < -50 || a.x > canvas.width + 50 || a.y < -50 || a.y > canvas.height + 50) {
      asteroids.splice(i, 1);
      dodged++;
    }
  }

  // Collision detection
  for (const a of asteroids) {
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.radius + ship.radius) {
      alert(`Game over! Time: ${((performance.now() - startTime) / 1000).toFixed(1)}s, Dodged: ${dodged}`);
      window.location.reload();
      return;
    }
  }

  // Score based on time survived
  score = ((performance.now() - startTime) / 1000).toFixed(1);
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-12, -9);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.fillStyle = '#0ff'; // cyan hull
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Thrust flame
  if (keys.up) {
    ctx.beginPath();
    ctx.moveTo(-12, -6);
    ctx.lineTo(-20 - Math.random() * 10, 0);
    ctx.lineTo(-12, 6);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();
}

function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.beginPath();
  const { vertices, radius } = a;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const x = Math.cos(v.angle) * v.offset;
    const y = Math.sin(v.angle) * v.offset;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#888';
  ctx.fill();
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function draw() {
  drawStars();
  drawShip();
  for (const a of asteroids) drawAsteroid(a);
  // UI overlay
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText(`Time: ${score}s`, 12, 22);
  ctx.fillText(`Dodged: ${dodged}`, 12, 42);
}

let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Keyboard handling
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') keys.left = true;
  else if (e.code === 'ArrowRight') keys.right = true;
  else if (e.code === 'ArrowUp') keys.up = true;
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') keys.left = false;
  else if (e.code === 'ArrowRight') keys.right = false;
  else if (e.code === 'ArrowUp') keys.up = false;
});
