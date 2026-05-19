// Space Dodger – simple canvas game
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  // Set canvas dimensions (full window)
  const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
  window.addEventListener('resize', resize);
  resize();

  // Ship definition (gradient triangle)
  // Starfield background
  const stars = [];
  const starCount = 200;
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  initStars();
  // Redraw stars on resize
  window.addEventListener('resize', () => {
    initStars();
  });

  const ship = {
  const ship = {
    x: 80,
    y: canvas.height / 2,
    radius: 12,
    speed: 4,
    dy: 0,
    draw() {
      // gradient ship
      const grad = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x, this.y + this.radius);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#00f');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x - this.radius, this.y - this.radius);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y += this.dy;
      // keep inside canvas
      if (this.y < this.radius) this.y = this.radius;
      if (this.y > canvas.height - this.radius) this.y = canvas.height - this.radius;
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); updateShipDir(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; updateShipDir(); });
  function updateShipDir() {
    if (keys.ArrowUp || keys.w) {
      ship.dy = -ship.speed;
      playTone(600, 80); // up movement beep
    }
    else if (keys.ArrowDown || keys.s) {
      ship.dy = ship.speed;
      playTone(400, 80); // down movement beep
    }
    else ship.dy = 0;
  }

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: canvas.width + size,
      y: Math.random() * (canvas.height - size * 2) + size,
      r: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ffb840');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Simple collision (circle‑to‑triangle bounding circle)
  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) return true;
    }
    return false;
  }

  let score = 0;
  let gameOver = false;
  let lastTime = 0;

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 30);
      return;
    }
    // draw background (gradient)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // update and draw stars (twinkling drift)
    ctx.fillStyle = '#fff';
    const starSpeed = 0.3;
    stars.forEach(s => {
      s.x -= starSpeed;
      if (s.x < 0) s.x = canvas.width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // update
    ship.update();
    updateAsteroids(dt);
    // draw
    ship.draw();
    drawAsteroids();
    // score based on time survived
    score += dt * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    // collision
    if (checkCollision()) {
      playTone(200, 300); // crash sound
      gameOver = true;
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
