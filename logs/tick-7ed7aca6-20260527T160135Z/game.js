// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the page

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction (required by browsers)
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); };
  window.addEventListener('click', resumeAudio);

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
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
  const playShoot = () => beep(800, 0.05);
  const playExplosion = () => beep(200, 0.2);
  const playGameOver = () => beep(100, 0.5);

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 400;
  canvas.height = canvas.height || 600;

  // Starfield configuration
  const starCount = Math.floor(canvas.width * canvas.height / 8000);
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    color: '#0ff',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastAsteroidTime = 0;

  // Bullet pool (optional shooting)
  const bullets = [];
  const bulletSpeed = 7;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 1,
    });
  }

  function update(dt) {
  // Move starfield
  stars.forEach(s => {
    s.y += s.speed;
    if (s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  });
    // Move ship
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Shoot with space
    if (keys[' '] && bullets.length < 5) {
      bullets.push({ x: ship.x + ship.width / 2, y: ship.y });
      playShoot();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= bulletSpeed;
      if (b.y < 0) bullets.splice(i, 1);
    }

    // Spawn asteroids
    if (Date.now() - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off screen
      if (a.y > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship (lose condition)
      if (
        a.x < ship.x + ship.width &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.height &&
        a.y + a.size > ship.y
      ) {
        // Game over: stop loop
        cancelAnimationFrame(animId);
        ctx.fillStyle = 'red';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
        return;
      }
      // Collision with bullets (destroy asteroid)
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        if (
          b.x > a.x &&
          b.x < a.x + a.size &&
          b.y > a.y &&
          b.y < a.y + a.size
        ) {
          playExplosion();
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          break;
        }
      }
    }
  }

function draw() {
    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw bullets as small cyan rectangles
    ctx.fillStyle = '#0ff';
    bullets.forEach(b => ctx.fillRect(b.x - 1, b.y - 4, 2, 8));
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
