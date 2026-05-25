// Simple Asteroid Dodger game
// Canvas must exist with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context and simple sound generators
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playHit() { beep(200, 150); }
  function playPower() { beep(800, 120); }
  function playGameOver() { beep(100, 500); }

  // Ship
  const ship = { w: 40, h: 20, x: width / 2, y: height - 30, speed: 5, shield: 0 };
  // Stars background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1 });
  }

  // Game state
  const asteroids = [];
  const powerUps = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastPower = 0;
  let running = true;

  // Input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, vy: 2 + Math.random() * 3 });
  }

  function spawnPower() {
    const size = 15;
    powerUps.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, vy: 2 });
  }

  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids every ~1s
    if (performance.now() - lastAsteroid > 1000) { spawnAsteroid(); lastAsteroid = performance.now(); }
    // Spawn power‑up every ~7s
    if (performance.now() - lastPower > 7000) { spawnPower(); lastPower = performance.now(); }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      if (a.y > height) { asteroids.splice(i, 1); score++; }
      else if (rectCollide(a, ship)) {
        if (ship.shield > 0) { asteroids.splice(i, 1); score++; playHit(); }
        else { running = false; playGameOver(); }
      }
    }

    // Update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.vy;
      if (p.y > height) { powerUps.splice(i, 1); }
      else if (rectCollide(p, ship)) { ship.shield = 3000; powerUps.splice(i, 1); playPower(); }
    }

    // Shield timer
    if (ship.shield > 0) ship.shield -= dt;
  }

  function draw() {
    // Space background
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // Ship (triangle)
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.fillStyle = ship.shield > 0 ? '#00ffff' : '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Power‑ups as rotating stars
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(performance.now() / 500);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      const spikes = 5;
      const outer = p.w / 2;
      const inner = outer / 2;
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const a = (i * Math.PI) / spikes;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // Score
    ctx.fillStyle = '#00ff00';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (ship.shield > 0) ctx.fillText('Shield', 10, 40);
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
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }
  requestAnimationFrame(loop);
})();
