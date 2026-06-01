// Orbit Dodge game implementation
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  // Create starfield background
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(400, 100); }
  function playSpawn() { playTone(200, 80); }
  function playExplosion() { playTone(100, 500); }
  // Simple background hum
  setInterval(() => { playTone(60, 2000); }, 5000);
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);
  const center = { x: width / 2, y: height / 2 };
  const orbitRadius = Math.min(width, height) * 0.25;
  const shipSize = 12;
  const asteroidRadius = 15;
  const shipTurnSpeed = 0.003; // rad per ms
  const asteroidSpeed = 0.09; // pixels per ms
  const spawnInterval = 1500; // ms

  let angle = 0; // ship angle around planet
  let fuel = 100; // starts full
  let score = 0;
  let lastTime = performance.now();
  let lastSpawn = 0;
  let asteroids = [];
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playThrust();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    // random size and rotation speed
    const size = asteroidRadius * (0.5 + Math.random() * 0.7);
    const rotSpeed = (Math.random() - 0.5) * 0.001; // rad per ms
    const a = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + size;
    asteroids.push({ angle: a, dist: distance, size, rot: 0, rotSpeed });
    playSpawn();
    // random size and rotation speed
    const size = asteroidRadius * (0.5 + Math.random() * 0.7);
    const rotSpeed = (Math.random() - 0.5) * 0.001; // rad per ms
    const a = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + size;
    asteroids.push({ angle: a, dist: distance, size, rot: 0, rotSpeed });
  }
    const a = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + asteroidRadius;
    asteroids.push({ angle: a, dist: distance });
  }

  function update(dt) {
    // rotate asteroids
    asteroids.forEach(a => {
      a.rot += a.rotSpeed * dt;
    });
    // ship rotation
    if (keys.ArrowLeft) angle -= shipTurnSpeed * dt;
    if (keys.ArrowRight) angle += shipTurnSpeed * dt;
    // keep angle in [0, 2π)
    angle = (angle + Math.PI * 2) % (Math.PI * 2);

    // fuel consumption
    fuel -= dt * 0.02; // depletes over ~5000ms to zero
    if (fuel <= 0) fuel = 0;

    // spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids toward center
    asteroids.forEach(a => {
      a.dist -= asteroidSpeed * dt;
    });
    // remove passed asteroids
    asteroids = asteroids.filter(a => a.dist > 0);

    // collision detection
    const shipX = center.x + Math.cos(angle) * orbitRadius;
    const shipY = center.y + Math.sin(angle) * orbitRadius;
    for (const a of asteroids) {
      const ax = center.x + Math.cos(a.angle) * a.dist;
      const ay = center.y + Math.sin(a.angle) * a.dist;
      const dx = ax - shipX;
      const dy = ay - shipY;
      const dist = Math.hypot(dx, dy);
      if (dist < shipSize + a.size) {
        running = false;
        break;
      }
    }

    // score based on survival time
    score += dt / 1000;
  }

  function draw() {
    // Draw semi‑transparent background for motion blur
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // background cleared with motion blur rectangle
    // planet
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(center.x, center.y, orbitRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    // ship (triangle)
    const shipX = center.x + Math.cos(angle) * orbitRadius;
    const shipY = center.y + Math.sin(angle) * orbitRadius;
    ctx.fillStyle = '#00ff00';
    ctx.save();
    ctx.translate(shipX, shipY);
    ctx.rotate(angle + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -shipSize);
    ctx.lineTo(shipSize / 2, shipSize / 2);
    ctx.lineTo(-shipSize / 2, shipSize / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids (rotating rocks)
    for (const a of asteroids) {
      const ax = center.x + Math.cos(a.angle) * a.dist;
      const ay = center.y + Math.sin(a.angle) * a.dist;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(a.rot);
      // asteroid gradient
      const grad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size);
      grad.addColorStop(0, '#ff9999');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(score)}`, width / 2, height / 2 + 40);
    }
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
