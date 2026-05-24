// Neon Runner – minimal endless runner
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// player
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
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
const player = {
  x: 80,
  y: canvas.height - 60,
  r: 20,
  vy: 0,
  gravity: 0.8,
  jumpStrength: -15,
  color: '#0ff'
};

// obstacles
const obstacles = [];
let obstacleTimer = 0;
const obstacleInterval = 90; // frames
let speed = 4;
let score = 0;
let gameOver = false;

// particle trail for player
const particles = [];
function spawnParticle(x, y) {
  particles.push({
    x,
    y,
    radius: 2 + Math.random() * 2,
    alpha: 1,
    color: 'rgba(0,255,255,0.5)'
  });
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y -= 0.5;
    p.alpha -= 0.02;
    if (p.alpha <= 0) particles.splice(i, 1);
  }
}

function spawnObstacle() {
  const width = 30 + Math.random() * 20;
  const height = 40 + Math.random() * 40;
  obstacles.push({
    x: canvas.width,
    y: canvas.height - height,
    w: width,
    h: height,
    color: '#f0f'
  });
}

function update() {
  // update particle system
  updateParticles();
  if (gameOver) return;
  // player physics
  player.vy += player.gravity;
  player.y += player.vy;
  // emit trail particle each frame
  spawnParticle(player.x, player.y);
  if (player.y + player.r > canvas.height) {
    player.y = canvas.height - player.r;
    player.vy = 0;
  }

  // obstacles movement & spawn
  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
  }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= speed;
    // collision detection (simple AABB vs circle)
    const distX = Math.abs(player.x - (o.x + o.w / 2));
    const distY = Math.abs(player.y - (o.y + o.h / 2));
    if (distX > (o.w / 2 + player.r) || distY > (o.h / 2 + player.r)) {
      // no collision
    } else if (distX <= o.w / 2 || distY <= o.h / 2) {
gameOver = true;
        playSound(200, 0.2);
    } else {
      const dx = distX - o.w / 2;
      const dy = distY - o.h / 2;
      if (dx * dx + dy * dy <= player.r * player.r) gameOver = true;
    }
    // remove off-screen obstacles
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // increase difficulty
  speed += 0.001;
  score++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // background
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#003');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // player with neon glow
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // obstacles
  ctx.fillStyle = '#f0f';
  obstacles.forEach(o => {
    // neon obstacle gradient
    const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
    grad.addColorStop(0, '#f0f');
    grad.addColorStop(1, '#90f');
    ctx.fillStyle = grad;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  // particles
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // score
  ctx.fillStyle = '#0f0';
  ctx.font = '20px monospace';
  ctx.fillText('Score: ' + Math.floor(score / 60), 20, 30);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f44';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

function start() {
  // set canvas size and handle resize
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  // handle jump with sound
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && player.vy === 0) {
      player.vy = player.jumpStrength;
      playSound(400, 0.1);
    }
  });
  loop();
}

start();
