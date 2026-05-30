// Nebula Escape – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// ----- stars background -----
const stars = [];
function createStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
    });
  }
}
createStars();
function updateStars() {
  for (const s of stars) {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.x = Math.random() * canvas.width;
      s.y = -s.radius;
    }
  }
}
function drawStars() {
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Ship definition
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 10,
};

const keys = { left: false, right: false, up: false };
// Audio setup
let audioCtx = null;
let thrustOsc = null;
function initAudio(){
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function startThrustSound(){
  initAudio();
  if (thrustOsc) return;
  thrustOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  thrustOsc.frequency.value = 200;
  gain.gain.value = 0.08;
  thrustOsc.connect(gain).connect(audioCtx.destination);
  thrustOsc.start();
}
function stopThrustSound(){
  if (thrustOsc) {
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
}
function playExplosion(){
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 80;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft') keys.left = true;
  if (e.code === 'ArrowRight') keys.right = true;
  if (e.code === 'ArrowUp') {
    keys.up = true;
    startThrustSound();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft') keys.left = false;
  if (e.code === 'ArrowRight') keys.right = false;
  if (e.code === 'ArrowUp') {
    keys.up = false;
    stopThrustSound();
  }
});

// ----- asteroids -----
const asteroids = [];
function spawnAsteroid() {
  const radius = 15 + Math.random() * 20;
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 0.8 + Math.random() * 1.2;
  switch (edge) {
    case 0: // top
      x = Math.random() * canvas.width;
      y = -radius;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
      break;
    case 1: // right
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
      break;
    case 2: // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
      break;
    default: // left
      x = -radius;
      y = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
  }
  // give each asteroid a simple irregular shape via offset array
  const points = [];
  const sides = 8 + Math.floor(Math.random() * 4);
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.6);
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
  }
  asteroids.push({ x, y, vx, vy, radius, points });
}
for (let i = 0; i < 5; i++) spawnAsteroid();

let animationId;
function update() {
  // controls
  if (keys.left) ship.angle -= 0.05;
  if (keys.right) ship.angle += 0.05;
  if (keys.up) {
    ship.vx += Math.cos(ship.angle) * 0.2;
    ship.vy += Math.sin(ship.angle) * 0.2;
  }
  // friction
  ship.vx *= 0.99;
  ship.vy *= 0.99;
  ship.x += ship.vx;
  ship.y += ship.vy;

  // bounds check – lose condition
  if (ship.x < 0 || ship.x > canvas.width || ship.y < 0 || ship.y > canvas.height) {
    cancelAnimationFrame(animationId);
    alert('Game over: you left the arena');
    return;
  }

  // update stars and asteroids
  updateStars();
  for (const a of asteroids) {
    a.x += a.vx;
    a.y += a.vy;
    // wrap
    if (a.x < -a.radius) a.x = canvas.width + a.radius;
    if (a.x > canvas.width + a.radius) a.x = -a.radius;
    if (a.y < -a.radius) a.y = canvas.height + a.radius;
    if (a.y > canvas.height + a.radius) a.y = -a.radius;
    // collision
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist2 = dx * dx + dy * dy;
    const radSum = a.radius + ship.radius;
    if (dist2 < radSum * radSum) {
      cancelAnimationFrame(animationId);
      alert('Game over: collision');
      return;
    }
  }

  // draw background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();

  // draw ship with gradient
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
  grad.addColorStop(0, '#88f');
  grad.addColorStop(1, '#113');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();
  // thruster flame
  if (keys.up) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-18, 0);
    ctx.lineTo(-10, 4);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // draw asteroids with irregular shape and shading
  for (const a of asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.fillStyle = '#555';
    ctx.beginPath();
    const pts = a.points;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  animationId = requestAnimationFrame(update);
}

update();
