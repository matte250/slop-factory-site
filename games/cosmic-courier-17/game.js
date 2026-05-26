// Minimal Cosmic Courier game
// Assumes an HTML canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Game state
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
let lastThrust = 0;
function playThrust() {
  const now = performance.now();
  if (now - lastThrust < 100) return; // limit rate
  lastThrust = now;
  playTone(200, 80);
}
function playCollision() {
  playTone(100, 300);
}
// Initialize starfield
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    speed: 0.2 + Math.random() * 0.3
  });
}
let ship = { x: canvas.width/2, y: canvas.height-50, w: 20, h: 30, speed: 3, color: '#0f0' };
// Store recent ship positions for a motion trail
const shipTrail = [];
let fuel = 100; // percent
let score = 0;
let asteroids = [];
let keys = {};
let lastAsteroid = 0;

function spawnAsteroid() {
  const size = 20 + Math.random()*30;
  const x = Math.random() * (canvas.width - size);
  const y = -size;
  const speed = 1 + Math.random()*2;
  asteroids.push({x, y, size, speed});
}

function update(dt) {
  // move stars
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
  // controls with thrust sound
  let moved = false;
  if (keys.ArrowLeft || keys.KeyA) { ship.x -= ship.speed; moved = true; }
  if (keys.ArrowRight || keys.KeyD) { ship.x += ship.speed; moved = true; }
  if (keys.ArrowUp || keys.KeyW) { ship.y -= ship.speed; moved = true; }
  if (keys.ArrowDown || keys.KeyS) { ship.y += ship.speed; moved = true; }
  if (moved) playThrust();
  // keep inside canvas
  ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));
  // store trail point
  shipTrail.push({x: ship.x, y: ship.y, age: 0});
  if (shipTrail.length > 15) shipTrail.shift();

  // fuel consumption
  fuel -= dt * 0.01; // drain per ms
  if (fuel <= 0) fuel = 0;

  // asteroids movement
  asteroids.forEach(a => a.y += a.speed);
  // remove off‑screen
  asteroids = asteroids.filter(a => a.y < canvas.height + a.size);

  // spawn new asteroids every 1.5s
  if (performance.now() - lastAsteroid > 1500) { spawnAsteroid(); lastAsteroid = performance.now(); }

  // collision detection
  for (let a of asteroids) {
    if (ship.x < a.x + a.size && ship.x + ship.w > a.x &&
        ship.y < a.y + a.size && ship.y + ship.h > a.y) {
      // lose condition with sound
      playCollision();
      alert('Game Over! Score: ' + Math.floor(score));
      document.location.reload();
      return;
    }
  }
  // simple scoring: survive time
  score += dt * 0.001;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // starfield background with gradient and moving stars
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw moving stars
  stars.forEach(star => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(star.x, star.y, 2, 2);
  });

  // render ship motion trail
  shipTrail.forEach((p, i) => {
    const alpha = (i + 1) / shipTrail.length;
    ctx.fillStyle = `rgba(0,255,0,${alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(p.x + ship.w/2, p.y + ship.h/2, ship.w/2, 0, Math.PI * 2);
    ctx.fill();
  });

  // ship (triangle) with customizable color
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w/2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // asteroids with radial gradient shading
  for (let a of asteroids) {
    const grad = ctx.createRadialGradient(
      a.x + a.size/2,
      a.y + a.size/2,
      a.size * 0.1,
      a.x + a.size/2,
      a.y + a.size/2,
      a.size/2
    );
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI*2);
    ctx.fill();
  }

  // fuel bar
  ctx.fillStyle = '#ff0';
  ctx.fillRect(10,10, fuel*1.5, 10);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(10,10, 150,10);

  // score display
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), canvas.width-120, 20);
}

let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = now - lastTime;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

loop();