// Cosmic Dodger – minimal implementation
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context resumes after first user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function playCollision() { playTone(150, 0.3); }
  function playScore() { playTone(440, 0.05); }
  // Starfield background
  const starCount = 120;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 12,
    speed: 3,
    dx: 0,
    dy: 0,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4); // 0: top,1:right,2:bottom,3:left
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 2;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -20;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = width + 20;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + 20;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else { // left
      x = -20;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    }
    const r = 8 + Math.random() * 12;
    asteroids.push({ x, y, vx, vy, r });
  }

  function update(dt) {
    // Ship movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));

    // Spawn asteroids
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Move asteroids and remove off‑screen ones
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < -30 || a.x > width + 30 || a.y < -30 || a.y > height + 30) {
        asteroids.splice(i, 1);
        score++;
        playScore();
      } else if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.r + ship.size) {
          playCollision();
          gameOver = true;
      }
    }
  }

  function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001d3d');
  bgGrad.addColorStop(1, '#000814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // Starfield
  ctx.fillStyle = 'white';
  stars.forEach(s => { ctx.fillRect(s.x, s.y, 1, 1); });
    ctx.clearRect(0, 0, width, height);
    // Ship – gradient triangle
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size, ship.y - ship.size, ship.x + ship.size, ship.y + ship.size);
    shipGrad.addColorStop(0, '#00ffea');
    shipGrad.addColorStop(1, '#0077ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // Asteroids – shaded circles
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#b0b0b0');
      grad.addColorStop(1, '#3a3a3a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
