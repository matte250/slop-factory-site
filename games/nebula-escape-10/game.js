// Simple Nebula Escape prototype
// Canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game State -----
  const ship = { x: width/2, y: height-60, angle: 0, speed: 0, fuel: 100 };
  const keys = {};
  const asteroids = [];
  const powerUps = [];
  let lastAsteroid = 0, lastPower = 0, startTime = performance.now(), gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let lastThrustSound = 0;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Helpers -----
  function spawnAsteroid() {
    const size = Math.random()*30 + 20;
    const x = Math.random()*width;
    const y = -size;
    const speed = Math.random()*1.5 + 0.5;
    asteroids.push({x, y, size, speed});
  }
  function spawnPower() {
    const x = Math.random()*width;
    const y = -20;
    const speed = 1;
    powerUps.push({x, y, size: 12, speed, collected:false});
  }
  function rectCircleCollide(cx, cy, r, ax, ay, as) {
    // Simple distance check for ship (triangle approximated as circle)
    const dx = cx - ax, dy = cy - ay;
    return Math.hypot(dx, dy) < r + as;
  }

  // ----- Game Loop -----
  function update(dt) {
    if (gameOver) return;
    // Fuel consumption
    ship.fuel -= dt * 0.01; // lose fuel over time
    if (ship.fuel <= 0) { ship.fuel = 0; gameOver = true; }
    // Input handling
    if (keys.ArrowLeft || keys.a) ship.angle -= 0.08;
    if (keys.ArrowRight || keys.d) ship.angle += 0.08;
    if (keys.ArrowUp || keys.w) {
    ship.speed = Math.min(ship.speed+0.02, 3);
    if (performance.now() - lastThrustSound > 100) {
      playTone(200, 0.05);
      lastThrustSound = performance.now();
    }
  } else {
    ship.speed = Math.max(ship.speed-0.01, 0);
  }
    // Move ship
    ship.x += Math.sin(ship.angle) * ship.speed;
    ship.y -= Math.cos(ship.angle) * ship.speed;
    // Keep inside bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // Asteroids
    const now = performance.now();
    if (now - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = now; }
    asteroids.forEach(a => { a.y += a.speed; });
    // Remove off‑screen
    for (let i = asteroids.length-1; i>=0; i--) if (asteroids[i].y - asteroids[i].size > height) asteroids.splice(i,1);
    // Collision ship‑asteroid
    for (const a of asteroids) {
      if (rectCircleCollide(ship.x, ship.y, 12, a.x, a.y, a.size)) { playTone(100, 0.2); gameOver = true; break; }
    }

    // Power‑ups
    if (now - lastPower > 5000) { spawnPower(); lastPower = now; }
    powerUps.forEach(p => { p.y += p.speed; });
    for (let i = powerUps.length-1; i>=0; i--) {
      const p = powerUps[i];
      if (p.y - p.size > height) { powerUps.splice(i,1); continue; }
if (!p.collected && rectCircleCollide(ship.x, ship.y, 12, p.x, p.y, p.size)) {
      ship.fuel = Math.min(ship.fuel + 30, 100);
      playTone(400, 0.1);
      p.collected = true;
      powerUps.splice(i,1);
    }
    }
  }

  function draw() {
    // Background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020214');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Nebula stars with twinkling effect
    ctx.fillStyle = '#55a';
    for (let i = 0; i < 40; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sr = Math.random() * 2 + 0.5;
      const alpha = 0.5 + Math.random() * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Ship with glow and thrust
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Glow effect
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(8, 12);
    ctx.lineTo(-8, 12);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when accelerating
    if (keys.ArrowUp || keys.w) {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(5, 22);
      ctx.lineTo(-5, 22);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.shadowBlur = 0; // reset

    // Asteroids with radial shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.3, a.x, a.y, a.size);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill();
    });

    // Power‑ups pulsing glow
    powerUps.forEach(p => {
      const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
      const grad = ctx.createRadialGradient(p.x, p.y, p.size * 0.3, p.x, p.y, p.size * pulse);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#880');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });

    // HUD – fuel bar and time
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    // Fuel bar
    const barWidth = 100, barHeight = 8;
    ctx.fillRect(10, 10, barWidth, barHeight);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, (ship.fuel / 100) * barWidth, barHeight);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, barWidth, barHeight);
    // Time
    ctx.fillStyle = '#fff';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText('Time: ' + seconds + 's', 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(ts) {
    const dt = ts - (loop.last ?? ts);
    loop.last = ts;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
