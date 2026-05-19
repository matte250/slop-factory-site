// Simple "Cosmic Dodge" game targeting <canvas id="game">
// No external assets, pure 2D canvas API

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Resize canvas to match its displayed size
  const STAR_COUNT = 80;
  const stars = [];

  function initStars() {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speedY: 0.02 + Math.random() * 0.06,
      });
    }
  }

  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars();
  }
  resize();
  window.addEventListener('resize', resize);

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: 0,
    y: 0,
    speedX: 0,
    boostTimer: 0,
    color: '#00ffcc',
    // glow effect radius
    glow: 8,
  };
  // Position ship at bottom centre
  function resetShip() {
    ship.x = (canvas.width - ship.w) / 2;
    ship.y = canvas.height - ship.h - 10;
    ship.speedX = 0;
    ship.boostTimer = 0;
  }
  resetShip();

  // Asteroid definition
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const speedY = 1 + Math.random() * 2;
    const drift = (Math.random() - 0.5) * 0.5; // horizontal drift
    asteroids.push({ x, y: -radius, radius, speedY, drift, color: '#ff8800' });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  function playBoost() {
    // Quick high‑pitched beep
    playTone(800, 100);
  }

  function playCollision() {
    // Low rumble
    playTone(150, 300);
  }

  // Game state
  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  function update(dt) {
    // Ship movement
    const accel = 0.4;
    if (keys['ArrowLeft'] || keys['a']) ship.speedX = -accel;
    else if (keys['ArrowRight'] || keys['d']) ship.speedX = accel;
    else ship.speedX = 0;
    // Boost upward (short burst)
    if ((keys['ArrowUp'] || keys['w']) && ship.boostTimer <= 0) {
      ship.boostTimer = 200; // ms of upward thrust
      playBoost(); // sound effect
    }
    // Apply boost
    if (ship.boostTimer > 0) {
      ship.y -= 0.3 * dt; // upward speed
      ship.boostTimer -= dt;
    }
    // Gravity back down
    ship.y += 0.1 * dt;
    // Horizontal move
    ship.x += ship.speedX * dt;
    // Keep within bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x + ship.w > canvas.width) ship.x = canvas.width - ship.w;
    if (ship.y > canvas.height - ship.h - 10) ship.y = canvas.height - ship.h - 10;
    if (ship.y < 0) ship.y = 0;

    // Update stars for parallax effect
    for (const s of stars) {
      s.y += s.speedY * dt;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speedY * dt;
      a.x += a.drift * dt;
      // Remove off‑screen
      if (a.y - a.radius > canvas.height) asteroids.splice(i, 1);
    }
    // Spawn new asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Collision detection (circle‑rect)
    for (const a of asteroids) {
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const dx = a.x - closestX;
      const dy = a.y - closestY;
      if (dx * dx + dy * dy < a.radius * a.radius) {
        playCollision();
        gameOver = true;
        break;
      }
    }

    // Score increases with time
    score += dt * 0.01;
  }

  function draw() {
    // Background gradient
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#00102a');
    grd.addColorStop(1, '#000814');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // Ship with glow and triangle shape
    ctx.save();
    ctx.shadowColor = ship.color;
    ctx.shadowBlur = ship.glow;
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with radial gradient and glow
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      radGrad.addColorStop(0, '#fff5');
      radGrad.addColorStop(1, a.color);
      ctx.save();
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 6;
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff4444';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(loop));
  } else {
    requestAnimationFrame(loop);
  }
})();
