// Simple Canvas Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Background stars
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
  });
}

// Sound assets
const soundMusic = new Audio('https://cdn.jsdelivr.net/gh/kevinschaul/space-game-assets@main/background.mp3');
soundMusic.loop = true;
soundMusic.volume = 0.2;
const soundFuel = new Audio('https://cdn.jsdelivr.net/gh/kevinschaul/space-game-assets@main/fuel.wav');
const soundCrash = new Audio('https://cdn.jsdelivr.net/gh/kevinschaul/space-game-assets@main/crash.wav');
let musicStarted = false;

// Player ship (triangle)
const ship = {
  x: canvas.width / 2,
  y: canvas.height - 50,
  size: 16,
  speed: 4,
  color: 'lime',
};

let keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!musicStarted) {
    soundMusic.play();
    musicStarted = true;
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Asteroids & fuel
const asteroids = [];
const fuels = [];
let asteroidTimer = 0;
let fuelTimer = 0;
let score = 0;
let fuel = 100; // seconds
let gameOver = false;

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size) + size / 2,
    y: -size,
    radius: size / 2,
    speed: Math.random() * 2 + 1,
  });
}

function spawnFuel() {
  const size = 10;
  fuels.push({
    x: Math.random() * (canvas.width - size) + size / 2,
    y: -size,
    radius: size / 2,
    speed: 1.5,
  });
}

function update(dt) {
  if (gameOver) return;
  // Player movement (triangle uses size, not radius)
  if (keys.ArrowLeft && ship.x - ship.size > 0) ship.x -= ship.speed;
  if (keys.ArrowRight && ship.x + ship.size < canvas.width) ship.x += ship.speed;
  if (keys.ArrowUp && ship.y - ship.size > 0) ship.y -= ship.speed;
  if (keys.ArrowDown && ship.y + ship.size < canvas.height) ship.y += ship.speed;

  // Background stars drift
  stars.forEach(st => {
    st.y += 0.5; // slow downward motion
    if (st.y > canvas.height) {
      st.y = 0;
      st.x = Math.random() * canvas.width;
    }
  });

  // Spawn asteroids/fuel
  asteroidTimer += dt;
  fuelTimer += dt;
  if (asteroidTimer > 1000) { // every second
    spawnAsteroid();
    asteroidTimer = 0;
  }
  if (fuelTimer > 3000) { // every 3 seconds
    spawnFuel();
    fuelTimer = 0;
  }

  // Update asteroids
  asteroids.forEach((a, i) => {
    a.y += a.speed;
    if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    // collision with ship (triangle approx using ship.size)
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist < a.radius + ship.size) { gameOver = true; soundCrash.play(); }
  });

  // Update fuels
  fuels.forEach((f, i) => {
    f.y += f.speed;
    if (f.y - f.radius > canvas.height) fuels.splice(i, 1);
    const dx = f.x - ship.x;
    const dy = f.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if (dist < f.radius + ship.size) {
      fuel += 20; // add fuel seconds
      soundFuel.play();
      fuels.splice(i, 1);
    }
  });

  // Decrease fuel over time
  fuel -= dt / 1000;
  if (fuel <= 0) gameOver = true;
  score += dt / 1000;
}

function draw() {
  // Clear and draw space background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars (twinkling)
  ctx.fillStyle = 'white';
  stars.forEach(st => {
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ship (triangle)
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y - ship.size);
  ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
  ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
  ctx.closePath();
  ctx.fill();

  // Asteroids (rocky look with slight shading)
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Fuel cells (glowing)
  fuels.forEach(f => {
    const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
    grad.addColorStop(0, 'rgba(255,215,0,0.9)');
    grad.addColorStop(1, 'rgba(255,215,0,0.4)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
  ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}`, 10, 40);

  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
}

let last = 0;
function loop(timestamp) {
  const dt = timestamp - last;
  last = timestamp;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
