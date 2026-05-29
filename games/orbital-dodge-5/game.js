// Orbital Dodge game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = canvas.width = canvas.clientWidth;
let H = canvas.height = canvas.clientHeight;
// generate static stars for background (canvas coordinates)
const starCount = 200;
const stars = Array.from({length: starCount},()=>({
  x: Math.random()*W,
  y: Math.random()*H,
  r: Math.random()*1.5 + 0.5,
  opacity: Math.random()*0.5 + 0.5
}));

// Game state
let angle = 0; // ship angle (radians)
const radius = Math.min(W, H) * 0.35; // orbit radius
let fuel = 100; // fuel percentage
let score = 0;
let gameOver = false;

// Ship
const shipSize = 10;

// Asteroids
let asteroids = [];
const asteroidSpawnInterval = 1500; // ms
let lastSpawn = 0;

function spawnAsteroid() {
  const a = Math.random() * Math.PI * 2;
  const r = radius + 30 + Math.random() * 50;
  const speed = 0.5 + Math.random() * 0.5; // pixels per frame towards center
  asteroids.push({x: Math.cos(a) * r, y: Math.sin(a) * r, dir: a, speed});
  beep(300,0.07); // spawn sound
}

function update(dt) {
  if (gameOver) return;
  // handle input
  if (keys['ArrowLeft'] && fuel > 0) { angle -= 0.003 * dt; fuel -= 0.02 * dt; beep(400,0.05); }
  if (keys['ArrowRight'] && fuel > 0) { angle += 0.003 * dt; fuel -= 0.02 * dt; beep(600,0.05); }
  if (fuel < 0) fuel = 0;

  // spawn asteroids
  if (performance.now() - lastSpawn > asteroidSpawnInterval) { spawnAsteroid(); lastSpawn = performance.now(); }

  // move asteroids inward
  asteroids.forEach(a => {
    const vx = -Math.cos(a.dir) * a.speed;
    const vy = -Math.sin(a.dir) * a.speed;
    a.x += vx; a.y += vy;
  });
  // remove passed asteroids and increase score
  asteroids = asteroids.filter(a => {
    const dist = Math.hypot(a.x, a.y);
    if (dist < 15) { gameOver = true; beep(800,0.3); return false; }
    return dist > 5;
  });

  // collision detection with ship
  const shipX = Math.cos(angle) * radius;
  const shipY = Math.sin(angle) * radius;
  for (let a of asteroids) {
    if (Math.hypot(a.x - shipX, a.y - shipY) < shipSize) { gameOver = true; break; }
  }
  if (!gameOver) score += dt * 0.01;
}

function draw() {
  // dark space background and stars
ctx.save();
// reset transform for background
ctx.setTransform(1,0,0,1,0,0);
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, W, H);
ctx.fillStyle = 'rgba(255,255,255,0.8)';
stars.forEach(s => {
  ctx.globalAlpha = s.opacity;
  ctx.beginPath();
  ctx.arc(s.x - W/2, s.y - H/2, s.r, 0, Math.PI*2);
  ctx.fill();
});
ctx.globalAlpha = 1;
ctx.restore();
  // planet with radial gradient
  const planetGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 30);
  planetGrad.addColorStop(0, '#777');
  planetGrad.addColorStop(1, '#111');
  ctx.fillStyle = planetGrad;
  ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI*2); ctx.fill();
  // orbit with subtle glow
  ctx.save();
  ctx.strokeStyle = '#555';
  ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
  // ship with gradient
  ctx.save();
  ctx.translate(Math.cos(angle)*radius, Math.sin(angle)*radius);
  ctx.rotate(angle + Math.PI/2);
  const shipGrad = ctx.createLinearGradient(0, -shipSize, 0, shipSize);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#060');
  ctx.fillStyle = shipGrad;
  ctx.beginPath(); ctx.moveTo(0, -shipSize);
  ctx.lineTo(shipSize/2, shipSize);
  ctx.lineTo(-shipSize/2, shipSize);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // asteroids
  ctx.fillStyle = '#aaa';
  asteroids.forEach(a => { ctx.beginPath(); ctx.arc(a.x, a.y, 8, 0, Math.PI*2); ctx.fill(); });
  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-W/2, -H/2, W, H);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', 0, 0);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Final Score: ${Math.floor(score)}`, 0, 30);
  }
}

// input handling and sound init
const keys = {};
// Audio context (will be resumed on first user interaction)
let audioCtx = null;
function initAudio(){
  if (!audioCtx){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}
function beep(freq, duration){
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
window.addEventListener('keydown', e => {
  // initialize and resume audio context on first interaction
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// center coordinate system
ctx.translate(W/2, H/2);

let lastTime = performance.now();
function loop(now) {
  const dt = now - lastTime;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
