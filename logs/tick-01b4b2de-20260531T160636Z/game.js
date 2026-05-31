// Orbit Escape – minimal implementation
// Assumes an HTML <canvas id="game"></canvas> is present.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Full‑window canvas and starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // centre planet
    planet.x = canvas.width / 2;
    planet.y = canvas.height / 2;
    // reposition stars on resize
    stars.forEach(s => {
      s.x = Math.random() * canvas.width;
      s.y = Math.random() * canvas.height;
    });
  };
  window.addEventListener('resize', resize);
  resize();

  const planet = { x: canvas.width / 2, y: canvas.height / 2, r: 40 };
  let ship = {
    angle: 0, // radians
    radius: planet.r + 30,
    angularVel: 0,
    radialVel: 0,
    size: 12,
    fuel: 100,
  };
  const asteroids = [];
  const pickups = [];
  let score = 0;
  let gameOver = false;
  let lastSpawn = 0;
  let lastPickup = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === ' ') {
      // Play thrust sound on space press
      playTone(300, 0.08);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const spawnAsteroid = () => {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1.5 + Math.random();
    const margin = 20;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -margin;
    } else if (edge === 1) { // right
      x = canvas.width + margin;
      y = Math.random() * canvas.height;
    } else if (edge === 2) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + margin;
    } else { // left
      x = -margin;
      y = Math.random() * canvas.height;
    }
    const dx = planet.x - x;
    const dy = planet.y - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    asteroids.push({ x, y, vx, vy, r: 8 + Math.random() * 6 });
  };

  const spawnPickup = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = planet.r + 80 + Math.random() * 120;
    const x = planet.x + Math.cos(angle) * radius;
    const y = planet.y + Math.sin(angle) * radius;
    pickups.push({ x, y, r: 6, collected: false });
  };

  const update = dt => {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft']) ship.angularVel -= 0.0015 * dt;
    if (keys['ArrowRight']) ship.angularVel += 0.0015 * dt;
    // Constant outward thrust
    ship.radialVel += 0.0002 * dt;
    // Optional extra thrust with Space
    if (keys[' ']) ship.radialVel += 0.0005 * dt;
    // Apply velocities
    ship.angle += ship.angularVel * dt;
    ship.radius += ship.radialVel * dt;
    // Dampen velocities
    ship.angularVel *= 0.99;
    ship.radialVel *= 0.99;
    // Keep within bounds
    const maxR = Math.min(canvas.width, canvas.height) / 2 - 20;
    if (ship.radius > maxR) ship.radius = maxR;
    if (ship.radius < planet.r + 10) ship.radius = planet.r + 10;
    // Update ship position
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    // Asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // collision with ship
      const d = Math.hypot(a.x - sx, a.y - sy);
if (d < a.r + ship.size) {
          // Play collision sound
          playTone(100, 0.3);
          gameOver = true;
        }
      // remove if passed planet
      const dp = Math.hypot(a.x - planet.x, a.y - planet.y);
      if (dp < planet.r) asteroids.splice(i, 1);
    }
    // Pickups
    for (let i = pickups.length - 1; i >= 0; i--) {
      const p = pickups[i];
      const d = Math.hypot(p.x - sx, p.y - sy);
if (d < p.r + ship.size) {
          // Play pickup sound
          playTone(600, 0.1);
          ship.fuel = Math.min(ship.fuel + 20, 200);
          pickups.splice(i, 1);
          score++;
        }
    }
    // Spawn asteroids every ~2 seconds
    if (performance.now() - lastSpawn > 2000) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Spawn pickups every ~7 seconds
    if (performance.now() - lastPickup > 7000) {
      spawnPickup();
      lastPickup = performance.now();
    }
    // Decrease fuel over time
    ship.fuel -= 0.01 * dt;
    if (ship.fuel <= 0) gameOver = true;
    // Score based on time
    score = Math.floor(performance.now() / 1000);
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Starfield background
    ctx.fillStyle = '#111';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Planet with gradient
    const planetGrad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.r * 0.2,
      planet.x,
      planet.y,
      planet.r
    );
    planetGrad.addColorStop(0, '#4c8');
    planetGrad.addColorStop(1, '#2a5');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // Ship
    const sx = planet.x + Math.cos(ship.angle) * ship.radius;
    const sy = planet.y + Math.sin(ship.angle) * ship.radius;
    ctx.fillStyle = '#fff';
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ship.angle + Math.PI / 2);
    // Ship gradient
    const shipGrad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    shipGrad.addColorStop(0, '#fff');
    shipGrad.addColorStop(1, '#666');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size / 2, ship.size);
    ctx.lineTo(-ship.size / 2, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x,
        a.y,
        a.r * 0.2,
        a.x,
        a.y,
        a.r
      );
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Pickups
    ctx.fillStyle = '#ff0';
    pickups.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${score}s`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(ship.fuel))}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
