// Minimal canvas game based on IDEA.md
// Canvas element with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration, type='sine') {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// Resize canvas to fill parent
function resize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// Ship definition
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0, // radians
  speed: 2,
  size: 10,
};

// Rotate ship 90° clockwise on each click/tap with sound
canvas.addEventListener('click', () => {
  ship.angle += Math.PI / 2;
  playBeep(600, 0.08);
});

// Laser beam definition (simple vertical/horizontal moving lines)
class Laser {
  constructor() {
    // Randomly choose orientation
    this.vertical = Math.random() < 0.5;
    if (this.vertical) {
      this.x = Math.random() * canvas.width;
      this.y = -20; // start above canvas
      this.vx = 0;
      this.vy = 3 + Math.random() * 2;
    } else {
      this.x = -20;
      this.y = Math.random() * canvas.height;
      this.vx = 3 + Math.random() * 2;
      this.vy = 0;
    }
    this.width = this.vertical ? 4 : canvas.width;
    this.height = this.vertical ? canvas.height : 4;
    this.color = 'red';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
  }
  draw() {
    // glowing laser using gradient
    const grad = ctx.createLinearGradient(
      this.vertical ? this.x : 0,
      this.vertical ? 0 : this.y,
      this.vertical ? this.x : canvas.width,
      this.vertical ? canvas.height : this.y
    );
    grad.addColorStop(0, 'rgba(255,0,0,0.2)');
    grad.addColorStop(0.5, 'rgba(255,0,0,1)');
    grad.addColorStop(1, 'rgba(255,0,0,0.2)');
    ctx.fillStyle = grad;
    if (this.vertical) {
      ctx.fillRect(this.x - 4, this.y, 8, canvas.height);
    } else {
      ctx.fillRect(this.x, this.y - 4, canvas.width, 8);
    }
  }
  offScreen() {
    return (
      this.x > canvas.width + 20 ||
      this.y > canvas.height + 20 ||
      this.x < -20 ||
      this.y < -20
    );
  }
}

let lasers = [];
let laserSpawnTimer = 0;
let score = 0;
let lastTime = performance.now();
let gameOver = false;

function resetGame() {
  ship.x = canvas.width / 2;
  ship.y = canvas.height / 2;
  ship.angle = 0;
  lasers = [];
  laserSpawnTimer = 0;
  score = 0;
  gameOver = false;
  lastTime = performance.now();
}

function update(dt) {
  if (gameOver) return;

  // Move ship forward
  ship.x += Math.cos(ship.angle) * ship.speed;
  ship.y += Math.sin(ship.angle) * ship.speed;

  // Boundary check (lose condition)
  if (
    ship.x < 0 || ship.x > canvas.width ||
    ship.y < 0 || ship.y > canvas.height
  ) {
    gameOver = true;
  }

  // Spawn lasers every 1.5 seconds
  laserSpawnTimer += dt;
  if (laserSpawnTimer > 1500) {
    laserSpawnTimer = 0;
    lasers.push(new Laser());
  }

  // Update lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    const l = lasers[i];
    l.update();
    if (l.offScreen()) {
      lasers.splice(i, 1);
    }
  }

  // Collision detection (simple point vs line distance)
  for (const l of lasers) {
    if (l.vertical) {
      // distance from ship.x to laser x
      if (Math.abs(ship.x - l.x) < ship.size && ship.y > 0 && ship.y < canvas.height) {
        playBeep(100, 0.3, 'square');
        gameOver = true;
        break;
      }
    } else {
      if (Math.abs(ship.y - l.y) < ship.size && ship.x > 0 && ship.x < canvas.width) {
        playBeep(100, 0.3, 'square');
        gameOver = true;
        break;
      }
    }
  }

  // Increment score based on survival time
  score += dt / 1000;
}

function draw() {
  // Draw starfield background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // stars generated on resize
  if (!window.__stars) {
    const count = Math.floor(canvas.width * canvas.height * 0.00005);
    window.__stars = [];
    for (let i = 0; i < count; i++) {
      window.__stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  ctx.fillStyle = '#fff';
  for (const s of window.__stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw ship (triangle) with gradient and thrust
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body gradient
  const grad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
  grad.addColorStop(0, '#00ff00');
  grad.addColorStop(1, '#006600');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(ship.size, 0);
  ctx.lineTo(-ship.size / 2, ship.size / 2);
  ctx.lineTo(-ship.size / 2, -ship.size / 2);
  ctx.closePath();
  ctx.fill();
  // Thrust flame
  ctx.fillStyle = 'orange';
  ctx.beginPath();
  ctx.moveTo(-ship.size / 2, 0);
  ctx.lineTo(-ship.size - 4, ship.size / 3);
  ctx.lineTo(-ship.size - 4, -ship.size / 3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Draw lasers
  for (const l of lasers) {
    l.draw();
  }

  // Draw score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 30);
  }
}

// Restart on click after game over
canvas.addEventListener('click', () => {
  if (gameOver) resetGame();
});

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
