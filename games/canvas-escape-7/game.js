// Minimal Canvas Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = freq;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration / 1000);
}

// Ship
  const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 10,
};

// Controls
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'ArrowUp') playTone(300, 100);
  // Ensure audio context is running after first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
});
window.addEventListener('keyup', e => keys[e.code] = false);

// Asteroids
const asteroids = [];
function spawnAsteroid() {
  const radius = 15 + Math.random() * 20;
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = -radius; y = Math.random() * canvas.height; }
  else if (edge === 1) { x = canvas.width + radius; y = Math.random() * canvas.height; }
  else if (edge === 2) { x = Math.random() * canvas.width; y = -radius; }
  else { x = Math.random() * canvas.width; y = canvas.height + radius; }
  const speed = 0.5 + Math.random() * 1.5;
  const angle = Math.atan2(ship.y - y, ship.x - x);
  asteroids.push({ x, y, radius, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed });
}
let spawnTimer = 0;

let gameOver = false;
function loop(delta) {
  if (gameOver) return;
  // Update ship
  if (keys['ArrowLeft']) ship.angle -= 0.05;
  if (keys['ArrowRight']) ship.angle += 0.05;
  if (keys['ArrowUp']) {
    ship.vx += Math.cos(ship.angle) * 0.1;
    ship.vy += Math.sin(ship.angle) * 0.1;
  }
  ship.x += ship.vx;
  ship.y += ship.vy;
  // Wrap around edges
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;

  // Update asteroids
  spawnTimer += delta;
  if (spawnTimer > 2000) { spawnAsteroid(); spawnTimer = 0; }
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x += a.vx;
    a.y += a.vy;
    // Remove if offscreen
    if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
      asteroids.splice(i, 1);
    } else if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.radius + ship.radius) {
      playTone(100, 300);
      gameOver = true;
    }
  }

  // Draw background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Star field (drawn once)
  if (!window.stars) {
    window.stars = [];
    for (let i = 0; i < 100; i++) {
      window.stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
    }
  }
  ctx.fillStyle = '#444';
  window.stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // ship body
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, 6);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fillStyle = '#0f0';
  ctx.fill();
  ctx.strokeStyle = '#0a0';
  ctx.lineWidth = 1;
  ctx.stroke();
  // thrust flame
  if (keys['ArrowUp']) {
    ctx.beginPath();
    ctx.moveTo(-8, 3);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-8, -3);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  ctx.restore();
  // Asteroids
  asteroids.forEach(a => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle || 0);
    const grad = ctx.createRadialGradient(0, 0, a.radius * 0.3, 0, 0, a.radius);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  if (!gameOver) requestAnimationFrame(ts => loop(ts - lastTS));
  else {
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  }
}
let lastTS = performance.now();
requestAnimationFrame(ts => { lastTS = ts; loop(0); });
