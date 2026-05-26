// Asteroid Dodge game (canvas id="game")
(function () {
  // Get canvas and context
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Helper to play a beep
  function playTone(freq, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure audio context is resumed on first interaction
  function unlockAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('mousedown', unlockAudio);
  }
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);

  // Set canvas size to its displayed size
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Create a vertical space gradient background
const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
bgGrad.addColorStop(0, '#02010a');
bgGrad.addColorStop(1, '#000');

  // Player definition (triangular ship with gradient)
  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      // Draw triangular ship with a gradient
      const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
      grad.addColorStop(0, '#0af');
      grad.addColorStop(1, '#005');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.x += this.dx;
      // Keep within bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    },
  };

  // Asteroid storage and starfield
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames between spawns
  let speedIncrease = 0.001; // per frame increase

  // Game state
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Starfield setup
const stars = [];
const starCount = Math.max(50, Math.floor((canvas.width * canvas.height) / 5000));
for (let i = 0; i < starCount; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  });
}

function drawStars() {
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
}

function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
if (a.y - a.radius > canvas.height) {
          asteroids.splice(i, 1);
          score++;
          // Play point sound
          playTone(600, 0.08);
        }
    }
  }

  function drawAsteroids() {
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      // rect-circle collision
      const distX = Math.abs(a.x - (player.x + player.width / 2));
      const distY = Math.abs(a.y - (player.y + player.height / 2));
      if (distX > player.width / 2 + a.radius) continue;
      if (distY > player.height / 2 + a.radius) continue;
      if (distX <= player.width / 2 || distY <= player.height / 2) return true;
      const dx = distX - player.width / 2;
      const dy = distY - player.height / 2;
      if (dx * dx + dy * dy <= a.radius * a.radius) return true;
    }
    return false;
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function gameLoop() {
  if (!running) return;
  // Draw background gradient
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Draw stars behind everything
  drawStars();
    if (!running) return;
    // Background already drawn; no clear needed

    // Input
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    player.update();
    player.draw();

    // Asteroids
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidInterval;
    } else {
      asteroidTimer--;
    }
    updateAsteroids();
    drawAsteroids();

    // Collision
    if (checkCollision()) {
      // Play collision sound
      playTone(200, 0.4);
      running = false;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillText('Score: ' + score, canvas.width / 2, canvas.height / 2 + 20);
      return;
    }

    drawScore();
    // increase difficulty gradually
    asteroids.forEach(a => (a.speed += speedIncrease));
    requestAnimationFrame(gameLoop);
  }

  // Start the loop when page is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    gameLoop();
  } else {
    window.addEventListener('DOMContentLoaded', gameLoop);
  }
})();
