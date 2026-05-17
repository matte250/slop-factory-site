// Meteor Dodge game with improved graphics and sounds
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context and sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
function playShoot() { playTone(400, 0.1); }
function playExplosion() { playTone(100, 0.3); }

canvas.width = 800;
canvas.height = 600;

// Background stars
const stars = [];
const starCount = 100;
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
  });
}

// Ship (triangle)
const ship = { x: canvas.width / 2, y: canvas.height - 40, width: 40, height: 30, speed: 5 };
let left = false,
  right = false,
  shoot = false;

// Bullets (circles)
const bullets = [];
const bulletSpeed = 7;

// Meteors (circles with gradient)
const meteors = [];
const meteorMinSpeed = 2,
  meteorMaxSpeed = 5;
let spawnTimer = 0;
const spawnInterval = 60; // frames
let score = 0;

function keyDown(e) {
  if (e.key === 'ArrowLeft') left = true;
  if (e.key === 'ArrowRight') right = true;
  if (e.key === ' ') shoot = true;
}
function keyUp(e) {
  if (e.key === 'ArrowLeft') left = false;
  if (e.key === 'ArrowRight') right = false;
  if (e.key === ' ') shoot = false;
}
window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

function spawnMeteor() {
  const size = 30 + Math.random() * 20;
  meteors.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    radius: size / 2,
    speed: meteorMinSpeed + Math.random() * (meteorMaxSpeed - meteorMinSpeed),
  });
}

function update() {
  // Ship movement
  if (left) ship.x -= ship.speed;
  if (right) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

  // Shooting
  if (shoot) {
    // rate limit: one bullet per 15px travel
    if (bullets.length === 0 || bullets[bullets.length - 1].y < ship.y - 15) {
      bullets.push({ x: ship.x + ship.width / 2, y: ship.y, radius: 4 });
    playShoot();
    }
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bulletSpeed;
    if (bullets[i].y < 0) bullets.splice(i, 1);
  }

  // Spawn meteors
  if (spawnTimer <= 0) {
    spawnMeteor();
    spawnTimer = spawnInterval;
  } else {
    spawnTimer--;
  }

  // Update meteors and handle collisions
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.y += m.speed;

    // Collision with ship
    if (
      m.x < ship.x + ship.width &&
      m.x + m.radius * 2 > ship.x &&
      m.y < ship.y + ship.height &&
      m.y + m.radius * 2 > ship.y
    ) {
      alert('Game Over! Score: ' + score);
      document.location.reload();
    }

    // Collision with bullets
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      const dx = b.x - (m.x + m.radius);
      const dy = b.y - (m.y + m.radius);
      const distance = Math.hypot(dx, dy);
if (distance < m.radius + b.radius) {
          // meteor hit
          playExplosion();
          meteors.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
    }

    // Remove off‑screen meteors
    if (m.y - m.radius > canvas.height) meteors.splice(i, 1);
  }
}

function drawStar(star) {
  ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawShip() {
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.height);
  ctx.lineTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();
}

function drawBullet(b) {
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMeteor(m) {
  const gradient = ctx.createRadialGradient(
    m.x + m.radius,
    m.y + m.radius,
    m.radius * 0.2,
    m.x + m.radius,
    m.y + m.radius,
    m.radius
  );
  gradient.addColorStop(0, '#ff8c00'); // bright core
  gradient.addColorStop(1, '#8b0000'); // dark edge
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(m.x + m.radius, m.y + m.radius, m.radius, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  // Clear background (black space)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  stars.forEach(drawStar);

  // Ship
  drawShip();

  // Bullets
  bullets.forEach(drawBullet);

  // Meteors
  meteors.forEach(drawMeteor);

  // Score text
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score, 10, 30);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
