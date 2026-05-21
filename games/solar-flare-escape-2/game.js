// Solar Flare Escape – simple canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth;
  const H = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after user interaction
  window.addEventListener('click', () => audioCtx.resume());
  window.addEventListener('keydown', () => audioCtx.resume());
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // --- Game objects ---
  const planet = { x: W / 2, y: H / 2, r: 30 };
  // generate background stars once
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  const satellite = {
    angle: 0,
    radius: 80,
    r: 8,
    shield: false,
    shieldTimer: 0,
  };
  const flares = [];
  const maxFlares = 5;

  // --- Input ---
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnFlare() {
    // start from a random side (top-left or top-right) moving diagonally down
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? 0 : W;
    const y = 0;
    const dx = side === 'left' ? 1 : -1; // move horizontally toward center
    const dy = 1; // always downwards
    flares.push({ x, y, dx, dy, r: 5, growth: 0.7, speed: 1.5 });
    // flare spawn sound
    playBeep(300, 0.07);
  }

  function update(dt) {
    // controls
    if (keys.ArrowLeft) satellite.angle -= 0.003 * dt;
    if (keys.ArrowRight) satellite.angle += 0.003 * dt;
    if (keys.ArrowUp) {
      satellite.radius = Math.min(satellite.radius + 0.1 * dt, Math.min(W, H) / 2 - 20);
      // thrust sound
      playBeep(660, 0.05);
    }
    // gradual return to default radius when not thrusting
    else satellite.radius = Math.max(satellite.radius - 0.05 * dt, 80);

    // spawn flares
    if (flares.length < maxFlares && Math.random() < 0.01) spawnFlare();

    // update flares
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.x += f.dx * f.speed;
      f.y += f.dy * f.speed;
      f.r += f.growth;
      // remove off‑screen
      if (f.x < -f.r || f.x > W + f.r || f.y > H + f.r) flares.splice(i, 1);
    }

    // shield timer
    if (satellite.shield) {
      satellite.shieldTimer -= dt;
      if (satellite.shieldTimer <= 0) satellite.shield = false;
    }

    // collision detection
    const sx = planet.x + Math.cos(satellite.angle) * satellite.radius;
    const sy = planet.y + Math.sin(satellite.angle) * satellite.radius;
    for (const f of flares) {
      const dx = sx - f.x;
      const dy = sy - f.y;
      const dist = Math.hypot(dx, dy);
        if (dist < f.r + satellite.r && !satellite.shield) {
          // collision sound
          playBeep(150, 0.3);
          // game over – simple reset
          alert('Game Over!');
          // reset state
          satellite.angle = 0;
          satellite.radius = 80;
          satellite.shield = false;
          satellite.shieldTimer = 0;
          flares.length = 0;
          break;
        }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#00081a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // orbit path
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, satellite.radius, 0, Math.PI * 2);
    ctx.stroke();
    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    planetGrad.addColorStop(0, '#999');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // satellite
    const sx = planet.x + Math.cos(satellite.angle) * satellite.radius;
    const sy = planet.y + Math.sin(satellite.angle) * satellite.radius;
    const satGrad = ctx.createRadialGradient(sx, sy, satellite.r * 0.3, sx, sy, satellite.r);
    satGrad.addColorStop(0, '#fff');
    satGrad.addColorStop(1, '#555');
    ctx.fillStyle = satellite.shield ? '#0ff' : satGrad;
    // thrust visual when up key pressed
    if (keys.ArrowUp) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,200,0,0.6)';
      ctx.beginPath();
      ctx.arc(sx - Math.cos(satellite.angle) * (satellite.r + 4), sy - Math.sin(satellite.angle) * (satellite.r + 4), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // shield halo
    if (satellite.shield) {
      ctx.save();
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(sx, sy, satellite.r + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(sx, sy, satellite.r, 0, Math.PI * 2);
    ctx.fill();
    // flares with glow
    for (const f of flares) {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,165,0,0.8)');
      grad.addColorStop(1, 'rgba(255,69,0,0)');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,140,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
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
