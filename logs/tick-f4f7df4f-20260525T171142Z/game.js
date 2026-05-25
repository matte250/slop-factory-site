// Simple reflex game: catch falling stars
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.width || 400;
canvas.height = canvas.height || 600;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration, type='sine') {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  osc.connect(gain).connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playCatchSound(){playSound(600,0.07,'triangle');}
function playGameOverSound(){playSound(200,0.5,'sawtooth');}

// Ensure audio context runs after user interaction
window.addEventListener('keydown', () => {
  if (audioCtx.state === 'suspended') audioCtx.resume();
});

// Player settings
const player = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  radius: 20,
  speed: 5,
  dx: 0,
};
// Background stars for ambiance
const backgroundStars = [];
const bgStarCount = 100;
for (let i = 0; i < bgStarCount; i++) {
  backgroundStars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  });
}
// Particles for catch effect
const particles = [];

// Star settings
const stars = [];
const starRadius = 10;
const spawnInterval = 1000; // ms
let lastSpawn = 0;
let score = 0;
let gameOver = false;

// Input handling
const keys = { ArrowLeft: false, ArrowRight: false };
window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;
});
window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function updatePlayer() {
  if (keys.ArrowLeft) player.dx = -player.speed;
  else if (keys.ArrowRight) player.dx = player.speed;
  else player.dx = 0;
  player.x += player.dx;
  // keep inside canvas
  if (player.x - player.radius < 0) player.x = player.radius;
  if (player.x + player.radius > canvas.width) player.x = canvas.width - player.radius;
}

function spawnStar(timestamp) {
  if (timestamp - lastSpawn > spawnInterval) {
    const x = Math.random() * (canvas.width - 2 * starRadius) + starRadius;
    stars.push({ x, y: -starRadius, radius: starRadius, speed: 2 + Math.random() * 2 });
    lastSpawn = timestamp;
  }
}

function updateStars() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.speed;
    // collision with player
    const dx = s.x - player.x;
    const dy = s.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < s.radius + player.radius) {
      // create catch particles
      for (let p = 0; p < 8; p++) {
        particles.push({
          x: s.x,
          y: s.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          life: 30,
          radius: Math.random() * 2 + 1,
        });
      }
      stars.splice(i, 1);
      score++;
      playCatchSound();
      continue;
    }
    // missed star => game over
    if (s.y - s.radius > canvas.height) {
      gameOver = true;
    }
  }
}
// Update background ambient stars
function updateBackgroundStars() {
  for (const bs of backgroundStars) {
    bs.y += bs.speed;
    if (bs.y > canvas.height) {
      bs.y = 0;
      bs.x = Math.random() * canvas.width;
    }
  }
}
// Update particles (fade out)
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#00172d');
  bgGrad.addColorStop(1, '#003366');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Ambient background stars
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (const bs of backgroundStars) {
    ctx.beginPath();
    ctx.arc(bs.x, bs.y, bs.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Particles (catch effect) with fading
  ctx.globalAlpha = 0.8;
  for (const p of particles) {
    const lifeRatio = p.life / 30;
    ctx.fillStyle = `rgba(255,215,0,${lifeRatio})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  // Player with radial gradient
  const playerGrad = ctx.createRadialGradient(
    player.x, player.y, player.radius * 0.2,
    player.x, player.y, player.radius
  );
  playerGrad.addColorStop(0, '#88c0ff');
  playerGrad.addColorStop(1, '#5e81ac');
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();

  // Stars with glow effect (five‑point stars)
  for (const s of stars) {
    ctx.shadowColor = 'rgba(255,215,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffd700';
    // draw five‑point star
    const spikes = 5;
    const outerRadius = s.radius;
    const innerRadius = s.radius * 0.5;
    const step = Math.PI / spikes;
    // start at first outer point
    let a0 = -Math.PI / 2 + Math.atan2(s.y - player.y, s.x - player.x);
    ctx.moveTo(s.x + Math.cos(a0) * outerRadius, s.y + Math.sin(a0) * outerRadius);
    ctx.beginPath();
    for (let i = 1; i < 2 * spikes; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const a = i * step - Math.PI / 2 + Math.atan2(s.y - player.y, s.x - player.x);
      ctx.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  // Score text with subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 2;
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.shadowBlur = 0;
}
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset
  }

  // Score text with subtle shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 2;
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  ctx.shadowBlur = 0;
}

function loop(timestamp) {
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 60, canvas.height / 2);
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 80, canvas.height / 2 + 30);
    return;
  }
  updatePlayer();
  spawnStar(timestamp);
  updateStars();
  updateBackgroundStars();
  updateParticles();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
