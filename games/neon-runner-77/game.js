// Simple endless runner using canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
function playBeep(freq, duration) {
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
// Ensure audio context resumes after first user interaction
window.addEventListener('click', () => {
  if (audioCtx.state !== 'running') audioCtx.resume();
}, { once: true });
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;
let gridOffset = 0;
// Particle trail for player
const particles = [];


// Player (glowing dot)
const player = { x: canvas.width / 2, y: canvas.height - 50, r: 8, speed: 4 };
let left = false, right = false;

// Barriers
const barriers = [];
const barrierW = 60, barrierH = 15;
const spawnInterval = 1200; // ms
let lastSpawn = 0;
let score = 0;
let running = true;

function spawnBarrier() {
  const x = Math.random() * (canvas.width - barrierW);
  barriers.push({ x, y: -barrierH, w: barrierW, h: barrierH });
}

function update(dt) {
  // Add particle at player position each frame
  particles.push({x: player.x, y: player.y, size: player.r, alpha: 1});
  if (!running) return;
  // Move player
  if (left) player.x -= player.speed;
  if (right) player.x += player.speed;
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));

  // Spawn barriers
  if (Date.now() - lastSpawn > spawnInterval) {
    spawnBarrier();
    lastSpawn = Date.now();
  }

  // Move barriers
  for (let i = barriers.length - 1; i >= 0; i--) {
    const b = barriers[i];
    b.y += 3; // speed of forward motion
    // Collision detection (circle-rect)
    const cx = player.x, cy = player.y, cr = player.r;
    const rx = b.x, ry = b.y, rw = b.w, rh = b.h;
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX, dy = cy - closestY;
    if (dx * dx + dy * dy < cr * cr) {
      running = false;
      playBeep(200, 0.2); // collision sound
    }
    // Remove off‑screen barriers
    if (b.y > canvas.height) {
      barriers.splice(i, 1);
      score += 1;
      playBeep(600, 0.05); // score increment sound
    }
  }
}

function draw() {
  // Update scrolling grid offset
  gridOffset = (gridOffset + 2) % 40;
  // Neon grid background with scrolling offset and gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#020202');
  bgGrad.addColorStop(1, '#0a0a2a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1;
  // vertical lines with offset
  for (let x = -gridOffset; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  // horizontal lines with offset
  for (let y = -gridOffset; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Particle trail
  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y -= 1.5; // move up
    p.alpha -= 0.02;
    p.size *= 0.98;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
  // Draw particles
  particles.forEach(p => {
    ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw player with glow
  const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 3);
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, 'rgba(0,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r * 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // Draw barriers
  ctx.fillStyle = '#f0f';
  barriers.forEach(b => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  // Score
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + score, 10, 20);

  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (running) update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Input handling
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') left = true;
  if (e.key === 'ArrowRight') right = true;
  if (!running && e.key === 'Enter') {
    // reset game
    barriers.length = 0;
    player.x = canvas.width / 2;
    score = 0;
    running = true;
    lastSpawn = Date.now();
  }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') left = false;
  if (e.key === 'ArrowRight') right = false;
});
