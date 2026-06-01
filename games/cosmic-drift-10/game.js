// Simple endless‑scroll space game
// Canvas id: "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustOsc = null;
let thrusting = false;
function startThrustSound(){
  if (thrustOsc) return;
  thrustOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  thrustOsc.connect(gain).connect(audioCtx.destination);
  thrustOsc.start();
}
function stopThrustSound(){
  if (thrustOsc){
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
}
function playExplosion(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.setValueAtTime(80, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Background stars for visual depth
const stars = [];
const starSpeed = 0.3; // slow drift downward
for (let i = 0; i < 150; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
}
function updateStars() {
  for (const s of stars) {
    s.y += starSpeed;
    if (s.y > canvas.height) {
      s.y = -s.r;
      s.x = Math.random() * canvas.width;
    }
  }
}
function drawStars() {
  // Clear with dark space background
  ctx.fillStyle = '#000010';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw tiny stars
  ctx.fillStyle = '#bbbbff';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Ship ----------
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  radius: 10,
  velX: 0,
  velY: 0,
  thrust: 0.1,
  drag: 0.99,
};
function drawShip() {
  // Ship body
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -6);
  ctx.lineTo(-8, 6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // Engine flame when thrusting
  if (keys.ArrowUp) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fillStyle = '#ff8800';
    ctx.fill();
  }
  ctx.restore();
}function updateShip() {
  // apply velocity
  ship.x += ship.velX;
  ship.y += ship.velY;
  // screen wrap
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;
  // drag
  ship.velX *= ship.drag;
  ship.velY *= ship.drag;
}

// ---------- Asteroids ----------
const asteroids = [];
function spawnAsteroid() {
  const size = Math.random() * 20 + 15;
  const side = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  switch (side) {
    case 0: // top
      x = Math.random() * canvas.width; y = -size; vx = (Math.random() - 0.5) * 1; vy = Math.random() * 1 + 0.5; break;
    case 1: // right
      x = canvas.width + size; y = Math.random() * canvas.height; vx = - (Math.random() * 1 + 0.5); vy = (Math.random() - 0.5) * 1; break;
    case 2: // bottom
      x = Math.random() * canvas.width; y = canvas.height + size; vx = (Math.random() - 0.5) * 1; vy = - (Math.random() * 1 + 0.5); break;
    case 3: // left
      x = -size; y = Math.random() * canvas.height; vx = Math.random() * 1 + 0.5; vy = (Math.random() - 0.5) * 1; break;
  }
  asteroids.push({x, y, vx, vy, r: size});
}
function updateAsteroids() {
  for (const a of asteroids) {
    a.x += a.vx; a.y += a.vy;
    // recycle off‑screen
    if (a.x < -a.r) a.x = canvas.width + a.r;
    if (a.x > canvas.width + a.r) a.x = -a.r;
    if (a.y < -a.r) a.y = canvas.height + a.r;
    if (a.y > canvas.height + a.r) a.y = -a.r;
  }
  // spawn new occasionally
  if (Math.random() < 0.02) spawnAsteroid();
}
function drawAsteroids() {
  ctx.fillStyle = 'gray';
  for (const a of asteroids) {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- Input ----------
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);
function handleInput() {
  // Ensure audio context is running after user interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (keys.ArrowLeft) ship.angle -= 0.07;
  if (keys.ArrowRight) ship.angle += 0.07;
  if (keys.ArrowUp) {
    ship.velX += Math.cos(ship.angle) * ship.thrust;
    ship.velY += Math.sin(ship.angle) * ship.thrust;
    if (!thrusting) {
      startThrustSound();
      thrusting = true;
    }
  } else {
    if (thrusting) {
      stopThrustSound();
      thrusting = false;
    }
  }
}
// ---------- Collision ----------
function checkCollision() {
  for (const a of asteroids) {
    const dx = ship.x - a.x;
    const dy = ship.y - a.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.r + ship.radius) {
      // simple lose condition – stop animation
      cancelAnimationFrame(animId);
      playExplosion();
    alert('Game Over');
      return true;
    }
  }
  return false;
}

// ---------- Main Loop ----------
let animId;
function loop() {
  drawStars();
  handleInput();
  updateShip();
  updateAsteroids();
  drawAsteroids();
  drawShip();
  if (!checkCollision()) animId = requestAnimationFrame(loop);
}
// start
spawnAsteroid();
loop();
