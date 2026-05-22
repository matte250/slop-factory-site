// Meteor Dodge game with enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

// Load simple sound effects (replace URLs with your own files if desired)
const sfx = {
  // short ping for each avoided meteor
  point: new Audio('https://cdn.jsdelivr.net/gh/hchiam/awesome-audio/ping.mp3'),
  // crash sound for collision
  crash: new Audio('https://cdn.jsdelivr.net/gh/hchiam/awesome-audio/crash.mp3'),
};
// Ensure sounds are allowed to play (may require user interaction first)
Object.values(sfx).forEach(a => a.load());

// Background stars for a space feel
const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  radius: Math.random() * 1.5 + 0.5,
}));

function drawBackground() {
  // space black
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // tiny stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Ship – rendered as a sleek triangle
const ship = {
  width: 40,
  height: 20,
  x: canvas.width / 2 - 20,
  y: canvas.height - 30,
  speed: 5,
  color: '#00ffff', // cyan
};

function drawShip() {
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.height);
  ctx.lineTo(ship.x + ship.width / 2, ship.y);
  ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
  ctx.closePath();
  ctx.fill();
}

let leftPressed = false;
let rightPressed = false;
let meteors = [];
let score = 0;
let gameOver = false;
let frameCount = 0;

function spawnMeteor() {
  const size = 20 + Math.random() * 20;
  meteors.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2 + Math.random() * 2 + frameCount * 0.001,
    // create radial gradient for a glowing effect
    gradient: null,
  });
}

function drawMeteors() {
  meteors.forEach(m => {
    // create gradient once per meteor
    if (!m.gradient) {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        0,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#ff8800');
      grad.addColorStop(0.7, '#ff4400');
      grad.addColorStop(1, '#aa0000');
      m.gradient = grad;
    }
    ctx.fillStyle = m.gradient;
    ctx.beginPath();
    ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateMeteors() {
  meteors.forEach((m, i) => {
    m.y += m.speed;
    // remove off‑screen meteors and increase score
    if (m.y - m.size > canvas.height) {
      meteors.splice(i, 1);
      score++;
      // play point sound on successful dodge
      sfx.point.currentTime = 0;
      sfx.point.play();
    }
    // ship‑meteor collision
    if (
      m.x < ship.x + ship.width &&
      m.x + m.size > ship.x &&
      m.y < ship.y + ship.height &&
      m.y + m.size > ship.y
    ) {
      gameOver = true;
      // play crash sound
      sfx.crash.currentTime = 0;
      sfx.crash.play();
    }
  });
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
}

function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = '#ff4444';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    ctx.fillText(`Score: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 40);
    return;
  }
  drawBackground();
  // handle input
  if (leftPressed && ship.x > 0) ship.x -= ship.speed;
  if (rightPressed && ship.x + ship.width < canvas.width) ship.x += ship.speed;

  if (frameCount % 60 === 0) spawnMeteor();

  updateMeteors();
  drawMeteors();
  drawShip();
  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Input listeners
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') leftPressed = true;
  if (e.key === 'ArrowRight') rightPressed = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  if (e.key === 'ArrowRight') rightPressed = false;
});

gameLoop();
