// Simple "Asteroid Skimmer" game targeting <canvas id="game">.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // Audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playSound = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Game state
  const ship = { x: W / 2, y: H - 40, w: 60, h: 20, speed: 5 };
  let shield = 3, score = 0, running = true;
  const keys = {};
  const orbs = [];
  const asteroids = [];
  // Star field for background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Input handling
  // Ensure AudioContext is resumed on first user interaction
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Utility
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  const spawnOrb = () => {
    orbs.push({ x: rand(20, W - 20), y: -20, r: 10, vy: 2 });
  };
  const spawnAsteroid = () => {
    asteroids.push({ x: rand(20, W - 20), y: -30, r: 15, vy: 3 });
  };

  // Collision detection (circle-rect)
  const hitShip = (obj) => {
    const cx = obj.x, cy = obj.y, r = obj.r;
    const rx = ship.x - ship.w / 2, ry = ship.y - ship.h / 2;
    const nearestX = Math.max(rx, Math.min(cx, rx + ship.w));
    const nearestY = Math.max(ry, Math.min(cy, ry + ship.h));
    return dist(cx, cy, nearestX, nearestY) < r;
  };

  // Main loop
  const update = () => {
    if (!running) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(W - ship.w / 2, ship.x));

    // Update objects
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.vy;
        if (hitShip(o)) { score++; playSound(440, 0.08); orbs.splice(i, 1); }
        else if (o.y - o.r > H) orbs.splice(i, 1);

    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
        if (hitShip(a)) { shield--; playSound(220, 0.2); asteroids.splice(i, 1); }
      else if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Drawing
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); });
    // Ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();
    // Orbs with radial gradient
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      grad.addColorStop(0, 'yellow');
      grad.addColorStop(1, 'gold');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shield: ${shield}`, 10, 40);

    if (shield <= 0) {
      running = false;
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('GAME OVER', W / 2 - 150, H / 2);
      return;
    }

    requestAnimationFrame(update);
  };

  // Spawn intervals
  const orbInterval = setInterval(spawnOrb, 1500);
  const astInterval = setInterval(spawnAsteroid, 2000);
  // Start
  requestAnimationFrame(update);
})();
