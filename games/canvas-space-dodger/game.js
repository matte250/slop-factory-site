// Canvas Space Dodger – enhanced graphics with sound
// Targets <canvas id="game"> in the surrounding HTML
(function () {
  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playBoost() { playTone(600, 0.08, 'triangle'); }
  function playCollision() { playTone(100, 0.3, 'sawtooth'); }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // ----- Player -----
  const ship = {
    x: 60,
    y: height / 2,
    size: 20,
    vy: 0,
    speed: 0.4,
    boost: 0,
    update(dt) {
      this.vy += this.boost * dt;
      this.y += this.vy * dt;
      // simple friction
      this.vy *= 0.98;
      // keep inside bounds
      if (this.y < this.size) { this.y = this.size; this.vy = 0; }
      if (this.y > height - this.size) { this.y = height - this.size; this.vy = 0; }
    },
    draw() {
      const grad = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
    }
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'Space') e.preventDefault(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
  });

  // ----- Asteroids -----
  const asteroids = [];
  // starfield for background
  const stars = [];
  const maxStars = 100;
  for (let i = 0; i < maxStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 30 + 20 // pixels per second
    });
  }

  // Update star positions (parallax effect)
  function updateStars(dt) {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed * dt;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
  }

  const asteroidSpec = {
    minSize: 15,
    maxSize: 40,
    minSpeed: 150,
    maxSpeed: 300,
    spawnInterval: 800 // ms
  };
  let lastSpawn = 0;

  function spawnAsteroid() {
    const size = Math.random() * (asteroidSpec.maxSize - asteroidSpec.minSize) + asteroidSpec.minSize;
    const y = Math.random() * (height - size) + size / 2;
    const speed = Math.random() * (asteroidSpec.maxSpeed - asteroidSpec.minSpeed) + asteroidSpec.minSpeed;
    asteroids.push({ x: width + size, y, size, speed });
  }

  // ----- Game state -----
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function update(dt) {
    // Input handling
    const prevBoost = ship.boost;
    ship.boost = (keys['ArrowUp'] || keys['KeyW']) ? -ship.speed : (keys['ArrowDown'] || keys['KeyS']) ? ship.speed : 0;
    if (keys['Space']) ship.boost = -ship.speed * 2; // boost upwards
    // Play boost sound when boost starts
    if (ship.boost !== 0 && prevBoost === 0) playBoost();
    ship.update(dt);

    // Update starfield (parallax)
    updateStars(dt);

    // Asteroids movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }

    // Spawn
    if (performance.now() - lastSpawn > asteroidSpec.spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.size + ship.size) {
          playCollision();
          gameOver = true;
          break;
        }
    }

    // Score — seconds survived
    if (!gameOver) score += dt;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw ship with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ship.draw();
    ctx.shadowColor = 'transparent';
    // draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
