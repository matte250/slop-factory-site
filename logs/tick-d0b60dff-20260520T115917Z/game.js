// Simple asteroid escape game with enhanced graphics using canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Starfield data
let audioCtx;
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function playTone(freq, type = 'sine', duration = 0.1) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}
let stars = [];

function initStars() {
  const starCount = 200;
  stars.length = 0;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: Math.random() * 1.5 + 0.5 });
  }
}

function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });


function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initStars();
}
window.addEventListener('resize', resize);
resize();

// Ship definition
const ship = { x: canvas.width / 2, y: canvas.height - 60, w: 40, h: 20, speed: 5 };
let left = false, right = false, up = false, down = false;
window.addEventListener('keydown', e => { initAudio(); if (e.key === 'ArrowLeft') left = true; if (e.key === 'ArrowRight') right = true; if (e.key === 'ArrowUp') up = true; if (e.key === 'ArrowDown') down = true; });
window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft') left = false; if (e.key === 'ArrowRight') right = false; if (e.key === 'ArrowUp') up = false; if (e.key === 'ArrowDown') down = false; });

// Asteroid pool
const asteroids = [];
let asteroidTimer = 0;
const asteroidInterval = 80; // frames
let score = 0;
let gameOver = false;

function spawnAsteroid() {
  const radius = Math.random() * 15 + 10;
  const rotation = Math.random() * Math.PI * 2;
  const rotationSpeed = (Math.random() - 0.5) * 0.02;
  const hue = Math.floor(Math.random() * 360);
  asteroids.push({ x: Math.random() * (canvas.width - radius * 2), y: -radius * 2, radius, speed: Math.random() * 2 + 2, hue, rotation, rotationSpeed });
  // sound for spawn
  playTone(200 + radius * 5, 'triangle', 0.05);
}

function update() {
  if (gameOver) return;
  // ship movement
  if (left) ship.x -= ship.speed;
  if (right) ship.x += ship.speed;
  if (up) ship.y -= ship.speed;
  if (down) ship.y += ship.speed;
  // keep within bounds
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

  // asteroids
  asteroidTimer++;
  if (asteroidTimer > asteroidInterval) { spawnAsteroid(); asteroidTimer = 0; }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    a.rotation += a.rotationSpeed;
    // remove off-screen
    if (a.y > canvas.height) { asteroids.splice(i, 1); playTone(150, 'square', 0.05); score++; }
    // collision
if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        playTone(300, 'sawtooth', 0.2);
        gameOver = true;
      }
  }
}

function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001');
  bgGrad.addColorStop(1,'#003');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  drawStars();
  // ship
  ctx.fillStyle = '#0af';
  ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
  // asteroids
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x + a.radius, a.y + a.radius);
    ctx.rotate(a.rotation || 0);
    ctx.fillStyle = `hsl(${a.hue},80%,60%)`;
    ctx.beginPath();
    ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
