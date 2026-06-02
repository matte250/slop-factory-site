// Glitch Dodge with enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// High‑DPI support
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
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
// Background hum (low‑frequency drone)
const humOsc = audioCtx.createOscillator();
const humGain = audioCtx.createGain();
humOsc.frequency.value = 30;
humOsc.type = 'sine';
humGain.gain.value = 0.02;
humOsc.connect(humGain).connect(audioCtx.destination);
humOsc.start();
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);
// Create starfield for background
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width / dpr,
    y: Math.random() * canvas.height / dpr,
    radius: Math.random() * 1.5 + 0.5
  });
}
function drawBackground() {
  // gradient sky
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height / dpr);
  grad.addColorStop(0, '#001');
  grad.addColorStop(1, '#003');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  // stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Ship (drawn as a triangle)
// Define logical dimensions after scaling
const logicalWidth = canvas.width / dpr;
const logicalHeight = canvas.height / dpr;

const ship = {
  x: 50,
  y: logicalHeight / 2,
  w: 20,
  h: 20,
  speed: 4,
  draw() {
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.h / 2);
    ctx.lineTo(this.x - this.w, this.y + this.h / 2);
    ctx.lineTo(this.x + this.w, this.y + this.h / 2);
    ctx.closePath();
    ctx.fill();
  }
};

// Glitch blocks
const blocks = [];
const blockFreq = 90; // frames
let frame = 0;
function spawnBlock() {
  const size = Math.random() * 30 + 20;
  const y = Math.random() * (canvas.height - size) + size / 2;
  blocks.push({x: canvas.width + size, y, w: size, h: size, speed: 3});
  // subtle spawn sound
  playTone(600, 0.04);
}

function update() {
  // ship movement
  if (keys['ArrowUp']) ship.y -= ship.speed;
  if (keys['ArrowDown']) ship.y += ship.speed;
  ship.y = Math.max(ship.h / 2, Math.min(canvas.height - ship.h / 2, ship.y));

  // blocks
  if (frame % blockFreq === 0) spawnBlock();
  blocks.forEach(b => b.x -= b.speed);
  // remove offscreen
  while (blocks.length && blocks[0].x + blocks[0].w < 0) blocks.shift();

  // collision
  for (let b of blocks) {
    if (ship.x < b.x + b.w && ship.x + ship.w > b.x &&
        ship.y - ship.h/2 < b.y + b.h/2 && ship.y + ship.h/2 > b.y - b.h/2) {
      gameOver();
      return;
    }
  }

  // score
  score++; // frames as distance
}

let score = 0;
let running = true;
function gameOver() {
  // collision sound
  playTone(150, 0.3);
  running = false;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 20);
  ctx.fillText('Score: ' + Math.floor(score/60), canvas.width/2, canvas.height/2 + 20);
}

function draw() {
  // draw background (gradient sky + stars)
  drawBackground();
  // ship
  ship.draw();
  // glitch blocks with slight blur effect
  ctx.fillStyle = 'rgba(255,0,0,0.8)';
  ctx.shadowColor = 'rgba(255,0,0,0.6)';
  ctx.shadowBlur = 4;
  blocks.forEach(b => ctx.fillRect(b.x, b.y - b.h/2, b.w, b.h));
  ctx.shadowBlur = 0; // reset
  // score display
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score/60), 10, 20);
}

function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling
const keys = {};
let audioStarted = false;
function startAudio() {
  if (!audioStarted && audioCtx.state === 'suspended') {
    audioCtx.resume();
    audioStarted = true;
  }
}
window.addEventListener('keydown', e => { keys[e.key] = true; startAudio(); });
window.addEventListener('keyup', e => keys[e.key] = false);

// Start
requestAnimationFrame(loop);
