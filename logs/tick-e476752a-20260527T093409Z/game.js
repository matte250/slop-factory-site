// Minimal Asteroid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // --- Audio setup ----------------------------------------------------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollisionSound() {
    // Low‑pitched beep for collision
    playBeep(150, 200);
  }


  // Set canvas size to fill the window (you can adjust as needed)
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars(); // regenerate stars on size change
  }
  resize();
  window.addEventListener('resize', resize);

  // --- Starfield -----------------------------------------------------
  const stars = [];
  function initStars() {
    const count = Math.floor((canvas.width * canvas.height) / 8000);
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.twinkle * (0.5 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  initStars();

  // --- Game state -----------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 12,
    angle: -Math.PI / 2, // points up
    speed: 2,
    turnSpeed: 0.06,
    turningLeft: false,
    turningRight: false,
  };

  const asteroids = [];
  let lastAsteroidTime = 0;
  const asteroidInterval = 1200; // ms between spawns
  const asteroidSpeed = 1.5;

  let startTime = null;
  let gameOver = false;

  // --- Input ----------------------------------------------------------
  let audioStarted = false;
  function ensureAudio() {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  }
  window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') {
      ship.turningLeft = true;
      ensureAudio();
      playBeep(400, 80); // turn sound
    }
    if (e.code === 'ArrowRight') {
      ship.turningRight = true;
      ensureAudio();
      playBeep(400, 80);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') ship.turningLeft = false;
    if (e.code === 'ArrowRight') ship.turningRight = false;
  });

  // --- Helper functions ------------------------------------------------
  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = -radius; // start above the visible area
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02; // small rotation speed
    const grad = ctx.createRadialGradient(0, 0, radius * 0.2, 0, 0, radius);
    grad.addColorStop(0, '#777');
    grad.addColorStop(1, '#222');
    asteroids.push({ x, y, radius, angle, angularSpeed, grad });
  }

  function update(delta) {
    if (gameOver) return;

    // Ship rotation
    if (ship.turningLeft) ship.angle -= ship.turnSpeed;
    if (ship.turningRight) ship.angle += ship.turnSpeed;

    // Ship forward motion (constant speed)
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Keep ship inside canvas (wrap around horizontally)
    if (ship.x < 0) ship.x = canvas.width;
    if (ship.x > canvas.width) ship.x = 0;
    if (ship.y < 0) ship.y = canvas.height;
    if (ship.y > canvas.height) ship.y = 0;

    // Spawn asteroids
    if (performance.now() - lastAsteroidTime > asteroidInterval) {
      spawnAsteroid();
      lastAsteroidTime = performance.now();
    }

    // Move asteroids (including rotation)
    for (const a of asteroids) {
      a.y += asteroidSpeed;
      a.angle += a.angularSpeed;
    }
    // Remove off‑screen asteroids
    while (asteroids.length && asteroids[0].y - asteroids[0].radius > canvas.height) {
      asteroids.shift();
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        playCollisionSound();
        break;
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Gradient for ship body
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#006');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.7, ship.radius);
    ctx.lineTo(-ship.radius * 0.7, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = a.grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawScore() {
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Time: ${elapsed}s`, 20, 30);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    const finalScore = ((performance.now() - startTime) / 1000).toFixed(2);
    ctx.font = '32px sans-serif';
    ctx.fillText(`Survived ${finalScore}s`, canvas.width / 2, canvas.height / 2 + 30);
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastRender || timestamp);
    lastRender = timestamp;

    // clear and draw background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    update(delta);
    drawShip();
    drawAsteroids();
    drawScore();

    if (gameOver) {
      drawGameOver();
    } else {
      requestAnimationFrame(loop);
    }
  }
  let lastRender = null;
  requestAnimationFrame(loop);
})();
