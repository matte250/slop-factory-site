// Simple top‑down endless runner for canvas id="game"
// Ship avoids drifting asteroids, collects stars, score rises over time.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 60,
    w: 30,
    h: 30,
    speed: 4,
    dx: 0,
    dy: 0,
    color: '#0f0',
  };

  // Background stars (tiny points moving down)
  const stars = [];
  const maxStars = 100;

  // Asteroids (simple circles)
  const asteroids = [];
  const asteroidSpawnInterval = 1200; // ms
  let lastAsteroidTime = 0;

  let score = 0;
  let running = true;

  // Input handling and sound effects
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      oscillator.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  // Additional sound cues
  function playCrash() {
    // Low rumble for collision or out‑of‑bounds
    playTone(150, 200);
  }
  function playGameOver() {
    // Descending tone sequence
    const notes = [300, 250, 200];
    let delay = 0;
    notes.forEach(f => {
      setTimeout(() => playTone(f, 150), delay);
      delay += 180;
    });
  }
  window.addEventListener('keydown', e => {
    // Ensure audio context is running after a user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!keys[e.key]) {
      // Play thrust sound on first press
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)) {
        playTone(400, 100);
      }
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnStar() {
    stars.push({
      x: Math.random() * width,
      y: 0,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2,
    });
  }

  function spawnAsteroid() {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const y = -radius;
    const speedY = Math.random() * 2 + 1;
    const speedX = (Math.random() - 0.5) * 2; // slight drift
    asteroids.push({ x, y, radius, speedX, speedY });
  }

  function update(dt) {
    // Ship movement
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    ship.x += ship.dx;
    ship.y += ship.dy;

    // Keep ship within canvas – off‑screen ends game
    if (ship.x < 0 || ship.x + ship.w > width || ship.y < 0 || ship.y + ship.h > height) {
      playCrash();
      running = false;
    }

    // Update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) stars.splice(i, 1);
    }
    while (stars.length < maxStars) spawnStar();

    // Spawn asteroids
    if (performance.now() - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = performance.now();
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.speedX;
      a.y += a.speedY;
      // Remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection (circle-rect)
    for (const a of asteroids) {
      const cx = a.x;
      const cy = a.y;
      const r = a.radius;
      const nearestX = Math.max(ship.x, Math.min(cx, ship.x + ship.w));
      const nearestY = Math.max(ship.y, Math.min(cy, ship.y + ship.h));
      const dx = cx - nearestX;
      const dy = cy - nearestY;
        if (dx * dx + dy * dy < r * r) {
          playCrash();
          running = false;
          break;
        }
    }

    // Score increases over time
    score += dt * 0.01;
  }

  function draw() {
    // Clear canvas with dark space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw star field with twinkling effect (varying opacity)
    for (const s of stars) {
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with stroke outline for depth
    ctx.fillStyle = ship.color;
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw asteroids with radial gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#b5651d');
      grad.addColorStop(1, '#331a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score with neon glow effect
    ctx.fillStyle = '#0ff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.shadowBlur = 0; // reset
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      playGameOver();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.fillText('Score: ' + Math.floor(score), width / 2, height / 2 + 20);
    }
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
