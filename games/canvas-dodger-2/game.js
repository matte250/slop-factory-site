// Simple Canvas Dodger game with enhanced graphics
// Canvas element with id="game" must exist in the HTML.

(function() {
  const canvas = document.getElementById('game');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Simple beep function
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSpawnSound() { beep(200, 0.05); }
  function playCollisionSound() { beep(100, 0.3); }
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set a default size if not defined in HTML
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Player ship
  const ship = {
    width: 50,
    height: 20,
    x: canvas.width / 2 - 25,
    y: canvas.height - 30,
    speed: 5,
    dx: 0,
    draw() {
      ctx.fillStyle = '#0af';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    },
    update() {
      this.x += this.dx;
      // Keep inside bounds
      if (this.x < 0) this.x = 0;
      if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    }
  };

  // Asteroids
  const asteroids = [];
  let asteroidSpawnTimer = 0;
  let asteroidSpawnInterval = 1000; // ms
  let lastTime = performance.now();
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    playSpawnSound();
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + score / 30; // speed increases with score
    asteroids.push({ x, y: -radius, radius, speed });
  }

  function update(dt) {
    if (gameOver) return;
    // Update ship
    ship.update();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection (simple circle‑rect)
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.width));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.height));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.radius * a.radius) {
          playCollisionSound();
        gameOver = true;
        break;
      }
    }

    // Spawn logic
    asteroidSpawnTimer += dt;
    if (asteroidSpawnTimer > asteroidSpawnInterval) {
      spawnAsteroid();
      asteroidSpawnTimer = 0;
      // gradually increase spawn rate
      if (asteroidSpawnInterval > 300) asteroidSpawnInterval -= 20;
    }

    // Update score (seconds survived)
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw ship
    ship.draw();
    // Draw asteroids
    ctx.fillStyle = '#a33';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
    ship.dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
    ship.dx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  });

  const startTime = performance.now();
  requestAnimationFrame(loop);
})();
