// Cosmic Courier – minimal canvas game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;

  // ---------- Audio ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // thrust sound (continuous while thrust key held)
  let thrustOsc = null;
  const startThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.type = 'square';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  };
  const playCollision = () => playTone(100, 0.3);
  const playDelivery = () => playTone(600, 0.15);
  const playWin = () => playTone(800, 0.5);
  const playOutOfFuel = () => playTone(50, 0.5);

  canvas.height = canvas.clientHeight || 600;

  // ---------- Utility ----------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---------- Game objects ----------
  const ship = { x: canvas.width / 2, y: canvas.height / 2, r: 12, angle: 0, speed: 0, fuel: 100 };
  const planets = [];
  const asteroids = [];
  const packages = [];
  let delivered = 0;
  const totalPackages = 5;

  // initialise planets (orbiting circles)
  for (let i = 0; i < 3; i++) {
    const radius = rand(30, 60);
    const orbit = rand(100, Math.min(canvas.width, canvas.height) / 2 - 50);
    const speed = rand(0.001, 0.003);
    planets.push({ cx: canvas.width / 2, cy: canvas.height / 2, radius, orbit, angle: rand(0, Math.PI * 2), speed });
  }

  // spawn asteroids
  const spawnAsteroid = () => {
    const edge = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    const size = rand(8, 20);
    if (edge === 0) { x = 0; y = rand(0, canvas.height); vx = rand(1, 3); vy = rand(-1, 1); }
    else if (edge === 1) { x = canvas.width; y = rand(0, canvas.height); vx = -rand(1, 3); vy = rand(-1, 1); }
    else if (edge === 2) { x = rand(0, canvas.width); y = 0; vx = rand(-1, 1); vy = rand(1, 3); }
    else { x = rand(0, canvas.width); y = canvas.height; vx = rand(-1, 1); vy = -rand(1, 3); }
    asteroids.push({ x, y, vx, vy, r: size });
  };
  for (let i = 0; i < 5; i++) spawnAsteroid();

  // create packages (targets on planets)
  for (let i = 0; i < totalPackages; i++) {
    const planet = planets[i % planets.length];
    packages.push({ planetIndex: i % planets.length, delivered: false });
  }

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---------- Game loop ----------
  const update = dt => {
    // ship control
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (keys['ArrowUp']) {
      ship.speed = 2;
      startThrust();
    } else {
      ship.speed = 0;
      stopThrust();
    }
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // wrap ship
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
    // fuel consumption
    ship.fuel -= 0.02 * dt;
    // move planets
    planets.forEach(p => {
      p.angle += p.speed * dt;
      p.x = p.cx + Math.cos(p.angle) * p.orbit;
      p.y = p.cy + Math.sin(p.angle) * p.orbit;
    });
    // move asteroids
    asteroids.forEach(a => {
      a.x += a.vx; a.y += a.vy;
      // wrap
      if (a.x < -50) a.x = canvas.width + 50;
      if (a.x > canvas.width + 50) a.x = -50;
      if (a.y < -50) a.y = canvas.height + 50;
      if (a.y > canvas.height + 50) a.y = -50;
    });
    // collisions with asteroids
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) {
        playCollision();
        alert('Crashed!');
        document.location.reload();
      }
    }
    // deliveries
    packages.forEach(pkg => {
      if (pkg.delivered) return;
      const planet = planets[pkg.planetIndex];
      if (dist(ship, planet) < ship.r + 15) {
        pkg.delivered = true;
        delivered++;
        if (delivered === totalPackages) {
          playWin();
          alert('All packages delivered! You win!');
          document.location.reload();
        }
      }
    });
    // out of fuel
    if (ship.fuel <= 0) {
playOutOfFuel();
        alert('Out of fuel!');
        document.location.reload();
    }
  };

  const draw = () => {
ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background stars
  for (let i = 0; i < 50; i++) {
    const sx = Math.random() * canvas.width;
    const sy = Math.random() * canvas.height;
    const sr = Math.random() * 1.5;
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx, sy, sr, sr);
  }

  // draw planets with radial gradient
  planets.forEach(p => {
    const grad = ctx.createRadialGradient(p.x, p.y, p.radius * 0.2, p.x, p.y, p.radius);
    grad.addColorStop(0, '#6cf');
    grad.addColorStop(1, '#034');
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // draw asteroids with rocky color
  asteroids.forEach(a => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fillStyle = '#9a7';
    ctx.fill();
    ctx.strokeStyle = '#583';
    ctx.stroke();
  });

  // draw ship with stroke
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-10, -8);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
  ctx.fillText(`Delivered: ${delivered}/${totalPackages}`, 10, 40);
  };

  let last = performance.now();
  const loop = time => {
    const dt = time - last;
    last = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
