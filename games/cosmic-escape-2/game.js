// Minimal canvas game based on IDEA.md
// Canvas with id="game"

(() => {
  // graphics helpers will be initialized after canvas size

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Exhaust particles
  const particles = [];
  const MAX_PARTICLES = 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.osc.stop();
    thrustOsc.osc.disconnect();
    thrustOsc.gain.disconnect();
    thrustOsc = null;
  }
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 10,
    thrust: 0,
    vx: 0,
    vy: 0,
    fuel: 100,
  };

  // Game objects
  const asteroids = [];
  const fuels = [];

  // Settings
  const ASTEROID_SPAWN_RATE = 0.02; // per frame
  const FUEL_SPAWN_RATE = 0.005;
  const MAX_ASTEROID_SPEED = 2.5;
  const FUEL_VALUE = 30;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height);
    const x = ship.x + Math.cos(angle) * distance;
    const y = ship.y + Math.sin(angle) * distance;
    const speed = Math.random() * MAX_ASTEROID_SPEED + 0.5;
    const vx = (ship.x - x) / distance * speed;
    const vy = (ship.y - y) / distance * speed;
    const radius = Math.random() * 15 + 5;
    asteroids.push({ x, y, vx, vy, radius });
  }

  function spawnFuel() {
    const x = Math.random() * width;
    const y = Math.random() * height;
    fuels.push({ x, y, radius: 6 });
  }

  function update() {
    // Update stars (twinkling)
    stars.forEach(s => {
      s.x += (Math.random() - 0.5) * 0.2;
      s.y += (Math.random() - 0.5) * 0.2;
      if (s.x < 0) s.x += width;
      if (s.x > width) s.x -= width;
      if (s.y < 0) s.y += height;
      if (s.y > height) s.y -= height;
    });

    // Exhaust particles when thrusting
    if (ship.thrust > 0) {
      const angle = ship.angle + Math.PI; // rear direction
      const speed = 1.5;
      particles.push({
        x: ship.x + Math.cos(ship.angle) * ship.radius,
        y: ship.y + Math.sin(ship.angle) * ship.radius,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
        life: 30,
        radius: Math.random() * 2 + 1,
      });
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Ship control
    if (keys['arrowleft'] || keys['a']) ship.angle -= 0.05;
    if (keys['arrowright'] || keys['d']) ship.angle += 0.05;
    if ((keys['arrowup'] || keys['w']) && ship.fuel > 0) {
      ship.thrust = 0.1;
      ship.fuel -= 0.05; // fuel consumption
    } else {
      ship.thrust = 0;
    }
    // Apply thrust
    ship.vx += Math.cos(ship.angle) * ship.thrust;
    ship.vy += Math.sin(ship.angle) * ship.thrust;
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Spawn objects
    if (Math.random() < ASTEROID_SPAWN_RATE) spawnAsteroid();
    if (Math.random() < FUEL_SPAWN_RATE) spawnFuel();

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove if far off-screen
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.radius + ship.radius) {
          playSound(100, 0.3);
          ship.alive = false;
        }
    }

    // Update fuel canisters
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      if (Math.hypot(dx, dy) < f.radius + ship.radius) {
        ship.fuel = Math.min(100, ship.fuel + FUEL_VALUE);
        fuels.splice(i, 1);
      }
    }

    // Lose condition: fuel depleted
    if (ship.fuel <= 0) ship.alive = false;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // particles (exhaust)
    particles.forEach(p => {
      const alpha = Math.max(p.life / 30, 0);
      ctx.fillStyle = `rgba(255,165,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.restore();

    // Asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel canisters
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI – fuel bar
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, 104, 14);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(12, 12, ship.fuel, 10);
  }

  function loop() {
    if (ship.alive === false) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Init ship status
  ship.alive = true;
  loop();
})();
