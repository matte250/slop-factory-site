// Simple "Cosmic Courier" game for a canvas with id="game"
// Ship, scrolling stars, crates, stations, asteroids, fuel & score.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  };

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ---- Game state ------------------------------------------------
  const state = {
    ship: { x: width / 2, y: height - 60, w: 30, h: 30, vx: 0, vy: 0, speed: 2, fuel: 100, lives: 3, hasCargo: false },
    stars: [],
    crates: [],
    stations: [],
    asteroids: [],
    score: 0,
    keys: {},
    lastSpawn: 0,
  };

  // ---- Helpers ---------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollide = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // ---- Initialize stars -----------------------------------------
  for (let i = 0; i < 100; i++) {
    state.stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2), speed: rand(0.2, 0.6) });
  }

  // ---- Input -----------------------------------------------------
  window.addEventListener('keydown', e => state.keys[e.key] = true);
  window.addEventListener('keyup', e => state.keys[e.key] = false);

  // ---- Game loop -------------------------------------------------
  function update(dt) {
    // Move ship based on keys
    if (state.keys['ArrowLeft']) state.ship.vx = -state.ship.speed;
    else if (state.keys['ArrowRight']) state.ship.vx = state.ship.speed;
    else state.ship.vx = 0;
    if (state.keys['ArrowUp']) state.ship.vy = -state.ship.speed;
    else if (state.keys['ArrowDown']) state.ship.vy = state.ship.speed;
    else state.ship.vy = 0;

    state.ship.x = Math.max(0, Math.min(width - state.ship.w, state.ship.x + state.ship.vx));
    state.ship.y = Math.max(0, Math.min(height - state.ship.h, state.ship.y + state.ship.vy));

    // Fuel consumption
    state.ship.fuel -= 0.02 * dt;
    if (state.ship.fuel <= 0) state.ship.fuel = 0;

    // Move stars for scrolling background
    for (const s of state.stars) {
      s.y += s.speed * dt * 0.1;
      if (s.y > height) { s.y = 0; s.x = rand(0, width); }
    }

    // Spawn crates, stations, asteroids periodically
    const now = performance.now();
    if (now - state.lastSpawn > 2000) {
      // crate
      state.crates.push({ x: rand(0, width - 20), y: -20, w: 20, h: 20, vy: 1.5 });
      // station (moves horizontally at top)
      const dir = Math.random() < 0.5 ? -1 : 1;
      state.stations.push({ x: dir === 1 ? -50 : width + 50, y: rand(30, 100), w: 60, h: 30, vx: dir * 0.5 });
      // asteroid
      state.asteroids.push({ x: rand(0, width - 30), y: -30, w: 30, h: 30, vy: 2 + Math.random() * 1 });
      state.lastSpawn = now;
    }

    // Update crates
    for (let i = state.crates.length - 1; i >= 0; i--) {
      const c = state.crates[i];
      c.y += c.vy * dt * 0.05;
      // collect
      if (!state.ship.hasCargo && rectCollide(state.ship, c)) {
        state.ship.hasCargo = true;
        playTone(800, 120);
        state.crates.splice(i, 1);
        continue;
      }
      // out of screen
      if (c.y > height) state.crates.splice(i, 1);
    }

    // Update stations
    for (let i = state.stations.length - 1; i >= 0; i--) {
      const s = state.stations[i];
      s.x += s.vx * dt * 0.05;
      // wrap
      if (s.vx > 0 && s.x > width + 50) s.x = -50;
      if (s.vx < 0 && s.x < -50) s.x = width + 50;
      // drop cargo
      if (state.ship.hasCargo && rectCollide(state.ship, s)) {
        state.ship.hasCargo = false;
        state.ship.fuel = Math.min(100, state.ship.fuel + 10);
        state.score += 10;
        playTone(600, 150);
      }
    }

    // Update asteroids
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      a.y += a.vy * dt * 0.05;
      if (rectCollide(state.ship, a)) {
        playTone(300, 200);
        state.asteroids.splice(i, 1);
        state.ship.lives -= 1;
        if (state.ship.lives <= 0) {
          // game over
          playTone(100, 500);
          alert('Game Over! Score: ' + state.score);
          document.location.reload();
          return;
        }
        continue;
      }

      }
      if (a.y > height) state.asteroids.splice(i, 1);
    }

    // Fuel out -> game over
    if (state.ship.fuel <= 0) {
      alert('Out of fuel! Score: ' + state.score);
      document.location.reload();
      return;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling circles)
    for (const s of state.stars) {
      ctx.fillStyle = `rgba(255,255,255,${0.5 + s.size / 4})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(state.ship.x + state.ship.w / 2, state.ship.y);
    ctx.lineTo(state.ship.x, state.ship.y + state.ship.h);
    ctx.lineTo(state.ship.x + state.ship.w, state.ship.y + state.ship.h);
    ctx.closePath();
    ctx.fill();
    // cargo indicator (glowing circle)
    if (state.ship.hasCargo) {
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(state.ship.x + state.ship.w / 2, state.ship.y - 8, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // crates (green squares with gradient)
    for (const c of state.crates) {
      const grad = ctx.createLinearGradient(c.x, c.y, c.x + c.w, c.y + c.h);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.fillRect(c.x, c.y, c.w, c.h);
    }
    // stations (purple platforms with windows)
    for (const s of state.stations) {
      ctx.fillStyle = '#7d3';
      ctx.fillRect(s.x, s.y, s.w, s.h);
      // windows
      ctx.fillStyle = '#222';
      const winW = s.w / 5;
      const winH = s.h / 2;
      const gap = winW / 2;
      for (let i = 0; i < 3; i++) {
        const wx = s.x + gap + i * (winW + gap);
        const wy = s.y + (s.h - winH) / 2;
        ctx.fillRect(wx, wy, winW, winH);
      }
    }
    // asteroids (gray circles with slight shading)
    for (const a of state.asteroids) {
      const rad = a.w / 2;
      const grad = ctx.createRadialGradient(a.x + rad, a.y + rad, rad / 4, a.x + rad, a.y + rad, rad);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + rad, a.y + rad, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Score: ' + state.score, 10, 20);
    ctx.fillText('Fuel: ' + Math.round(state.ship.fuel), 10, 38);
    ctx.fillText('Lives: ' + state.ship.lives, 10, 56);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
