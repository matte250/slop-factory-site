// Asteroid Escape – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// ----- Starfield background -----
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    radius: Math.random() * 1.5 + 0.5,
  });
}
function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----- Player ship -----
const ship = {
  width: 30,
  height: 30,
  x: WIDTH / 2 - 15,
  y: HEIGHT - 40,
  speed: 5,
  moveLeft: false,
  moveRight: false,
  draw() {
    const grad = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y + this.height);
    grad.addColorStop(0, '#00ff00');
    grad.addColorStop(1, '#006600');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#003300';
    ctx.stroke();
  },
  update() {
    if (this.moveLeft) this.x = Math.max(0, this.x - this.speed);
    if (this.moveRight) this.x = Math.min(WIDTH - this.width, this.x + this.speed);
  }
};

// ----- Asteroids -----
const asteroids = [];
let asteroidTimer = 0;
const spawnInterval = 90; // frames
let gameOver = false;
let startTime = null;
let score = 0;

function spawnAsteroid() {
  const radius = Math.random() * 15 + 10;
  const x = Math.random() * (WIDTH - radius * 2) + radius;
  const speed = Math.random() * 2 + 1;
  const hue = Math.floor(Math.random() * 30) + 200; // bluish gray
  const asteroid = { x, y: -radius, radius, speed, hue };
  asteroids.push(asteroid);
}

function drawAsteroids() {
  asteroids.forEach(a => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    grad.addColorStop(0, `hsl(${a.hue}, 20%, 60%)`);
    grad.addColorStop(1, `hsl(${a.hue}, 10%, 30%)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateAsteroids() {
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.y += a.speed;
    if (a.y - a.radius > HEIGHT) {
      asteroids.splice(i, 1);
    } else if (checkCollision(a)) {
      gameOver = true;
    }
  }
}

function checkCollision(a) {
  const cx = ship.x + ship.width / 2;
  const cy = ship.y + ship.height / 2;
  const dx = Math.abs(a.x - cx);
  const dy = Math.abs(a.y - cy);
  if (dx > (ship.width / 2 + a.radius)) return false;
  if (dy > (ship.height / 2 + a.radius)) return false;
  return true;
}

function drawScore() {
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(255,0,0,0.4)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.fillText('Game Over', WIDTH / 2 - 80, HEIGHT / 2);
  drawScore();
}

function loop(timestamp) {
  if (!startTime) startTime = timestamp;
  const delta = timestamp - startTime;
  score = delta / 1000;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawStars();

  if (!gameOver) {
    if (asteroidTimer++ > spawnInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }
    ship.update();
    updateAsteroids();
    ship.draw();
    drawAsteroids();
    drawScore();
    requestAnimationFrame(loop);
  } else {
    drawGameOver();
  }
}

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, duration = 0.1, type = 'sine') {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
  oscillator.connect(gainNode).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

function playMoveSound() {
  // short higher pitch for move
  playTone(600, 0.05);
}

function playCollisionSound() {
  // lower pitch, longer for collision
  playTone(150, 0.3, 'square');
}

function playSpawnSound() {
  // subtle blip
  playTone(400, 0.07);
}

// ----- Input handling -----
let moveSoundPlayed = false;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') {
    ship.moveLeft = true;
    if (!moveSoundPlayed) { playMoveSound(); moveSoundPlayed = true; }
  }
  if (e.key === 'ArrowRight') {
    ship.moveRight = true;
    if (!moveSoundPlayed) { playMoveSound(); moveSoundPlayed = true; }
  }
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') {
    ship.moveLeft = false;
    moveSoundPlayed = false;
  }
  if (e.key === 'ArrowRight') {
    ship.moveRight = false;
    moveSoundPlayed = false;
  }
});

// hook sound on asteroid spawn and collision
const originalSpawnAsteroid = spawnAsteroid;
spawnAsteroid = function() {
  playSpawnSound();
  originalSpawnAsteroid();
};

const originalCheckCollision = checkCollision;
function checkCollision(a) {
  const collided = originalCheckCollision(a);
  if (collided) {
    playCollisionSound();
  }
  return collided;
}

requestAnimationFrame(loop);
