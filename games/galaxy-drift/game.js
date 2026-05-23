// Simple canvas game based on IDEA.md
// Ship drifts in starfield, can rotate/thrust, avoids asteroids, collects fuel cells.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context runs after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // ----- Game objects -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
  };

  const asteroids = [];
  const fuels = [];
  let score = 0;
  let lastAsteroid = 0;
  let lastFuel = 0;
  const particles = []; // thrust particles

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Helpers -----
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    const speed = rand(0.5, 1.5);
    if (side === 0) { x = 0; y = rand(0, height); vx = speed; vy = rand(-0.5, 0.5); }
    else if (side === 1) { x = width; y = rand(0, height); vx = -speed; vy = rand(-0.5, 0.5); }
    else if (side === 2) { x = rand(0, width); y = 0; vx = rand(-0.5, 0.5); vy = speed; }
    else { x = rand(0, width); y = height; vx = rand(-0.5, 0.5); vy = -speed; }
    asteroids.push({ x, y, vx, vy, r: rand(15, 30) });
  }

  function spawnFuel() {
    fuels.push({ x: rand(0, width), y: rand(0, height), r: 6, collected: false });
  }

  function update(dt) {
    // Ship controls
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= 3 * dt;
    if (keys['ArrowRight'] || keys['d']) ship.angle += 3 * dt;
    if ((keys['ArrowUp'] || keys['w']) && ship.fuel > 0) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel -= 10 * dt; // consumption
      // generate thrust particles and sound
      for (let i = 0; i < 5; i++) {
        const angle = ship.angle + Math.PI + rand(-0.3, 0.3);
        particles.push({
          x: ship.x,
          y: ship.y,
          vx: Math.cos(angle) * rand(0.5, 1.5),
          vy: Math.sin(angle) * rand(0.5, 1.5),
          life: 0.5,
          size: rand(1, 3),
        });
      }
      // play thrust sound
      playSound(300, 0.07);
    }
    // Drift forward constantly
    const drift = 0.02;
    ship.vx += Math.cos(ship.angle) * drift;
    ship.vy += Math.sin(ship.angle) * drift;
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // keep particles within bounds
    particles.forEach(p => {
      p.x = (p.x + width) % width;
      p.y = (p.y + height) % height;
    });

    // Update position
    ship.x = (ship.x + ship.vx + width) % width;
    ship.y = (ship.y + ship.vy + height) % height;
    // Dampen velocity
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Spawn asteroids/fuel
    if (performance.now() - lastAsteroid > 2000) { spawnAsteroid(); lastAsteroid = performance.now(); }
    if (performance.now() - lastFuel > 5000) { spawnFuel(); lastFuel = performance.now(); }

    // Update asteroids
    asteroids.forEach(a => {
      a.x = (a.x + a.vx + width) % width;
      a.y = (a.y + a.vy + height) % height;
    });

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.r) {
          // Game over sound
          playSound(80, 0.4);
          alert('Game Over! Score: ' + Math.floor(score));
          document.location.reload();
          return;
        }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (!f.collected && dist(ship.x, ship.y, f.x, f.y) < ship.radius + f.r) {
        ship.fuel = Math.min(ship.fuel + 30, 100);
        f.collected = true;
      }
    }
    // Remove collected fuels
    fuels.filter(f => !f.collected);

    // Score based on distance traveled (approx velocity magnitude) and fuel collected
    score += Math.hypot(ship.vx, ship.vy) * dt;
  }

  function drawStarfield() {
    // simple moving starfield with twinkle effect
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // initialize stars if not present
    if (!window.__stars) {
      window.__stars = [];
      for (let i = 0; i < 120; i++) {
        window.__stars.push({ x: rand(0, width), y: rand(0, height), z: rand(0.2, 1) });
      }
    }
    window.__stars.forEach(s => {
      // move towards viewer
      s.z -= 0.002;
      if (s.z <= 0) { s.x = rand(0, width); s.y = rand(0, height); s.z = 1; }
      const sx = s.x / s.z;
      const sy = s.y / s.z;
      const size = (1 - s.z) * 2 + 0.5;
      const brightness = Math.floor(200 + (1 - s.z) * 55);
      ctx.fillStyle = `rgb(${brightness},${brightness},${brightness})`;
      ctx.fillRect(sx, sy, size, size);
    });
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body gradient
    const grad = ctx.createLinearGradient(-12, 0, 12, 0);
    grad.addColorStop(0, '#1aff1a');
    grad.addColorStop(1, '#006400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-12, -8);
    ctx.lineTo(-12, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroids() {
    // simple rock-like asteroids with shading
    asteroids.forEach(a => {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      gradient.addColorStop(0, '#aaa');
      gradient.addColorStop(1, '#555');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawFuels() {
    // glowing fuel cells
    fuels.forEach(f => {
      if (!f.collected) {
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        grad.addColorStop(0, '#ffff80');
        grad.addColorStop(1, '#ff8000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      const alpha = Math.max(p.life / 0.5, 0);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffa500';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Fuel: ' + Math.round(ship.fuel), 10, 20);
    ctx.fillText('Score: ' + Math.floor(score), 10, 40);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    drawStarfield();
    drawAsteroids();
    drawFuels();
    drawShip();
    drawHUD();
    requestAnimationFrame(loop);
  }
  loop();
})();
