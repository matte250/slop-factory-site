// Minimal Asteroid Defender game targeting canvas with id "game"
// Added simple star background and improved graphics for ship, bullets, and asteroids.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup using Web Audio API
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
  function playShoot() { playTone(440, 0.1); }
  function playExplosion() { playTone(100, 0.2); }
  function playGameOver() { playTone(60, 0.5); }


  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0f0'
  };

  const bullets = [];
  const asteroids = [];
  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (width - size);
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y: -size, size, speed, color: '#f55' });
  }

  let asteroidTimer = 0;
  const asteroidInterval = 90; // frames

  function update() {
    if (gameOver) return;

    // Ship movement
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.width, ship.x + ship.speed);
    // Shooting
    if (keys['Space']) {
      // simple rate limit
      if (!ship.lastShot || performance.now() - ship.lastShot > 300) {
        bullets.push({ x: ship.x + ship.width / 2, y: ship.y, dy: -7, radius: 3, color: '#ff0' });
        ship.lastShot = performance.now();
        playShoot();
      }
    }

    // Update bullets
    bullets.forEach(b => b.y += b.dy);
    // Remove off‑screen bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y < 0) bullets.splice(i, 1);
    }

    // Spawn asteroids
    if (asteroidTimer++ > asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
    }

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      // Ship collision (lose condition)
      if (
        a.y + a.size >= ship.y &&
        a.x < ship.x + ship.width &&
        a.x + a.size > ship.x
      ) {
gameOver = true;
          playGameOver();
          break;
      }
      // Bullet collisions
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dx = b.x - (a.x + a.size / 2);
        const dy = b.y - (a.y + a.size / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < a.size / 2) {
          // Destroy asteroid and bullet
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          playExplosion();
          score += 10;
          break;
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw star background (simple twinkling effect)
    stars.forEach(s => {
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // Slight flicker
      s.alpha += (Math.random() - 0.5) * 0.05;
      s.alpha = Math.max(0.2, Math.min(1, s.alpha));
    });

    // Draw ship as a triangle for a sleeker look
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw bullets with glow
    bullets.forEach(b => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 2);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw asteroids with shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw asteroids
    asteroids.forEach(a => {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
