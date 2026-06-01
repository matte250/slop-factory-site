// Meteor Dodge game
// Canvas with id="game" expected in HTML
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Ship definition
const ship = {
  w: 40,
  h: 20,
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  dx: 0,
};

// Controls
const keys = { left: false, right: false, space: false };
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioStarted = false;
function ensureAudio(){ if(!audioStarted){ audioCtx.resume(); audioStarted = true; } }
function playShoot(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 300;
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
function playExplosion(){
  const bufferSize = audioCtx.sampleRate * 0.2;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for(let i=0;i<bufferSize;i++) output[i] = Math.random()*2-1;
  const noise = audioCtx.createBufferSource();
  noise.buffer = noiseBuffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  noise.connect(filter).connect(gain).connect(audioCtx.destination);
  noise.start();
  noise.stop(audioCtx.currentTime + 0.2);
}
function playGameOver(){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 150;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}
addEventListener('keydown', e => {
  ensureAudio();
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === ' ') keys.space = true;
});
addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === ' ') keys.space = false;
});
// Also resume audio on canvas click (for restart)
canvas.addEventListener('click', e => { ensureAudio(); });

// Bullets
const bullets = [];
function shoot() {
  playShoot();
  bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, w: 4, h: 10, speed: 7 });
}

// Meteors
const meteors = [];
let meteorTimer = 0;
function spawnMeteor() {
  const radius = 15 + Math.random() * 10;
  const x = Math.random() * (canvas.width - radius * 2) + radius;
  const speed = 2 + Math.random() * 2;
  meteors.push({ x, y: -radius, r: radius, speed });
}

let gameOver = false;
let lastTime = 0;
let score = 0;

// Starfield for background
const stars = [];
const STAR_COUNT = 100;
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: 0.2 + Math.random() * 0.3,
  });
}


function update(dt) {
  if (gameOver) return;
  // Move ship
  ship.dx = 0;
  if (keys.left) ship.dx = -ship.speed;
  if (keys.right) ship.dx = ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x + ship.dx));

  // Shooting
  if (keys.space && bullets.length < 5) shoot();

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= b.speed;
    if (b.y + b.h < 0) bullets.splice(i, 1);
  }

  // Update starfield
  for (let s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = -s.size;
      s.x = Math.random() * canvas.width;
    }
  }

  // Spawn meteors
  meteorTimer += dt;
  if (meteorTimer > 1000) { // every second
    spawnMeteor();
    meteorTimer = 0;
  }

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed;
    // Collision with ship
    const distX = Math.abs(m.x - (ship.x + ship.w / 2));
    const distY = Math.abs(m.y - (ship.y + ship.h / 2));
    if (distX <= ship.w / 2 + m.r && distY <= ship.h / 2 + m.r) {
      gameOver = true;
      playGameOver();
    }
    // Collision with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      const dx = Math.abs(m.x - bx);
      const dy = Math.abs(m.y - by);
if (dx <= m.r && dy <= m.r) {
          playExplosion();
          meteors.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
    }
    // Remove if off screen
    if (m.y - m.r > canvas.height) meteors.splice(i, 1);
  }
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Starfield
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship (drawn as triangle for better look)
  ctx.fillStyle = '#0a0';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bullets (draw as circles)
  ctx.fillStyle = '#ff0';
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0, Math.PI*2);
    ctx.fill();
  });

  // Meteors with radial gradient
  meteors.forEach(m => {
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    grad.addColorStop(0, '#ff8');
    grad.addColorStop(1, '#a00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Restart on click after game over
canvas.addEventListener('click', () => {
  if (!gameOver) return;
  // reset state
  meteors.length = 0;
  bullets.length = 0;
  ship.x = canvas.width / 2 - ship.w / 2;
  score = 0;
  gameOver = false;
});
