// Simple Sky Runner game
const canvas = document.getElementById('game');
if (!canvas) { console.error('Canvas #game not found'); }
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

// Game settings
const PLANE_SPEED = 2; // vertical speed per frame
const SCROLL_SPEED = 3; // obstacle/fuel scroll speed
const CLOUD_SPEED = 1; // slower scroll for clouds
const FUEL_DECAY = 0.02; // per frame
const FUEL_GAIN = 20; // per canister

// Player plane
const plane = {
  x: 80,
  y: canvas.height / 2,
  w: 40,
  h: 20,
  color: 'red',
  fuel: 100,
};

// Input handling
const keys = {};
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
// Resume audio context on first user interaction
window.addEventListener('keydown', e => { if (audioCtx.state === 'suspended') audioCtx.resume(); keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Obstacles, fuel canisters, and clouds
const obstacles = [];
const fuels = [];
const clouds = [];
let frame = 0;
let gameOver = false;

function spawnObstacle() {
  const size = 30 + Math.random() * 40;
  obstacles.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    color: 'gray',
  });
}
function spawnFuel() {
  const size = 20;
  fuels.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - size),
    w: size,
    h: size,
    color: 'green',
  });
}

function spawnCloud() {
  const width = 60 + Math.random() * 40;
  const height = 30 + Math.random() * 20;
  clouds.push({
    x: canvas.width,
    y: Math.random() * (canvas.height - height),
    w: width,
    h: height,
    color: 'rgba(255,255,255,0.6)',
  });
}

function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  if (gameOver) return;
  // Move plane based on input (arrow keys or WASD)
  if (keys['ArrowUp'] || keys['w']) plane.y -= PLANE_SPEED;
  if (keys['ArrowDown'] || keys['s']) plane.y += PLANE_SPEED;
  if (keys['ArrowLeft'] || keys['a']) plane.x -= PLANE_SPEED;
  if (keys['ArrowRight'] || keys['d']) plane.x += PLANE_SPEED;
  // Keep plane inside canvas
  plane.x = Math.max(0, Math.min(canvas.width - plane.w, plane.x));
  plane.y = Math.max(0, Math.min(canvas.height - plane.h, plane.y));

  // Scroll obstacles/fuel and clouds
  obstacles.forEach(o => o.x -= SCROLL_SPEED);
  fuels.forEach(f => f.x -= SCROLL_SPEED);
  clouds.forEach(c => c.x -= CLOUD_SPEED);
  // Remove off‑screen items
  while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
  while (fuels.length && fuels[0].x + fuels[0].w < 0) fuels.shift();
  while (clouds.length && clouds[0].x + clouds[0].w < 0) clouds.shift();

  // Collision detection
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (rectsCollide(plane, obstacles[i])) { playTone(150, 0.3); gameOver = true; }
  }
  for (let i = fuels.length - 1; i >= 0; i--) {
if (rectsCollide(plane, fuels[i])) {
        playTone(440, 0.2);
        plane.fuel = Math.min(100, plane.fuel + FUEL_GAIN);
        fuels.splice(i, 1);
      }
  }

  // Fuel consumption
  plane.fuel -= FUEL_DECAY;
  if (plane.fuel <= 0) gameOver = true;

  // Spawn new obstacles, fuel, and clouds periodically
  if (frame % 90 === 0) spawnObstacle();
  if (frame % 300 === 0) spawnFuel();
  if (frame % 150 === 0) spawnCloud();

  frame++;
}

function draw() {
  // Sky background
  ctx.fillStyle = '#87CEEB'; // light sky blue
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw clouds (behind everything)
  clouds.forEach(c => { ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y, c.w, c.h); });

  // Draw obstacles (as simple squares)
  obstacles.forEach(o => { ctx.fillStyle = o.color; ctx.fillRect(o.x, o.y, o.w, o.h); });

  // Draw fuels as circles
  fuels.forEach(f => {
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw plane as a simple triangle
  ctx.fillStyle = plane.color;
  ctx.beginPath();
  ctx.moveTo(plane.x, plane.y + plane.h / 2);
  ctx.lineTo(plane.x + plane.w, plane.y);
  ctx.lineTo(plane.x + plane.w, plane.y + plane.h);
  ctx.closePath();
  ctx.fill();

  // Fuel bar
  ctx.fillStyle = 'black';
  ctx.fillRect(10, 10, 100, 10);
  ctx.fillStyle = 'lime';
  ctx.fillRect(10, 10, plane.fuel, 10);
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
  else {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

requestAnimationFrame(loop);
