// game.js – implements Orbit Dodge
// Assumes an HTML canvas with id="game" exists.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

const center = { x: canvas.width / 2, y: canvas.height / 2 };

// Ship state
// Added starfield for background
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5
  });
}
let ship = {
  radius: 120, // orbital radius
  angle: 0, // radians
  angularSpeed: 0.02, // rad per frame
  fuel: 100,
  size: 12 // for drawing
};

const meteors = [];
let lastMeteorTime = 0;
let gameOver = false;

// Input handling
// Set up basic sound effects using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
function playThrust() { playTone(400, 100); }
function playExplosion() { playTone(100, 400); }
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; if (e.key === 'ArrowUp') playThrust(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnMeteor() {
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 1 + Math.random() * 1.5;
  const size = 8 + Math.random() * 12;
  switch (edge) {
    case 0: // top
      x = Math.random() * canvas.width; y = -size; vx = (center.x - x) * speed / Math.hypot(center.x - x, center.y - y); vy = (center.y - y) * speed / Math.hypot(center.x - x, center.y - y); break;
    case 1: // right
      x = canvas.width + size; y = Math.random() * canvas.height; vx = (center.x - x) * speed / Math.hypot(center.x - x, center.y - y); vy = (center.y - y) * speed / Math.hypot(center.x - x, center.y - y); break;
    case 2: // bottom
      x = Math.random() * canvas.width; y = canvas.height + size; vx = (center.x - x) * speed / Math.hypot(center.x - x, center.y - y); vy = (center.y - y) * speed / Math.hypot(center.x - x, center.y - y); break;
    case 3: // left
      x = -size; y = Math.random() * canvas.height; vx = (center.x - x) * speed / Math.hypot(center.x - x, center.y - y); vy = (center.y - y) * speed / Math.hypot(center.x - x, center.y - y); break;
  }
  meteors.push({ x, y, vx, vy, size });
}

function update(dt) {
  if (gameOver) return;

  // Controls
  if (keys['ArrowUp']) { ship.radius = Math.min(ship.radius + 1, Math.min(canvas.width, canvas.height) / 2 - 20); ship.fuel = Math.max(0, ship.fuel - 0.05); }
  if (keys['ArrowDown']) { ship.radius = Math.max(ship.radius - 1, 30); }
  if (keys['ArrowLeft']) { ship.angularSpeed -= 0.001; }
  if (keys['ArrowRight']) { ship.angularSpeed += 0.001; }

  // Update ship angle
  ship.angle += ship.angularSpeed;

  // Spawn meteors periodically
  const now = performance.now();
  if (now - lastMeteorTime > 800) { // every 0.8s
    spawnMeteor();
    lastMeteorTime = now;
  }

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.x += m.vx;
    m.y += m.vy;
    // Remove if off-screen
    if (m.x < -30 || m.x > canvas.width + 30 || m.y < -30 || m.y > canvas.height + 30) {
      meteors.splice(i, 1);
    }
  }

  // Collision detection
  const shipX = center.x + ship.radius * Math.cos(ship.angle);
  const shipY = center.y + ship.radius * Math.sin(ship.angle);
  for (const m of meteors) {
    const dx = shipX - m.x;
    const dy = shipY - m.y;
    const dist = Math.hypot(dx, dy);
    if (dist < ship.size + m.size) { gameOver = true; playExplosion(); break; }
  }
  if (ship.fuel <= 0) gameOver = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background stars
  ctx.fillStyle = '#111';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fff';
  for (const s of stars) {
    ctx.globalAlpha = 0.5 + Math.random()*0.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  // Draw planet with radial gradient
  const planetGrad = ctx.createRadialGradient(center.x, center.y, 20, center.x, center.y, 40);
  planetGrad.addColorStop(0, '#777');
  planetGrad.addColorStop(1, '#333');
  ctx.fillStyle = planetGrad;
  ctx.beginPath();
  ctx.arc(center.x, center.y, 40, 0, Math.PI * 2);
  ctx.fill();

  // Draw ship with glow
  const shipX = center.x + ship.radius * Math.cos(ship.angle);
  const shipY = center.y + ship.radius * Math.sin(ship.angle);
  const dir = Math.atan2(shipY - center.y, shipX - center.x);
  // Glow effect
  ctx.shadowColor = 'rgba(0,255,0,0.7)';
  ctx.shadowBlur = 12;
  // Ship gradient
  const shipGrad = ctx.createLinearGradient(
    shipX, shipY,
    shipX + Math.cos(dir) * ship.size,
    shipY + Math.sin(dir) * ship.size
  );
  shipGrad.addColorStop(0, '#aaffaa');
  shipGrad.addColorStop(1, '#00ff00');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(
    shipX + Math.cos(dir) * ship.size,
    shipY + Math.sin(dir) * ship.size
  );
  ctx.lineTo(
    shipX + Math.cos(dir + Math.PI * 0.75) * ship.size * 0.6,
    shipY + Math.sin(dir + Math.PI * 0.75) * ship.size * 0.6
  );
  ctx.lineTo(
    shipX + Math.cos(dir - Math.PI * 0.75) * ship.size * 0.6,
    shipY + Math.sin(dir - Math.PI * 0.75) * ship.size * 0.6
  );
  ctx.closePath();
  ctx.fill();
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Draw meteors with gradient and glow
  ctx.shadowColor = 'rgba(255,69,0,0.6)';
  ctx.shadowBlur = 8;
  for (const m of meteors) {
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size);
    grad.addColorStop(0, '#ff8c00');
    grad.addColorStop(1, '#8b0000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();
  }
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let last = performance.now();
function loop(now) {
  const dt = now - last;
  last = now;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
