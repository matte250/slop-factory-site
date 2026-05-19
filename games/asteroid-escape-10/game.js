// Minimal Asteroid Escape game – improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup – simple tones for events
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Game state – added stars for moving background and rotation for asteroids
  const state = {
    ship: { x: 80, y: canvas.height / 2, size: 12 },
    asteroids: [],
    fuels: [],
    stars: [],
    keys: {},
    fuel: 100,
    score: 0,
    lastAsteroid: 0,
    lastFuel: 0,
    gameOver: false,
    startTime: performance.now(),
  };

  // Initialise starfield
  for (let i = 0; i < 100; i++) {
    state.stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    state.keys[e.code] = true;
    // Resume audio context on first user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    // Play thrust sound on movement keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
      playTone(400, 0.08);
    }
  });
  window.addEventListener('keyup', e => (state.keys[e.code] = false));

  const random = (min, max) => Math.random() * (max - min) + min;

  const spawnAsteroid = () => {
    const size = random(15, 30);
    state.asteroids.push({
      x: canvas.width + size,
      y: random(size, canvas.height - size),
      r: size,
      speed: random(2, 5),
      angle: random(0, Math.PI * 2),
      angularSpeed: random(-0.5, 0.5),
    });
  };

  const spawnFuel = () => {
    const size = 12;
    state.fuels.push({
      x: canvas.width + size,
      y: random(size, canvas.height - size),
      r: size / 2,
      speed: 3,
    });
  };

  const update = (dt) => {
    if (state.gameOver) return;
    // Ship movement
    const s = state.ship;
    const speed = 200;
    if (state.keys['ArrowUp']) s.y -= speed * dt;
    if (state.keys['ArrowDown']) s.y += speed * dt;
    if (state.keys['ArrowLeft']) s.x -= speed * dt;
    if (state.keys['ArrowRight']) s.x += speed * dt;
    s.x = Math.max(0, Math.min(canvas.width, s.x));
    s.y = Math.max(0, Math.min(canvas.height, s.y));

    // Spawn entities
    if (performance.now() - state.lastAsteroid > 1000) { spawnAsteroid(); state.lastAsteroid = performance.now(); }
    if (performance.now() - state.lastFuel > 3000) { spawnFuel(); state.lastFuel = performance.now(); }

    // Update asteroids and apply rotation
    state.asteroids.forEach(a => { a.x -= a.speed; a.angle += a.angularSpeed * dt; });
    state.fuels.forEach(f => f.x -= f.speed);
    // Remove off‑screen objects
    state.asteroids = state.asteroids.filter(a => a.x + a.r > 0);
    state.fuels = state.fuels.filter(f => f.x + f.r > 0);

    // Update starfield – move downwards to simulate forward motion
    state.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });

    // Collision detection
    const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);
    for (const a of state.asteroids) {
      if (dist(s.x, s.y, a.x, a.y) < a.r + s.size) { playTone(150, 0.4); state.gameOver = true; break; }
    }
    for (let i = state.fuels.length - 1; i >= 0; i--) {
      const f = state.fuels[i];
      if (dist(s.x, s.y, f.x, f.y) < f.r + s.size) { state.fuel = Math.min(100, state.fuel + 20); state.fuels.splice(i, 1); }
    }

    // Fuel consumption
    state.fuel -= dt * 5;
    if (state.fuel <= 0) state.gameOver = true;

    // Scoring – time based
    state.score = Math.floor((performance.now() - state.startTime) / 100);
  };

  // Draw ship with a subtle thrust flare when moving
  const drawShip = () => {
    const { x, y, size } = state.ship;
    // Ship body – neon green
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
    // Thrust flame (if any movement key pressed)
    if (state.keys['ArrowUp'] || state.keys['ArrowDown'] || state.keys['ArrowLeft'] || state.keys['ArrowRight']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(x, y + size);
      ctx.lineTo(x - size / 2, y + size + 10);
      ctx.lineTo(x + size / 2, y + size + 10);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Draw rotating asteroid – simple polygon for visual interest
  const drawAsteroid = (a) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.fillStyle = '#777';
    ctx.beginPath();
    // draw a rough 5‑point shape
    const spikes = 5;
    const step = (Math.PI * 2) / spikes;
    for (let i = 0; i < spikes; i++) {
      const outerX = Math.cos(i * step) * a.r;
      const outerY = Math.sin(i * step) * a.r;
      const innerX = Math.cos(i * step + step / 2) * (a.r * 0.6);
      const innerY = Math.sin(i * step + step / 2) * (a.r * 0.6);
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Draw fuel canister – bright yellow with a simple rectangle shape
  const drawFuel = (f) => {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(-f.r, -f.r, f.r * 2, f.r * 2);
    ctx.restore();
  };

  const draw = () => {
    // Gradient background
    const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grd.addColorStop(0, '#001');
    grd.addColorStop(1, '#003');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Starfield – white speckles with slight glow
    ctx.fillStyle = '#fff';
    state.stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    drawShip();
    state.asteroids.forEach(drawAsteroid);
    state.fuels.forEach(drawFuel);

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(state.fuel))}%`, 10, 40);

    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
