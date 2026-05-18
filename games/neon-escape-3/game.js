// Neon Escape – minimal endless runner
// Canvas with id="game" is assumed to exist in the page.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Use the canvas's displayed size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Initialize starfield
const starCount = 120;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
}


// Player ship (triangle with neon glow)
const player = {
  x: 60,
  y: canvas.height / 2,
  w: 20,
  h: 20,
  vy: 0,
  speed: 0.4,
  color: 'cyan',
};

const obstacles = [];
// Particle trail for ship
const particles = []; // each {x,y,vy,life}

const obstacleFreq = 1200; // ms between spawns
let lastSpawn = 0;
let gameOver = false;
let lastTime = 0;

// Input handling – up/down arrows (or W/S)
const keys = {};
// Simple synth for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playMove() { beep(600, 0.05); }
function playCrash() { beep(150, 0.3); }
window.addEventListener('keydown', e => { 
  if (!keys[e.key]) {
    // first press triggers move sound
    if (['ArrowUp','ArrowDown','w','s'].includes(e.key)) playMove();
  }
  keys[e.key] = true; 
  // Ensure audio context is resumed on interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnObstacle() {
  const gap = 100; // vertical gap for player to pass
  const topHeight = Math.random() * (canvas.height - gap);
  const bottomY = topHeight + gap;
  const thickness = 30;
  // Top barrier
  obstacles.push({ x: canvas.width, y: 0, w: thickness, h: topHeight });
  // Bottom barrier
  obstacles.push({ x: canvas.width, y: bottomY, w: thickness, h: canvas.height - bottomY });
}

function rectCollision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  // Generate particle trail
  particles.push({
    x: player.x + player.w / 2,
    y: player.y + player.h / 2,
    vy: player.vy * 0.5,
    life: 30
  });

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
  // Player vertical movement
  if (keys['ArrowUp'] || keys['w']) player.vy -= player.speed;
  if (keys['ArrowDown'] || keys['s']) player.vy += player.speed;
  // Apply friction
  player.vy *= 0.95;
  player.y += player.vy;
  // Keep within canvas bounds (lose if out)
  if (player.y < 0 || player.y + player.h > canvas.height) { if (!gameOver) { gameOver = true; playCrash(); } }

  // Move obstacles left
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 2.5;
    if (o.x + o.w < 0) obstacles.splice(i, 1);
    else if (rectCollision(player, o)) { if (!gameOver) { gameOver = true; playCrash(); } }
  }

  // Spawn new obstacles
  if (performance.now() - lastSpawn > obstacleFreq) {
    spawnObstacle();
    lastSpawn = performance.now();
  }
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Neon gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001020');
  bgGrad.addColorStop(1, '#000010');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Starfield overlay
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  stars.forEach(s => {
    ctx.fillRect(s.x, s.y, 1, 1);
    s.x -= 0.5;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  });

  // Draw obstacles with neon glow
  ctx.shadowColor = 'magenta';
  ctx.shadowBlur = 8;
  ctx.fillStyle = 'magenta';
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  ctx.shadowBlur = 0;

  // Draw particle trail (fading neon specks)
  ctx.fillStyle = player.color;
  particles.forEach(p => {
    const alpha = p.life / 30;
    ctx.globalAlpha = alpha * 0.6;
    ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
  });
  ctx.globalAlpha = 1;

  // Draw player as neon triangle
  ctx.save();
  ctx.translate(player.x + player.w/2, player.y + player.h/2);
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(0, -player.h/2);
  ctx.lineTo(-player.w/2, player.h/2);
  ctx.lineTo(player.w/2, player.h/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;

  // Draw obstacles
  ctx.fillStyle = 'magenta';
  obstacles.forEach(o => {
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  if (gameOver) {
    ctx.fillStyle = 'white';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if (!gameOver) update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Start the game
requestAnimationFrame(loop);

// Export for testing/debugging (optional)
window.neonEscape = { canvas, ctx, player, obstacles };
