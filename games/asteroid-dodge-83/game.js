// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  canvas.addEventListener('click', resumeAudio);

  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Game state -----
  const ship = { x: 50, y: height / 2, w: 20, h: 10, dy: 0 };
  let fuel = 100; // seconds
  let score = 0;
  const asteroids = [];
  const fuels = [];
  let lastAsteroid = 0;
  let lastFuel = 0;

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update(dt) {
    // Ship movement (up/down)
    if (keys.ArrowUp || keys.w) ship.dy = -200;
    else if (keys.ArrowDown || keys.s) ship.dy = 200;
    else ship.dy = 0;
    ship.y += ship.dy * dt;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Fuel consumption
    fuel -= dt;
    if (fuel <= 0) gameOver();

    // Spawn asteroids
    if (performance.now() - lastAsteroid > 800) {
      lastAsteroid = performance.now();
      const size = 15 + Math.random() * 20;
      asteroids.push({ x: width + size, y: Math.random() * (height - size), r: size, speed: 100 + Math.random() * 150 });
    }
    // Spawn fuel pickups
    if (performance.now() - lastFuel > 5000) {
      lastFuel = performance.now();
      const r = 8;
      fuels.push({ x: width + r, y: Math.random() * (height - r), r, value: 20, speed: 120 });
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      if (a.x + a.r < 0) {
          asteroids.splice(i, 1);
          score++;
          // Play score beep
          beep(250, 0.1);
        }
      else if (circleRectCollision(a.x, a.y, a.r, ship.x, ship.y, ship.w, ship.h)) {
          // Play collision beep
          beep(200, 0.3);
          gameOver();
        }
    }
    // Update fuel pickups
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed * dt;
      if (f.x + f.r < 0) fuels.splice(i, 1);
      else if (circleRectCollision(f.x, f.y, f.r, ship.x, ship.y, ship.w, ship.h)) {
        // Play fuel pickup beep
        beep(400, 0.15);
        fuel = Math.min(100, fuel + f.value);
        fuels.splice(i, 1);
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel pickups as glowing stars
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.r * 0.2, f.x, f.y, f.r);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#660');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(1)}`, 10, 40);
  }

  function loop(prev) {
    const now = performance.now();
    const dt = (now - prev) / 1000;
    update(dt);
    draw();
    requestAnimationFrame(() => loop(now));
  }

  function gameOver() {
    // Play game over beep
    beep(150, 0.5);
    alert(`Game Over! Score: ${score}`);
    document.location.reload();
  }

  function circleRectCollision(cx, cy, cr, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return (dx * dx + dy * dy) < cr * cr;
  }

  requestAnimationFrame(() => loop(performance.now()));
})();
