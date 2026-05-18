// Asteroid Dodger – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(200, 0.08); }
  function playExplosion() { playTone(100, 0.4); }

  // Player ship
  const ship = {
    x: width / 2,
    y: height / 2,
    velX: 0,
    velY: 0,
    angle: 0,
    radius: 10,
    fuel: 100,
  };

  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  const asteroids = [];
  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  let score = 0;
  let lastTime = performance.now();
  let spawnTimer = 0;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    const size = 15 + Math.random() * 25;
    let x, y, vx, vy;
    if (edge === 0) { // top
      x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * 2; vy = 1 + Math.random() * 2;
    } else if (edge === 1) { // bottom
      x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * 2; vy = -(1 + Math.random() * 2);
    } else if (edge === 2) { // left
      x = -size; y = Math.random() * height; vx = 1 + Math.random() * 2; vy = (Math.random() - 0.5) * 2;
    } else { // right
      x = width + size; y = Math.random() * height; vx = -(1 + Math.random() * 2); vy = (Math.random() - 0.5) * 2;
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  function update(dt) {
    // Controls
    if (keys['ArrowLeft']) ship.angle -= 3 * dt;
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      const thrust = 100;
      ship.velX += Math.cos(ship.angle) * thrust * dt;
      ship.velY += Math.sin(ship.angle) * thrust * dt;
      ship.fuel -= 20 * dt;
      playThrust();
    }
    // Apply friction
    ship.velX *= 0.99;
    ship.velY *= 0.99;
    ship.x += ship.velX * dt;
    ship.y += ship.velY * dt;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // Fuel regen (optional: occasional cells omitted for brevity)
    ship.fuel = Math.min(100, ship.fuel + 5 * dt);

    // Asteroids
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnAsteroid();
      spawnTimer = 1.5; // seconds between spawns
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt * 60; // speed scale
      a.y += a.vy * dt * 60;
      // Remove off‑screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Game over – stop loop
        cancelAnimationFrame(rafId);
        ctx.fillStyle = 'red';
        ctx.font = '30px sans-serif';
        ctx.fillText('Game Over', width / 2 - 80, height / 2);
        return;
      }
    }
    // Score based on time survived
    score += dt;
  }

  function render() {
    // background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#00ffcc';
    ctx.fill();
    // thrust flame
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}` , 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}` , 10, 40);
  }

  let rafId;
  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    render();
    rafId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
