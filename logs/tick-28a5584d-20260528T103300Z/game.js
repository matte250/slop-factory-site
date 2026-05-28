// Game: Asteroid Escape (concise implementation)
// Canvas element with id "game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // generate starfield
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5
  }));
  // sound assets (place sound files in a 'sounds' folder)
  const soundThrust = new Audio('sounds/thrust.wav');
  const soundExplosion = new Audio('sounds/explosion.wav');
  const soundShield = new Audio('sounds/shield.wav');
  // loop thrust while key held
  let thrustPlaying = false;
  // ---- Game state -------------------------------------------------------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.15,
    turnSpeed: 0.07,
    fuel: 100,
    fuelDrain: 0.02,
    shield: false,
    shieldTime: 0,
  };
  let asteroids = [];
  const maxAsteroids = 8;
  const score = { value: 0 };

  // ---- Input -----------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ---- Helpers ----------------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist2 = (x1, y1, x2, y2) => (x1 - x2) ** 2 + (y1 - y2) ** 2;

  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const speed = rand(0.5, 2);
    const angle = rand(0, Math.PI * 2);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    const size = rand(15, 40);
    switch (edge) {
      case 0: x = rand(0, width); y = -size; break;
      case 1: x = width + size; y = rand(0, height); break;
      case 2: x = rand(0, width); y = height + size; break;
      case 3: x = -size; y = rand(0, height); break;
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  function updateShip(dt) {
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    // Thrust handling with sound
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      if (!thrustPlaying) {
        soundThrust.currentTime = 0;
        soundThrust.loop = true;
        soundThrust.play();
        thrustPlaying = true;
      }
    } else if (thrustPlaying) {
      soundThrust.pause();
      soundThrust.currentTime = 0;
      thrustPlaying = false;
    }
    // Apply inertia & fuel consumption
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.vx *= 0.99; ship.vy *= 0.99; // damping
    ship.fuel = Math.max(0, ship.fuel - ship.fuelDrain * dt);
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // Shield timer
    if (ship.shield) {
      ship.shieldTime -= dt;
      if (ship.shieldTime <= 0) ship.shield = false;
    }
  }

  function updateAsteroids(dt) {
    asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Wrap
      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    });
    // Remove off‑screen (handled by wrap) and limit count
    while (asteroids.length < maxAsteroids) spawnAsteroid();
  }

  function checkCollisions() {
    for (const a of asteroids) {
      if (dist2(ship.x, ship.y, a.x, a.y) < (ship.radius + a.radius) ** 2) {
        if (ship.shield) {
          // destroy asteroid, no penalty, play shield sound
          soundShield.currentTime = 0;
          soundShield.play();
          const idx = asteroids.indexOf(a);
          if (idx > -1) asteroids.splice(idx, 1);
        } else {
          // Game over - play explosion sound
          soundExplosion.currentTime = 0;
          soundExplosion.play();
          cancelAnimationFrame(frameId);
          alert('Game Over! Score: ' + Math.floor(score.value));
          return true;
        }
      }
    }
    if (ship.fuel <= 0) {
      cancelAnimationFrame(frameId);
      alert('Out of fuel! Score: ' + Math.floor(score.value));
      return true;
    }
    return false;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    });

    // ship shield halo
    if (ship.shield) {
      const halo = ctx.createRadialGradient(ship.x, ship.y, ship.radius, ship.x, ship.y, ship.radius + 20);
      halo.addColorStop(0, 'rgba(0,255,255,0.4)');
      halo.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(ship.x, ship.y, ship.radius + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // thrust flame
    if (keys['ArrowUp']) {
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-22, -6);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = ship.shield ? 'cyan' : 'white';
    ctx.fill();
    ctx.restore();

    // asteroids (irregular polygon)
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      const points = 8;
      const step = (Math.PI * 2) / points;
      ctx.beginPath();
      for (let i = 0; i < points; i++) {
        const angle = i * step + Math.random() * step * 0.3;
        const r = a.radius * (0.7 + Math.random() * 0.6);
        const x = a.x + Math.cos(angle) * r;
        const y = a.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score.value), 10, 20);
    // fuel bar background
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    const fuelW = 100;
    ctx.fillRect(10, 30, fuelW, 10);
    // fuel level
    ctx.fillStyle = 'lime';
    ctx.fillRect(10, 30, fuelW * (ship.fuel / 100), 10);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(10, 30, fuelW, 10);
    // shield indicator
    if (ship.shield) {
      ctx.fillStyle = 'cyan';
      ctx.fillText('Shield', 10, 55);
    }
  }

  let last = performance.now();
  let frameId;
  function loop(now) {
    const dt = (now - last) / 16; // approx 60fps normalised
    last = now;
    updateShip(dt);
    updateAsteroids(dt);
    score.value += dt * 0.1; // distance proxy
    if (checkCollisions()) return;
    draw();
    frameId = requestAnimationFrame(loop);
  }
  // Initialize asteroids
  while (asteroids.length < maxAsteroids) spawnAsteroid();
  frameId = requestAnimationFrame(loop);
})();
