// Canvas Escape game - enhanced graphics
const canvas = document.getElementById('game');
// Audio context for simple sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
let soundPlayed = false;
const ctx = canvas.getContext('2d');
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 400;

const PLAYER_X = 80;
const PLAYER_RADIUS = 15;
const PLAYER_SPEED = 4;
const OBSTACLE_SPEED = 3;
const OBSTACLE_FREQ = 1500; // ms
let lastObstacle = 0;
let score = 0;
let gameOver = false;

const player = { x: PLAYER_X, y: canvas.height / 2, dy: 0, r: PLAYER_RADIUS };
const obstacles = [];
const particles = [];

function spawnObstacle() {
  const height = 30 + Math.random() * 70;
  const gap = 100;
  const y = Math.random() * (canvas.height - height - gap);
  // top rectangle
  obstacles.push({ x: canvas.width, y: 0, w: 20, h: y });
  // bottom rectangle
  obstacles.push({ x: canvas.width, y: y + height + gap, w: 20, h: canvas.height - (y + height + gap) });
}

function rectCircleCollide(rect, circle) {
  const distX = Math.abs(circle.x - rect.x - rect.w / 2);
  const distY = Math.abs(circle.y - rect.y - rect.h / 2);
  if (distX > rect.w / 2 + circle.r) return false;
  if (distY > rect.h / 2 + circle.r) return false;
  if (distX <= rect.w / 2) return true;
  if (distY <= rect.h / 2) return true;
  const dx = distX - rect.w / 2;
  const dy = distY - rect.h / 2;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

function update(dt) {
  if (gameOver) return;
  player.y += player.dy;
  if (player.y - player.r < 0) player.y = player.r;
  if (player.y + player.r > canvas.height) player.y = canvas.height - player.r;

  // update stars
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.x -= s.speed;
    if (s.x + s.r < 0) stars.splice(i, 1);
  }
  if (performance.now() - lastStar > STAR_FREQ) {
    spawnStar();
    lastStar = performance.now();
  }

  // update obstacles and check collision
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= OBSTACLE_SPEED;
    if (o.x + o.w < 0) obstacles.splice(i, 1);
    else if (rectCircleCollide(o, player)) {
      gameOver = true;
      // play collision sound once
      if (!soundPlayed) {
        beep(150, 300);
        soundPlayed = true;
      }
      // spawn explosion particles
      for (let p = 0; p < 30; p++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 30 + Math.random() * 30,
          r: Math.random() * 2 + 1,
          color: '#0f0'
        });
      }
    }
  }

  if (performance.now() - lastObstacle > OBSTACLE_FREQ) {
    spawnObstacle();
    lastObstacle = performance.now();
  }

  score += dt * 0.01;

  // update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}


function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // starfield
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // player with radial gradient
  const pGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
  pGrad.addColorStop(0, '#0f0');
  pGrad.addColorStop(1, '#060');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  // obstacles with gradient
  obstacles.forEach(o => {
    const oGrad = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y);
    oGrad.addColorStop(0, '#a00');
    oGrad.addColorStop(1, '#600');
    ctx.fillStyle = oGrad;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  // particles
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life / 60, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(ts) {
  const dt = ts - lastTime;
  lastTime = ts;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Starfield setup
const stars = [];
const STAR_FREQ = 100; // ms between new stars
let lastStar = 0;
function spawnStar() {
  stars.push({
    x: canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 1,
    speed: 0.5 + Math.random() * 1.0
  });
}

// Input handling
window.addEventListener('keydown', e => { audioCtx.resume();
  if (e.key === 'ArrowUp') player.dy = -PLAYER_SPEED;
  if (e.key === 'ArrowDown') player.dy = PLAYER_SPEED;
});
window.addEventListener('keyup', e => {
  if ((e.key === 'ArrowUp' && player.dy < 0) || (e.key === 'ArrowDown' && player.dy > 0)) player.dy = 0;
});
canvas.addEventListener('pointerdown', () => {
  audioCtx.resume();
  player.dy = -player.dy || PLAYER_SPEED;
});
