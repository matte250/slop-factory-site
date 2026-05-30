// Game based on IDEA.md – Canvas Escape
// Targets <canvas id="game"></canvas>
// Ship: small triangle at bottom, moves left/right (←/→) and boost (↑) to rise briefly.
// Asteroids: circles spawning at random x at top, falling down. Speed increases over time.
// Lose on collision or if ship falls below canvas.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const playTone = (freq, duration = 0.1, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playBoostSound = () => playTone(600, 0.08);
  const playCollisionSound = () => playTone(150, 0.4, 'square');
  // ensure audio context is resumed on first interaction
  const resumeAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  window.addEventListener('keydown', resumeAudio, { once: true });

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height - 30,
    radius: 10,
    speed: 3,
    vy: 0, // vertical velocity for boost/fall
    boostPower: -6,
    color: '#0f0',
  };

  const keys = { left: false, right: false, up: false };

  // ----- Asteroids -----
  const asteroids = [];
  let asteroidSpawnInterval = 1500; // ms
  let lastAsteroidTime = 0;
  let baseAsteroidSpeed = 1.5;
  let speedIncreaseRate = 0.00005; // per ms

  // background stars
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  function spawnAsteroid() {
    const radius = 12 + Math.random() * 8;
    asteroids.push({
      x: Math.random() * (width - radius * 2) + radius,
      y: -radius,
      radius,
      speed: baseAsteroidSpeed + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.02,
      color: '#777',
    });
  }

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    if (e.key === 'ArrowRight') keys.right = true;
    if (e.key === 'ArrowUp') {
      keys.up = true;
      playBoostSound();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
    if (e.key === 'ArrowUp') keys.up = false;
  });

  let gameOver = false;
  let lastTime = 0;

  function update(delta) {
    // Ship horizontal movement
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));

    // Boost handling
    if (keys.up) ship.vy = ship.boostPower;
    ship.vy += 0.2; // gravity-like pull down
    ship.y += ship.vy;
    // keep within vertical bounds (if falls off bottom => game over)
    if (ship.y > height - ship.radius) {
      ship.y = height - ship.radius;
      ship.vy = 0;
    }
    if (ship.y < ship.radius) ship.y = ship.radius;

    // Asteroid spawn
    if (performance.now() - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = performance.now();
    }

    // Update asteroids (position & rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (1 + speedIncreaseRate * performance.now());
      a.angle += a.angularSpeed;
      // remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection (circle vs circle)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        playCollisionSound();
        gameOver = true;
        break;
      }
    }
    // Fall off bottom condition (ship below canvas)
    if (ship.y - ship.radius > height) gameOver = true;
  }

  function draw() {
    // clear with semi‑transparent black for motion‑blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
    // draw background stars
    for (const s of stars) {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship with gradient fill
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.radius, ship.x, ship.y + ship.radius);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#030');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();
    // Draw asteroids with rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
