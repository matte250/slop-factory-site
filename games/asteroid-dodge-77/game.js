// Asteroid Dodge game
// Canvas element with id="game" is expected in the HTML.
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Create a short white‑noise buffer for explosion sound
  const createNoiseBuffer = (duration=0.3) => {
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.25; // low volume noise
    }
    return buffer;
  };
  const explosionBuffer = createNoiseBuffer();
  const playExplosion = () => {
    const source = audioCtx.createBufferSource();
    source.buffer = explosionBuffer;
    source.connect(audioCtx.destination);
    source.start();
  };
  // Simple background hum using oscillator
  const humOsc = audioCtx.createOscillator();
  humOsc.frequency.value = 40; // low frequency
  const humGain = audioCtx.createGain();
  humGain.gain.value = 0.02;
  humOsc.connect(humGain).connect(audioCtx.destination);
  humOsc.start();
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship settings
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    draw() {
      // Ship with green gradient
      const grad = ctx.createLinearGradient(this.x - this.w / 2, this.y, this.x + this.w / 2, this.y + this.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#004400');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h);
      ctx.closePath();
      ctx.fill();
      // Ship outline
      ctx.strokeStyle = '#0a0';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  // Asteroid settings
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0;
  const maxAsteroidSize = 40;
  const minAsteroidSize = 15;
  const asteroidSpeed = 2;

  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Score
  let score = 0;
  let startTime = Date.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateShip() {
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));
  }

  function spawnAsteroid() {
    const size = Math.random() * (maxAsteroidSize - minAsteroidSize) + minAsteroidSize;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, w: size, h: size });
  }

  function updateAsteroids() {
    asteroids.forEach(a => a.y += asteroidSpeed);
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y > height) asteroids.splice(i, 1);
    }
    if (frameCount % asteroidSpawnRate === 0) spawnAsteroid();
  }

  function updateStars() {
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });
  }

  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function checkCollisions() {
    for (const a of asteroids) {
      if (rectsIntersect(ship, a)) {
        gameOver = true;
        // Play explosion sound on collision
        playExplosion();
        break;
      }
    }
  }

  function drawStars() {
    // Draw each star as a glowing point with subtle twinkling
    stars.forEach(s => {
      const alpha = 0.5 + Math.random() * 0.5; // twinkle effect
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawAsteroids() {
    // Draw each asteroid as a circular rock with radial shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.2,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
      ctx.fillText('Score: ' + Math.floor(score), width / 2 - 80, height / 2 + 40);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    updateStars();
    drawStars();
    updateShip();
    ship.draw();
    updateAsteroids();
    drawAsteroids();
    checkCollisions();
    // Score based on survival time
    score = (Date.now() - startTime) / 1000;
    drawScore();
    frameCount++;
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
