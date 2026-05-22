// Simple Asteroid Escape game
// Canvas with id="game" in the HTML
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Ship state
// Sound assets
const thrustSound = new Audio('thrust.mp3');
thrustSound.loop = true;
const crashSound = new Audio('crash.mp3');
let thrustPlaying = false;
let crashPlayed = false;
// Add star field for background
const STAR_COUNT = 100;
const stars = [];
function initStars() {
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
}
initStars();
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
  vx: 0,
  vy: 0,
  radius: 10,
  thrust: 0.1,
  rotateSpeed: 0.07,
};

let fuel = 100; // percent
let asteroids = [];
let gameOver = false;
let lastSpawn = 0;

function spawnAsteroid() {
  // Add random rotation angle and speed for asteroid
  const angle = Math.random() * Math.PI * 2;
  const rotSpeed = (Math.random() - 0.5) * 0.02;
  const edge = Math.floor(Math.random() * 4);
  let x, y, vx, vy;
  const speed = 1 + Math.random() * 1.5;
  switch (edge) {
    case 0: // top
      x = Math.random() * canvas.width; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed; break;
    case 1: // right
      x = canvas.width + 20; y = Math.random() * canvas.height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
    case 2: // bottom
      x = Math.random() * canvas.width; y = canvas.height + 20; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
    case 3: // left
      x = -20; y = Math.random() * canvas.height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
  }
  asteroids.push({x, y, vx, vy, r: 15 + Math.random() * 20, angle: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.02});
}

function update(dt) {
  if (gameOver) return;
  // Controls
  if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
  if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
  const thrusting = keys['ArrowUp'] && fuel > 0;
  if (thrusting) {
    ship.vx += Math.cos(ship.angle) * ship.thrust;
    ship.vy += Math.sin(ship.angle) * ship.thrust;
    fuel -= dt * 0.01; // fuel consumption
    if (!thrustPlaying) {
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
  } else {
    thrustSound.pause();
  }
  // Move ship
  ship.x += ship.vx;
  ship.y += ship.vy;
  // Screen wrap for ship
  if (ship.x < 0) ship.x += canvas.width;
  if (ship.x > canvas.width) ship.x -= canvas.width;
  if (ship.y < 0) ship.y += canvas.height;
  if (ship.y > canvas.height) ship.y -= canvas.height;
  // Update asteroids
  for (let a of asteroids) {
    a.x += a.vx;
    a.y += a.vy;
    a.angle += a.rotSpeed;
    // wrap
    if (a.x < -30) a.x += canvas.width + 60;
    if (a.x > canvas.width + 30) a.x -= canvas.width + 60;
    if (a.y < -30) a.y += canvas.height + 60;
    if (a.y > canvas.height + 30) a.y -= canvas.height + 60;
  }
  // Collision detection
  for (let a of asteroids) {
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.r + ship.radius) {
      gameOver = true;
      if (!crashPlayed) {
        crashSound.currentTime = 0;
        crashSound.play();
        crashPlayed = true;
      }
    }
  }
  // Fuel out
  if (fuel <= 0) gameOver = true;
  // Spawn new asteroids periodically
  if (performance.now() - lastSpawn > 2000) {
    spawnAsteroid();
    lastSpawn = performance.now();
  }
}

function draw() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#000020');
  grad.addColorStop(1, '#000010');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = 'white';
  for (let s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }


  // Ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    // Ship gradient
    const shipGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 12);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    // Optional thrust flame
    if (keys['ArrowUp'] && fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-20, -5);
      ctx.lineTo(-20, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
  ctx.restore();
    // Asteroids with gradient shading and rotation
    for (let a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const gradA = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      gradA.addColorStop(0, '#888888');
      gradA.addColorStop(1, '#222222');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  // UI
  ctx.fillStyle = 'lime';
  ctx.font = '16px monospace';
  ctx.fillText('Fuel: ' + Math.max(0, fuel).toFixed(0) + '%', 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px monospace';
    ctx.fillText('GAME OVER', canvas.width / 2 - 150, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Input handling
const keys = {};
window.addEventListener('keydown', e => {keys[e.key] = true;});
window.addEventListener('keyup', e => {keys[e.key] = false;});
