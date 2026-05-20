// Simple Asteroid Dodger game
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
  };

  // Game state
  const bullets = [];
  const asteroids = [];
  let score = 0;
  let lives = 3;
  let gameOver = false;

  // Input handling
  // Sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playShoot() { playTone(600, 0.08); }
  function playExplosion() { playTone(200, 0.15); }
  function playGameOver() { playTone(100, 0.5); }
  // Ensure audio context is resumed on first interaction
  window.addEventListener('keydown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); }, {once: true});
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Create background stars
const stars = [];
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }
}
initStars();

function updateStars() {
  for (let s of stars) {
    s.y += s.speed;
    if (s.y > height) {
      s.y = 0;
      s.x = Math.random() * width;
    }
  }
}

function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
    });
  }

  function update() {
    // Update background stars
    updateStars();
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys.ArrowRight) ship.x = Math.min(width - ship.w, ship.x + ship.speed);
    // Fire bullet
    if (keys[' '] && bullets.length < 5) {
      bullets.push({
        x: ship.x + ship.w / 2 - 2,
        y: ship.y,
        w: 4,
        h: 10,
        speed: 7,
      });
      playShoot();
    }
    // Update bullets
    bullets.forEach(b => b.y -= b.speed);
    // Remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
    }
    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // Ship collision
if (
          a.x < ship.x + ship.w && a.x + a.w > ship.x &&
          a.y < ship.y + ship.h && a.y + a.h > ship.y
        ) {
          lives--;
          asteroids.splice(i, 1);
          playExplosion();
          if (lives <= 0) {
            gameOver = true;
            playGameOver();
          }
          continue;
        }
      // Bullet collision
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (
          a.x < b.x + b.w && a.x + a.w > b.x &&
          a.y < b.y + b.h && a.y + a.h > b.y
        ) {
          score++;
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          playExplosion();
          break;
        }
      }
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }
    // Randomly spawn new asteroids
    if (Math.random() < 0.02) spawnAsteroid();
  }

function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#555';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (draw as triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Bullets (glow effect)
    for (let b of bullets) {
      const gradB = ctx.createRadialGradient(b.x + b.w/2, b.y + b.h/2, 0, b.x + b.w/2, b.y + b.h/2, b.w);
      gradB.addColorStop(0, '#ff0');
      gradB.addColorStop(1, '#aa0');
      ctx.fillStyle = gradB;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // Asteroids (draw as circles with shading)
    for (let a of asteroids) {
      const gradA = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w/4, a.x + a.w/2, a.y + a.h/2, a.w/2);
      gradA.addColorStop(0, '#ff5555');
      gradA.addColorStop(1, '#880000');
      ctx.fillStyle = gradA;
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, width - 80, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
