// Simple Cosmic Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ----- State -----
  const ship = { x: W * 0.2, y: H / 2, r: 12, vx: 0, vy: 0 };
  const asteroids = [];
  const fuels = [];
  let timer = 60; // seconds
  let lastSpawn = 0;
  let lastFuel = 0;
  let lastTick = performance.now();
  let running = true;

  // ----- Input -----
  const keys = {};
  let audioStarted = false;
  const resumeAudio = () => {
    if (!audioStarted) {
      audioCtx.resume();
      audioStarted = true;
    }
  };
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => keys[e.key] = false);
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.y = e.clientY - rect.top;
    resumeAudio();
  });

  // ----- Helpers -----
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

  // ----- Game loop -----
  function loop(now) {
    const dt = (now - lastTick) / 1000; // seconds
    lastTick = now;
    if (!running) return;

    // timer
    timer -= dt;
    if (timer <= 0) running = false;

    // ship control (arrow keys affect vertical velocity)
    if (keys.ArrowUp) ship.vy -= 200 * dt;
    if (keys.ArrowDown) ship.vy += 200 * dt;
    ship.vy *= 0.95; // damping
    ship.y += ship.vy * dt;
    ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y));

    // spawn asteroids
    if (now - lastSpawn > 800) { // ms
      lastSpawn = now;
      const size = rand(15, 40);
      asteroids.push({ x: W + size, y: rand(size, H - size), r: size, vx: -rand(100, 250) });
    }
    // spawn fuel
    if (now - lastFuel > 3000) {
      lastFuel = now;
      const size = 8;
      fuels.push({ x: W + size, y: rand(size, H - size), r: size, vx: -150 });
    }

    // update asteroids and fuels
    asteroids.forEach(a => a.x += a.vx * dt);
    fuels.forEach(f => f.x += f.vx * dt);

    // collision detection
    for (const a of asteroids) {
      if (dist2(ship, a) < (ship.r + a.r) ** 2) {
        playSound(120, 0.3); // crash
        running = false; break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (dist2(ship, f) < (ship.r + f.r) ** 2) {
        timer += 5; // add time
        playSound(400, 0.15); // fuel collect
        fuels.splice(i, 1);
      } else if (f.x + f.r < 0) {
        fuels.splice(i, 1);
      }
    }
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].x + asteroids[i].r < 0) asteroids.splice(i, 1);
    }

    // ----- Render -----
    // space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // stars (pre‑generated moving background)
    if (!ctx.stars) {
      ctx.stars = [];
      for (let i = 0; i < 100; i++) {
        ctx.stars.push({ x: rand(0, W), y: rand(0, H), size: rand(0.5, 1.5) });
      }
    }
    ctx.fillStyle = '#555';
    ctx.stars.forEach(s => {
      s.x -= 30 * dt; // slow parallax
      if (s.x < 0) { s.x = W; s.y = rand(0, H); }
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // ship (triangle with gradient and glow)
    ctx.save();
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.r/4, ship.x, ship.y, ship.r);
    shipGrad.addColorStop(0, '#6f6');
    shipGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y - ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids (shaded with radial gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuels (glowing orbs)
    ctx.save();
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 12;
    fuels.forEach(f => {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // timer text
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Time: ' + Math.max(0, timer).toFixed(1), 10, 30);

    if (running) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '40px sans-serif';
      ctx.fillText('Game Over', W / 2 - 100, H / 2);
    }
  }

  requestAnimationFrame(loop);
})();
