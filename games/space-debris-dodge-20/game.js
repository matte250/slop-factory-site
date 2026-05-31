// Simple side‑scroller: dodge debris
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Player ship
const ship = { w: 30, h: 20, x: 50, y: canvas.height / 2 - 10, speed: 4 };

// Debris pool
const debris = [];
const maxDebris = 30;

let keys = {};
let score = 0;
let lastTime = performance.now();
let gameOver = false;

// star field for background
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
  }
}
initStars();

// audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain).connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// background hum (low frequency) – start once
const bgOsc = audioCtx.createOscillator();
const bgGain = audioCtx.createGain();
bgOsc.frequency.value = 30;
bgOsc.type = 'sine';
bgOsc.connect(bgGain).connect(audioCtx.destination);
bgGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
bgOsc.start();

function spawnDebris() {
  if (debris.length >= maxDebris) return;
  const h = 20 + Math.random() * 30;
  debris.push({
    w: 20,
    h,
    x: canvas.width,
    y: Math.random() * (canvas.height - h),
    speed: 2 + Math.random() * 4,
  });
}

function update(dt) {
  if (keys['ArrowUp']) ship.y -= ship.speed;
  if (keys['ArrowDown']) ship.y += ship.speed;
  ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

  // move debris
  for (let i = debris.length - 1; i >= 0; i--) {
    const d = debris[i];
    d.x -= d.speed;
    if (d.x + d.w < 0) debris.splice(i, 1);
    // collision
    if (
      ship.x < d.x + d.w &&
      ship.x + ship.w > d.x &&
      ship.y < d.y + d.h &&
      ship.y + ship.h > d.y
    ) {
      playTone(200, 0.2); // collision beep
      gameOver = true;
    }
  }

  // spawn periodically
  if (Math.random() < 0.02) spawnDebris();

  // score by time
  score += dt / 1000;
}

function draw() {
  // background
  ctx.fillStyle = '#000022';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // stars
  ctx.fillStyle = 'white';
  stars.forEach(s => ctx.fillRect(s.x, s.y, 2, 2));

  // ship (triangle)
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h / 2);
  ctx.lineTo(ship.x + ship.w, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // debris with gradient shading
  debris.forEach(d => {
    const grad = ctx.createLinearGradient(d.x, d.y, d.x + d.w, d.y + d.h);
    grad.addColorStop(0, '#aa5500');
    grad.addColorStop(1, '#ff8800');
    ctx.fillStyle = grad;
    ctx.fillRect(d.x, d.y, d.w, d.h);
  });

  // score
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  }
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// input
function resumeAudio(){ if(audioCtx.state==='suspended'){ audioCtx.resume(); } }
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  resumeAudio();
  if(e.key==='ArrowUp' || e.key==='ArrowDown'){
    playTone(500,0.05); // thrust beep
  }
});
window.addEventListener('keyup', e => (keys[e.key] = false));

requestAnimationFrame(loop);
