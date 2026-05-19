// Asteroid Drift – minimal canvas game
// Assumes an HTML canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ==== Audio ====
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  };
  // resume audio on first interaction
  const resumeAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
    window.removeEventListener('keydown', resumeAudio);
    window.removeEventListener('click', resumeAudio);
  };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  // ==== Game state ====
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
  };
  let fuel = 100; // seconds of fuel
  let lastFuelTick = performance.now();
  const asteroids = [];
  const fuels = [];
  const stars = [];
  let gameOver = false;

  // ==== Helpers ====
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // generate stars for background
  const initStars = (count = 100) => {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand(0, width),
        y: rand(0, height),
        radius: rand(0.5, 1.5),
        brightness: rand(0.5, 1),
      });
    }
  };

  // create irregular asteroid shape
  const createAsteroidShape = (radius) => {
    const points = 8;
    const shape = [];
    for (let i = 0; i < points; i++) {
      const angle = (Math.PI * 2 / points) * i;
      const distance = radius * rand(0.7, 1.3);
      shape.push({x: Math.cos(angle) * distance, y: Math.sin(angle) * distance});
    }
    return shape;
  };

  const spawnAsteroid = () => {
    const size = rand(15, 30);
    const shape = createAsteroidShape(size);
    asteroids.push({
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-0.5, 0.5),
      vy: rand(-0.5, 0.5),
      radius: size,
      shape,
    });
  };

  const spawnFuel = () => {
    fuels.push({
      x: rand(0, width),
      y: rand(0, height),
      radius: 8,
    });
  };

  // Initial population
  for (let i = 0; i < 12; i++) spawnAsteroid();
  // Create background stars
  initStars();
  // ==== Input ====
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ==== Main loop ====
  const update = (dt) => {
    if (gameOver) return;
    // ship controls
    if (keys['ArrowLeft']) ship.angle -= 0.04 * dt;
    if (keys['ArrowRight']) ship.angle += 0.04 * dt;
    if (keys['ArrowUp'] && fuel > 0) {
      const thrust = 0.06 * dt;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      fuel = Math.max(0, fuel - dt / 1000);
      // thrust sound
      playBeep(300, 30);
    }

    // update position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    }

    // collision ship‑asteroid
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius) {
        gameOver = true;
        // collision sound
        playBeep(600, 200);
        break;
      }
    }

    // collect fuel
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (dist(ship, fuels[i]) < ship.radius + fuels[i].radius) {
        fuel = Math.min(100, fuel + 20);
        // fuel collection sound
        playBeep(500, 80);
        fuels.splice(i, 1);
      }
    }

    // spawn new fuel every 10 seconds
    if (performance.now() - lastFuelTick > 10000) {
      spawnFuel();
      lastFuelTick = performance.now();
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // background stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.brightness * 0.8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with irregular shape
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      const pts = a.shape || [];
      if (pts.length) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // fuel pickups
    ctx.fillStyle = 'lime';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
