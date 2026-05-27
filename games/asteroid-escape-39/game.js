// Simple Asteroid Escape game
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Background stars for a space feel
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Spaceship
  const ship = {
    w: 40,
    h: 20,
    x: W / 2 - 20,
    y: H - 30,
    speed: 5,
    color: '#0f0',
    moveLeft: false,
    moveRight: false,
  };

  // Asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames
  let speedFactor = 1;

  // Game state
  let running = true;
  let frame = 0;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      ship.moveLeft = true;
      playBeep(400, 0.05);
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      ship.moveRight = true;
      playBeep(400, 0.05);
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.moveLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.moveRight = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (W - size);
    const y = -size;
    const speed = 1.5 + Math.random() * 1.5;
    asteroids.push({ x, y, w: size, h: size, speed: speed * speedFactor, color: '#888' });
  }

  function update() {
    // Move ship
    if (ship.moveLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.moveRight) ship.x = Math.min(W - ship.w, ship.x + ship.speed);

    // Spawn asteroids
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidInterval;
    } else {
      asteroidTimer--;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off-screen
      if (a.y > H) asteroids.splice(i, 1);
    }

    // Update background stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }

    // Increase difficulty over time
    if (frame % 600 === 0) speedFactor += 0.2;
  }

  function drawShip() {
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawAsteroids() {
    ctx.fillStyle = '#555';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const a of asteroids) {
      const withinX = ship.x < a.x + a.w && ship.x + ship.w > a.x;
      const withinY = ship.y < a.y + a.h && ship.y + ship.h > a.y;
      if (withinX && withinY) return true;
    }
    return false;
  }

  function gameOver() {
    running = false;
    // Play collision beep
    playBeep(150, 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  function loop() {
    if (!running) return;
    // Clear and draw space background
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    update();
    drawShip();
    drawAsteroids();
    if (checkCollision()) {
      gameOver();
      return;
    }
    frame++;
    requestAnimationFrame(loop);
  }

  function drawBackground() {
    // Dark space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#000022');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Start the game
  requestAnimationFrame(loop);
})();
