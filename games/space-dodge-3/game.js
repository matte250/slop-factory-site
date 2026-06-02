// Simple Space Dodge game targeting canvas with id="game"
// Ship moves left/right at bottom, dodges falling asteroids.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0',
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const asteroidSpeed = 2;

  // Star field
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }
  initStars();

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playSpawn() { playTone(300, 0.08); }
  function playCrash() { playTone(100, 0.4); }

  // Draw stars on background
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  // Update star positions
  function updateStars() {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = -s.size;
        s.x = Math.random() * width;
      }
    }
  }

  let left = false,
      right = false,
      gameOver = false;

  // Input handling
  document.addEventListener('keydown', e => {
    // Unlock audio on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') left = true;
    if (e.key === 'ArrowRight') right = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') left = false;
    if (e.key === 'ArrowRight') right = false;
  });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: asteroidSpeed + Math.random() * 2,
    });
    // Play spawn sound
    playSpawn();
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (left) ship.x -= ship.speed;
    if (right) ship.x += ship.speed;
    // Keep ship in bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update stars (moving downwards)
    updateStars();

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.w &&
        ship.x + ship.w > a.x &&
        ship.y < a.y + a.h &&
        ship.y + ship.h > a.y
      ) {
        gameOver = true;
        // Play crash sound
        playCrash();
        alert('Game Over');
        break;
      }
    }
  }

  function draw() {
    // Background (star field)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw moving stars
    drawStars();

    // Draw ship as a triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    for (const a of asteroids) {
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
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  setInterval(spawnAsteroid, asteroidSpawnInterval);
  requestAnimationFrame(loop);
})();
