// Simple Starship Salvage game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // ----- Game objects -----
  const ship = {
    x: width / 2,
    y: height - 60,
    r: 12,
    speed: 2,
    fuel: 100,
    dx: 0,
    dy: 0,
  };

  const asteroids = [];
  const crates = [];
  const stars = [];

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const spawnAsteroid = () => {
    const size = rand(8, 20);
    asteroids.push({
      x: rand(size, width - size),
      y: -size,
      r: size,
      vx: rand(-1, 1),
      vy: rand(0.5, 1.5),
    });
  };

  const spawnCrate = () => {
    const size = 8;
    crates.push({
      x: rand(size, width - size),
      y: -size,
      r: size,
      vy: rand(0.5, 1),
    });
  };

  const drawStarfield = () => {
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Twinkling stars
    for (let i = 0; i < 80; i++) {
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = rand(0.2, 0.9);
      const s = rand(0.5, 1.5);
      ctx.fillRect(rand(0, width), rand(0, height), s, s);
    }
    ctx.globalAlpha = 1;
  };

  const drawShip = () => {
    // Ship with gradient and subtle glow
    const grad = ctx.createRadialGradient(0, 0, ship.r * 0.2, 0, 0, ship.r);
    grad.addColorStop(0, '#6f6');
    grad.addColorStop(1, '#0a0');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(ship.dy, ship.dx) + Math.PI / 2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fill();
    // outer glow
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // Draw generic circle (used for simple objects)
  const drawCircle = (obj, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw asteroid with radial gradient and slight rotation
  const drawAsteroid = (a) => {
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#b55');
    grad.addColorStop(1, '#522');
    ctx.fillStyle = grad;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.vx * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, a.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Draw crate as shiny gold box
  const drawCrate = (c) => {
    const grad = ctx.createLinearGradient(c.x - c.r, c.y - c.r, c.x + c.r, c.y + c.r);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, '#aa0');
    ctx.fillStyle = grad;
    ctx.fillRect(c.x - c.r, c.y - c.r, c.r * 2, c.r * 2);
  };

  const update = () => {
    // Move ship
    ship.x += ship.dx * ship.speed;
    ship.y += ship.dy * ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));

    // fuel consumption
    ship.fuel -= 0.02;
    if (ship.fuel <= 0) ship.fuel = 0;

    // update asteroids
    asteroids.forEach((a) => {
      a.x += a.vx;
      a.y += a.vy;
    });
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y - asteroids[i].r > height) asteroids.splice(i, 1);
    }

    // update crates
    crates.forEach((c) => (c.y += c.vy));
    for (let i = crates.length - 1; i >= 0; i--) {
      if (crates[i].y - crates[i].r > height) crates.splice(i, 1);
    }

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (dist(ship, asteroids[i]) < ship.r + asteroids[i].r) {
        gameOver();
        return;
      }
    }
    for (let i = crates.length - 1; i >= 0; i--) {
        if (dist(ship, crates[i]) < ship.r + crates[i].r) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        crates.splice(i, 1);
        // play collection sound
        playBeep(800, 0.1);
      }
    }
  };

  let animationId;
  const gameOver = () => {
    // collision sound
    playBeep(200, 0.3);
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  };

  const loop = () => {
    drawStarfield();
    drawShip();
    asteroids.forEach(drawAsteroid);
    crates.forEach(drawCrate);

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 60, 20);

    update();
    animationId = requestAnimationFrame(loop);
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => (keys[e.code] = false));
  // Thrust sound control
  let lastThrust = 0;
  const thrustInterval = 200; // ms between thrust sounds

  const handleInput = () => {
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -1;
    if (keys.ArrowRight) ship.dx = 1;
    if (keys.ArrowUp) ship.dy = -1;
    if (keys.ArrowDown) ship.dy = 1;
    // Play thrust beep if moving
    if (ship.dx !== 0 || ship.dy !== 0) {
      const now = performance.now();
      if (now - lastThrust > thrustInterval) {
        playBeep(300, 0.05);
        lastThrust = now;
      }
    }
  };

  // Spawn timers
  setInterval(spawnAsteroid, 1200);
  setInterval(spawnCrate, 3000);

  // Main
  const tick = () => {
    handleInput();
    loop();
  };
  tick();
})();
