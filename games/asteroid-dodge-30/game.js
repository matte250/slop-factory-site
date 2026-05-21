// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Ensure context is resumed on first user interaction
  function unlockAudio() { audioCtx.resume(); window.removeEventListener('keydown', unlockAudio); }
  window.addEventListener('keydown', unlockAudio);

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Game objects
  const ship = { x: canvas.width / 2, y: canvas.height - 60, w: 40, h: 20, speed: 5 };
  const asteroids = [];
  const powerUps = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastPower = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      // Play thrust sound on movement keys
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        playBeep(400, 0.05);
      }
    }
  });
  addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      size,
      speed: 2 + Math.random() * 3,
      angle: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.04,
    });
  }

  function spawnPowerUp() {
    const radius = 10;
    powerUps.push({ x: Math.random() * (canvas.width - radius * 2), y: -radius, radius, speed: 1.5 });
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = performance.now(); }
    // Spawn power‑ups occasionally
    if (performance.now() - lastPower > 5000) { spawnPowerUp(); lastPower = performance.now(); }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.rotationSpeed; // rotate
      // Collision with ship
        if (a.x < ship.x + ship.w && a.x + a.size > ship.x && a.y < ship.y + ship.h && a.y + a.size > ship.y) {
          playBeep(100, 0.3); // collision sound
          gameOver = true;
        }
      // Remove off‑screen
      if (a.y > canvas.height) { asteroids.splice(i, 1); score++; }
    }

    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      // Simple collection
      if (p.x < ship.x + ship.w && p.x + p.radius * 2 > ship.x && p.y < ship.y + ship.h && p.y + p.radius * 2 > ship.y) {
        score += 5; // reward
        powerUps.splice(i, 1);
        continue;
      }
      if (p.y > canvas.height) powerUps.splice(i, 1);
    }
  }

  function draw() {
    // Clear with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001'); // dark navy
    bgGrad.addColorStop(1, '#000'); // black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars background (moving)
    // Initialize stars once
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 80; i++) {
        window._stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 0.5,
        });
      }
    }
    ctx.fillStyle = '#222';
    window._stars.forEach(s => {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
      ctx.fillRect(s.x, s.y, 1, 1);
    });

    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.lineTo(ship.x - ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when moving
    if (keys.ArrowLeft || keys.ArrowRight) {
      ctx.fillStyle = '#f80';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h + 15);
      ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h + 15);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids (rotating squares)
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle || 0);
      ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size);
      ctx.restore();
    });

    // Power‑ups (pulsing circles)
    ctx.fillStyle = '#ff0';
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(
        p.x + p.radius,
        p.y + p.radius,
        p.radius * 0.2,
        p.x + p.radius,
        p.y + p.radius,
        p.radius
      );
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#ff0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + p.radius, p.y + p.radius, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
