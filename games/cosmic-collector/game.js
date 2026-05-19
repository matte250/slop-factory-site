// Cosmic Collector – enhanced graphics
// Targets <canvas id="game">.
// Ship (arrow keys) collects orbs, avoids asteroids.
// 60‑sec timer or collision ends game.
// Added starfield background, gradient visuals.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }

  const width = canvas.width;
  const height = canvas.height;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 50,
    radius: 12,
    speed: 4,
    color: '#0ff',
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Game objects
  const orbs = [];
  const asteroids = [];

  const state = {
    score: 0,
    timeLeft: 60, // seconds
    lastTime: performance.now(),
    gameOver: false,
  };

  // Utility functions
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function spawnOrb() {
    orbs.push({
      x: rand(20, width - 20),
      y: -20,
      radius: 8,
      speed: 1.5,
      color: '#ff0',
    });
  }

  function spawnAsteroid() {
    const size = rand(15, 30);
    asteroids.push({
      x: rand(size, width - size),
      y: -size,
      radius: size,
      speed: rand(2, 4),
      color: '#888',
    });
  }

  function update(dt) {
    if (state.gameOver) return;

    // Move ship based on input
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Update stars (parallax background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speed;
      // Collision with ship
      if (dist(o, ship) < o.radius + ship.radius) {
        state.score++;
        // Play collect sound
        playTone(660, 100);
        orbs.splice(i, 1);
        continue;
      }
      // Remove if off screen
      if (o.y - o.radius > height) orbs.splice(i, 1);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship ends game
      if (dist(a, ship) < a.radius + ship.radius) {
        // Play crash sound
        playTone(220, 300);
        state.gameOver = true;
        break;
      }
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Timer
    state.timeLeft -= dt / 1000;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      state.gameOver = true;
    }
  }

  function draw() {
    // Clear with dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = 0.8 + Math.random() * 0.2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw ship (triangle with gradient)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y - ship.radius, ship.x, ship.y + ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // Draw orbs with radial gradient
    for (const o of orbs) {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      orbGrad.addColorStop(0, '#ff0');
      orbGrad.addColorStop(1, '#aa0');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with textured gradient
    for (const a of asteroids) {
      const astGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      astGrad.addColorStop(0, '#555');
      astGrad.addColorStop(1, '#111');
      ctx.fillStyle = astGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Time: ${Math.ceil(state.timeLeft)}`, 10, 40);
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText(`Score: ${state.score}`, width / 2, height / 2 + 40);
    }
  }

  // Main loop
  function loop(timestamp) {
    const dt = timestamp - state.lastTime;
    state.lastTime = timestamp;
    update(dt);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  }

  // Spawn intervals
  setInterval(spawnOrb, 1000);
  setInterval(spawnAsteroid, 2000);

  // Start
  requestAnimationFrame(loop);
})();
