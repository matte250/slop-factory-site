// Simple Asteroid Escape game – enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Background starfield (static) -----
  const starCanvas = document.createElement('canvas');
  starCanvas.width = width;
  starCanvas.height = height;
  const starCtx = starCanvas.getContext('2d');
  const starCount = 200;
  for (let i = 0; i < starCount; i++) {
    const sx = Math.random() * width;
    const sy = Math.random() * height;
    const sr = Math.random() * 1.5 + 0.5;
    starCtx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.5) + ')';
    starCtx.beginPath();
    starCtx.arc(sx, sy, sr, 0, Math.PI * 2);
    starCtx.fill();
  }

  // Ship definition – triangle with gradient
  const ship = {
    width: 30,
    height: 15,
    x: width / 2,
    y: height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
    draw() {
      const gradient = ctx.createLinearGradient(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
      gradient.addColorStop(0, '#00ff80');
      gradient.addColorStop(1, '#006640');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.height / 2); // top point
      ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2); // bottom left
      ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2); // bottom right
      ctx.closePath();
      ctx.fill();
    },
    update() {
      if (this.moveLeft) this.x -= this.speed;
      if (this.moveRight) this.x += this.speed;
      // keep inside canvas
      this.x = Math.max(this.width / 2, Math.min(width - this.width / 2, this.x));
    },
  };

  // Asteroid pool – radial gradient shading
  const asteroids = [];
  const asteroidSpawnInterval = 90; // frames
  let frameCount = 0;
  const baseAsteroidSpeed = 2;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = radius + Math.random() * (width - 2 * radius);
    const speed = baseAsteroidSpeed + Math.random() * 2 + (score / 30);
    // create a radial gradient for each asteroid
    const gradient = ctx.createRadialGradient(x, -radius, radius * 0.2, x, -radius, radius);
    gradient.addColorStop(0, '#caa');
    gradient.addColorStop(1, '#8b4513');
    asteroids.push({ x, y: -radius, radius, speed, gradient });
  }

  function updateAsteroids() {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }
    if (frameCount % asteroidSpawnInterval === 0) spawnAsteroid();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.fillStyle = a.gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Simple rectangle‑circle collision
  function collides(ship, asteroid) {
    const dx = Math.abs(asteroid.x - ship.x);
    const dy = Math.abs(asteroid.y - ship.y);
    if (dx > ship.width / 2 + asteroid.radius) return false;
    if (dy > ship.height / 2 + asteroid.radius) return false;
    if (dx <= ship.width / 2) return true;
    if (dy <= ship.height / 2) return true;
    const cornerDistSq = (dx - ship.width / 2) ** 2 + (dy - ship.height / 2) ** 2;
    return cornerDistSq <= asteroid.radius ** 2;
  }

  // Score handling
  let startTime = null;
  let score = 0;
  let gameOver = false;

  function updateScore(timestamp) {
    if (!startTime) startTime = timestamp;
    score = Math.floor((timestamp - startTime) / 1000);
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function drawGameOver() {
    // dim background first
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff5555';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 10);
    ctx.fillText(`Score: ${score}s`, width / 2, height / 2 + 30);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'square';
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      ship.moveLeft = true;
      playTone(300, 0.08);
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      ship.moveRight = true;
      playTone(300, 0.08);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  });

  function loop(timestamp) {
    if (gameOver) {
      drawGameOver();
      return;
    }
    // draw background stars
    ctx.drawImage(starCanvas, 0, 0);
    // clear the rest of the frame (objects) with transparent compositing
    ctx.clearRect(0, 0, width, height);
    // redraw stars after clear (makes them static)
    ctx.drawImage(starCanvas, 0, 0);

    ship.update();
    ship.draw();

    updateAsteroids();
    drawAsteroids();

    for (const a of asteroids) {
      if (collides(ship, a)) {
        // collision sound
        playTone(100, 0.3);
        gameOver = true;
        break;
      }
    }

    updateScore(timestamp);
    drawScore();

    frameCount++;
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
