// Simple Asteroid Dodge game
// Canvas with id="game" expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship settings
  const ship = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Asteroid settings
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const asteroidSpeedMin = 2;
  const asteroidSpeedMax = 5;
  let lastSpawn = 0;

  // Star field settings
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // Game state
  let score = 0;
  let running = true;
  let keys = {};
  let gameOverPlayed = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context can start after user interaction
  window.addEventListener('click', () => audioCtx.resume());
  window.addEventListener('keydown', () => audioCtx.resume());
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() { playTone(150, 200); }
  function playGameOver() { playTone(80, 500); }
  function playDodge() { playTone(300, 100); }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    const speed = Math.random() * (asteroidSpeedMax - asteroidSpeedMin) + asteroidSpeedMin;
    asteroids.push({ x, y: -size, size, speed });
  }

  function update(dt) {
    // ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
        if (a.y - a.size > height) {
          asteroids.splice(i, 1);
          score++;
          playDodge();
        } else if (collision(a)) {
          running = false;
          playCollision();
        }
    }
  }

  function collision(asteroid) {
    // simple AABB vs circle approximation
    const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
    const cx = asteroid.x + asteroid.size / 2;
    const cy = asteroid.y + asteroid.size / 2;
    const r = asteroid.size / 2;
    const nearestX = Math.max(shipRect.x, Math.min(cx, shipRect.x + shipRect.w));
    const nearestY = Math.max(shipRect.y, Math.min(cy, shipRect.y + shipRect.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop(timestamp) {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over! Score: ' + score, width / 2 - 100, height / 2);
      return;
    }
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastRender = 0;
  requestAnimationFrame(loop);
})();
