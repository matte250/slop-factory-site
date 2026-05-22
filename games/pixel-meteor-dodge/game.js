// Simple Pixel Meteor Dodge game with enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Audio context for sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.value = freq;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

// Starfield background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * W,
    y: Math.random() * H,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  });
}

// Ship – represented as a triangle with gradient
const ship = {
  w: 30,
  h: 15,
  x: W / 2 - 15,
  y: H - 20,
  speed: 4,
  move: 0
};

// Bullets
const bullets = [];

// Meteors
const meteors = [];
let meteorTimer = 0;
const meteorInterval = 90; // frames

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') shoot(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function shoot() {
  // Play shooting sound
  playTone(600, 0.08);
  bullets.push({ x: ship.x + ship.w / 2, y: ship.y, dy: -6, r: 3 });
}

function update() {
  // Move ship
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y += b.dy;
    if (b.y < 0) bullets.splice(i, 1);
  }

  // Spawn meteors
  if (meteorTimer <= 0) {
    const size = 20 + Math.random() * 15;
    meteors.push({ x: Math.random() * (W - size), y: -size, dy: 1 + Math.random() * 1.5, size });
    meteorTimer = meteorInterval;
  } else {
    meteorTimer--;
  }

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.dy;
    // collision with ship
    if (
      m.x < ship.x + ship.w &&
      m.x + m.size > ship.x &&
      m.y + m.size > ship.y &&
      m.y < ship.y + ship.h
    ) {
      endGame();
      return;
    }
    // collision with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = b.x - (m.x + m.size / 2);
      const dy = b.y - (m.y + m.size / 2);
      if (Math.hypot(dx, dy) < m.size / 2) {
        // Play explosion sound
        playTone(200, 0.2);
        meteors.splice(i, 1);
        bullets.splice(j, 1);
        break;
      }
    }
    // off screen
    if (m.y > H) {
      meteors.splice(i, 1);
    }
  }
}

function draw() {
  // Clear canvas with semi‑transparent overlay for motion blur effect
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, W, H);

  // Draw moving starfield (tiny twinkling stars)
  stars.forEach(star => {
    star.y += 0.3; // slight drift downwards
    if (star.y > H) star.y = 0;
    ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship – draw as a gradient triangle
  const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
  shipGradient.addColorStop(0, '#00f');
  shipGradient.addColorStop(1, '#0ff');
  ctx.fillStyle = shipGradient;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w / 2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Bullets – glowing circles
  bullets.forEach(b => {
    const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Meteors – radial gradient with a darker rim
  meteors.forEach(m => {
    const radGrad = ctx.createRadialGradient(
      m.x + m.size / 2,
      m.y + m.size / 2,
      0,
      m.x + m.size / 2,
      m.y + m.size / 2,
      m.size / 2
    );
    radGrad.addColorStop(0, '#ff7777');
    radGrad.addColorStop(0.7, '#ff2222');
    radGrad.addColorStop(1, '#880000');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

let running = true;
function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}
function endGame() {
  running = false;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fff';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', W / 2, H / 2);
}
// Start
loop();
