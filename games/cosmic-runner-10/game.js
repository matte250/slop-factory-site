// game.js – simple Cosmic Runner implementation
// Targets a <canvas id="game"></canvas> in the page.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 400;

  // Ship definition
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  const ship = {
    x: 80,
    y: height / 2,
    w: 40,
    h: 20,
    vy: 0,
    thrust: -0.4,
    gravity: 0.2,
    color: '#0ff',
    draw() {
      // ship with simple gradient
      const grad = ctx.createLinearGradient(this.x - this.w, this.y - this.h / 2, this.x, this.y + this.h / 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, this.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w, this.y + this.h / 2);
      ctx.lineTo(this.x - this.w, this.y - this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
      // stay within canvas
      if (this.y < this.h / 2) this.y = this.h / 2, this.vy = 0;
      if (this.y > height - this.h / 2) this.y = height - this.h / 2, this.vy = 0;
    },
    thrustUp() { this.vy = this.thrust; playSound(800, 0.07); }
  };

  // Asteroid definition
  const asteroids = [];
  const asteroidFreq = 90; // frames
  let frameCount = 0;
  const asteroidColors = ['#aaa', '#777', '#fff'];
// Starfield
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2
  });
}
function drawStars() {
  ctx.fillStyle = '#555';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
    s.x -= s.speed;
    if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
  });
}

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (height - size) + size / 2;
    const speed = Math.random() * 2 + 2;
    asteroids.push({ x: width + size, y, size, speed, color: asteroidColors[Math.floor(Math.random() * asteroidColors.length)] });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }
    if (frameCount % asteroidFreq === 0) spawnAsteroid();
  }

  function drawAsteroids() {
    // draw each asteroid with a subtle radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.1, a.x, a.y, a.size / 2);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, a.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = Math.abs((ship.x - ship.w / 2) - a.x);
      const dy = Math.abs(ship.y - a.y);
      const distance = Math.hypot(dx, dy);
      if (distance < a.size / 2 + Math.max(ship.w, ship.h) / 2) return true;
    }
    return false;
  }

  let score = 0;
  let gameOver = false;

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#f44';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.font = '24px monospace';
    ctx.fillText('Press Enter to Restart', width / 2, height / 2 + 30);
    ctx.textAlign = 'left';
  }

  function reset() {
    ship.y = height / 2;
    ship.vy = 0;
    asteroids.length = 0;
    score = 0;
    frameCount = 0;
    gameOver = false;
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
    if (gameOver && e.code === 'Enter') reset();
    if (!gameOver && (e.code === 'ArrowUp' || e.code === 'Space')) ship.thrustUp();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  function loop() {
    ctx.clearRect(0, 0, width, height);
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw moving stars
    drawStars();

    if (!gameOver) {
      // update entities
      ship.update();
      updateAsteroids();
      // collision
      if (checkCollision()) {
        playSound(200, 0.3);
        gameOver = true;
      }
      // draw
      ship.draw();
      drawAsteroids();
      drawScore();
      score += 0.1;
    } else {
      drawGameOver();
    }
    frameCount++;
    requestAnimationFrame(loop);
  }

  // start
  loop();
})();
