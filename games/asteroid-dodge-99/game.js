// Simple Asteroid Dodge game – targets canvas with id "game"
// ---------------------------------------------------------------
// Controls: Arrow keys – move ship left/right/up/down.
// Asteroids spawn from the top, fall down faster over time.
// Collision ends the game (red overlay). Score is displayed.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio context (resume on first interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioUnlocked = false;
  const unlockAudio = () => {
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  };
  window.addEventListener('keydown', unlockAudio, { once: true });

  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // ----- Game state -----
  const ship = { x: width / 2, y: height - 50, w: 30, h: 30, speed: 4 };
  const keys = {};
  const asteroids = [];
  const stars = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;
  // create starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), r: rand(0.5, 1.5) });
  }

  // ----- Input -----
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function circleRectCollision(c, r) {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > r.w / 2 + c.r) return false;
    if (distY > r.h / 2 + c.r) return false;
    if (distX <= r.w / 2) return true;
    if (distY <= r.h / 2) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= c.r * c.r;
  }

  // ----- Game loop -----
  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Move stars (slow parallax)
    stars.forEach(s => {
      s.y += 0.3; // tiny speed
      if (s.y > height) {
        s.x = rand(0, width);
        s.y = 0;
        s.r = rand(0.5, 1.5);
      }
    });

    // Spawn asteroids
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      asteroidTimer = 0;
      const size = rand(15, 40);
      asteroids.push({ x: rand(0, width - size), y: -size, r: size / 2, speed: rand(1.5, 3) + score * 0.001 });
      // sound for new asteroid
      beep(400, 0.08);
      // gradually increase difficulty
      asteroidInterval = Math.max(300, asteroidInterval - 5);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision
      if (circleRectCollision(a, ship)) {
        // collision sound
        beep(200, 0.2);
        gameOver = true;
      }
      // remove off‑screen (passed player, score point)
      if (a.y - a.r > height) {
        asteroids.splice(i, 1);
        score += 10;
        beep(600, 0.05);
      }
    }
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000032');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (tiny white points)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (simple triangle, bright green)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids (gray circles with subtle gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.3, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
