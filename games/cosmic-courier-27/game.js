// Simple "Cosmic Courier" canvas game with enhanced graphics
// Canvas with id="game" must exist in the HTML.
const canvas = document.getElementById('game');
// Audio assets
const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/steve67/mp3/space-ambient.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
const thrustSound = new Audio('https://cdn.jsdelivr.net/gh/steve67/mp3/thrust.wav');
thrustSound.volume = 0.5;
const collectSound = new Audio('https://cdn.jsdelivr.net/gh/steve67/mp3/collect.wav');
collectSound.volume = 0.7;
const crashSound = new Audio('https://cdn.jsdelivr.net/gh/steve67/mp3/crash.wav');
crashSound.volume = 0.8;
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Create star field for background
const starCount = 100;
const stars = [];
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.5 + 0.5
  });
}


// Game state
let ship = { x: canvas.width / 2, y: canvas.height - 60, width: 30, height: 40, speed: 5 };
let asteroids = [];
let fuels = [];
let keys = {};
let fuel = 100; // percent
let gameOver = false;
let frameCount = 0;

// Input handling
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: Math.random() * 2 + 2 });
}
function spawnFuel() {
  const r = 10;
  fuels.push({ x: Math.random() * (canvas.width - r * 2) + r, y: -r, r, speed: 2 });
}

function update() {
  // Play thrust sound when moving up (once per press)
  if (keys['ArrowUp'] && thrustSound.paused) {
    thrustSound.currentTime = 0;
    thrustSound.play();
  }
  if (gameOver) return;

  // Move ship
  if (keys['ArrowLeft']) ship.x -= ship.speed;
  if (keys['ArrowRight']) ship.x += ship.speed;
  if (keys['ArrowUp']) ship.y -= ship.speed;
  if (keys['ArrowDown']) ship.y += ship.speed;
  // Keep ship inside canvas
  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height - ship.height, ship.y));

  // Decrease fuel
  fuel -= 0.02;
  if (fuel <= 0) {
    fuel = 0;
    endGame();
  }

  // Spawn obstacles
  if (frameCount % 80 === 0) spawnAsteroid();
  if (frameCount % 300 === 0) spawnFuel();

  // Update asteroids
  asteroids.forEach(a => a.y += a.speed);
  asteroids = asteroids.filter(a => a.y - a.size < canvas.height);

  // Update fuels
  fuels.forEach(f => f.y += f.speed);
  fuels = fuels.filter(f => f.y - f.r < canvas.height);

  // Collision detection
  for (let a of asteroids) {
    if (rectCircleCollide(ship, a)) {
      // Play crash sound
      crashSound.currentTime = 0;
      crashSound.play();
      endGame();
      return;
    }
  }
  for (let i = fuels.length - 1; i >= 0; i--) {
    const f = fuels[i];
    if (rectCircleCollide(ship, { x: f.x, y: f.y, size: f.r * 2 })) {
      // Play collect sound
      collectSound.currentTime = 0;
      collectSound.play();
      fuel = Math.min(100, fuel + 20);
      fuels.splice(i, 1);
    }
  }

  frameCount++;
}

function rectCircleCollide(rect, circ) {
  const dx = Math.max(rect.x, Math.min(circ.x, rect.x + rect.width));
  const dy = Math.max(rect.y, Math.min(circ.y, rect.y + rect.height));
  const distX = circ.x - dx;
  const distY = circ.y - dy;
  const radius = circ.size ? circ.size / 2 : circ.r;
  return (distX * distX + distY * distY) <= radius * radius;
}

function draw() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw star field (twinkling)
  stars.forEach(star => {
    // Slightly vary opacity for twinkle effect
    star.opacity = Math.max(0.3, Math.min(1, star.opacity + (Math.random() - 0.5) * 0.05));
    ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw ship (triangle) with gradient and thrust
  const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.height);
  shipGrad.addColorStop(0, '#00ff80');
  shipGrad.addColorStop(1, '#006600');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.height);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();
  // Thrust effect when moving up
  if (keys['ArrowUp']) {
    ctx.fillStyle = 'rgba(255,165,0,0.7)';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2 - 5, ship.y + ship.height + 15);
    ctx.lineTo(ship.x + ship.width / 2 + 5, ship.y + ship.height + 15);
    ctx.closePath();
    ctx.fill();
  }

  // Draw asteroids with radial gradient
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size * 0.1,
      a.x + a.size / 2,
      a.y + a.size / 2,
      a.size / 2
    );
    grad.addColorStop(0, '#555555');
    grad.addColorStop(1, '#111111');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw fuels (glowing)
  fuels.forEach(f => {
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
    // outer glow
    ctx.fillStyle = 'rgba(255,221,0,0.3)';
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r + 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw fuel bar
  ctx.fillStyle = '#555';
  ctx.fillRect(10, 10, 100, 10);
  ctx.fillStyle = '#0f0';
  ctx.fillRect(10, 10, fuel, 10);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

function endGame() {
  gameOver = true;
}

// Start background music
bgMusic.play().catch(() => {});
// Start the game
requestAnimationFrame(loop);
