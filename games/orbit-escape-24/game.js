// Orbit Escape game implementation
// Targets a <canvas id="game"></canvas> element present in the page.
// Minimal, self‑contained logic: ship orbital motion, asteroid spawning, fuel, score.

(function () {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let lastThrustTime = 0;
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // ----- Game state -----
  // generate background stars once
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
  }));

  const state = {
    ship: {
      angle: 0, // radians around planet centre
      radius: 100, // distance from centre (orbit radius)
      speed: 0.002, // angular speed per frame (adjusted by input)
    },
    planet: { x: width / 2, y: height / 2, radius: 30 },
    asteroids: [],
    fuel: 100, // percent
    score: 0,
    lastSpawn: 0,
    gameOver: false,
  };

  // ----- Input handling -----
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // ----- Helper functions -----
  function spawnAsteroid() {
    // spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -20; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // right
        x = width + 20; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + 20; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 3: // left
        x = -20; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
    }
    const size = 10 + Math.random() * 10;
    state.asteroids.push({ x, y, vx, vy, size });
  }

  function update(dt) {
    if (state.gameOver) return;

    // Update ship rotation based on input
    if (keys.ArrowLeft) state.ship.angle -= state.ship.speed * dt;
    if (keys.ArrowRight) state.ship.angle += state.ship.speed * dt;
    // Thrust changes orbital radius (simulating fuel use)
    if (keys.ArrowUp) {
      state.ship.radius = Math.max(state.planet.radius + 20, state.ship.radius - 0.05 * dt);
      state.fuel = Math.max(0, state.fuel - 0.02 * dt);
      // play thrust sound, throttle to 100ms intervals
      if (audioCtx && (performance.now() - lastThrustTime) > 100) {
        playBeep(440, 80);
        lastThrustTime = performance.now();
      }
    }
    if (keys.ArrowDown) {
      state.ship.radius = Math.min(Math.max(width, height) / 2 - 20, state.ship.radius + 0.03 * dt);
    }

    // Move asteroids
    state.asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    });
    // Remove off‑screen asteroids
    state.asteroids = state.asteroids.filter(a => a.x > -30 && a.x < width + 30 && a.y > -30 && a.y < height + 30);

    // Spawn new asteroids periodically
    state.lastSpawn += dt;
    if (state.lastSpawn > 1500) { // every 1.5 seconds
      spawnAsteroid();
      state.lastSpawn = 0;
    }

    // Collision detection (simple circle vs circle)
    const shipX = state.planet.x + Math.cos(state.ship.angle) * state.ship.radius;
    const shipY = state.planet.y + Math.sin(state.ship.angle) * state.ship.radius;
    for (const a of state.asteroids) {
      const dx = shipX - a.x;
      const dy = shipY - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + 8) { // ship radius approx 8
        // collision sound
        playBeep(220, 300);
        state.gameOver = true;
        break;
      }
    }
    // Fuel depletion loses game
    if (state.fuel <= 0) state.gameOver = true;

    // Score increments with time survived
    state.score += dt / 1000;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw planet with gradient
    const planetGrad = ctx.createRadialGradient(
      state.planet.x, state.planet.y, state.planet.radius * 0.2,
      state.planet.x, state.planet.y, state.planet.radius
    );
    planetGrad.addColorStop(0, '#555555');
    planetGrad.addColorStop(1, '#111111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(state.planet.x, state.planet.y, state.planet.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw ship with outline
    const shipX = state.planet.x + Math.cos(state.ship.angle) * state.ship.radius;
    const shipY = state.planet.y + Math.sin(state.ship.angle) * state.ship.radius;
    ctx.fillStyle = '#ffcc00';
    ctx.strokeStyle = '#b8860b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(shipX, shipY);
    ctx.lineTo(shipX - Math.cos(state.ship.angle) * 12, shipY - Math.sin(state.ship.angle) * 12);
    ctx.lineTo(shipX - Math.cos(state.ship.angle + Math.PI / 2) * 6, shipY - Math.sin(state.ship.angle + Math.PI / 2) * 6);
    ctx.lineTo(shipX - Math.cos(state.ship.angle - Math.PI / 2) * 6, shipY - Math.sin(state.ship.angle - Math.PI / 2) * 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Draw asteroids with simple shading
    ctx.fillStyle = '#888888';
    ctx.strokeStyle = '#555555';
    state.asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // UI: fuel bar
    const barWidth = 100;
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, barWidth, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, (state.fuel / 100) * barWidth, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, barWidth, 10);
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(state.score), 10, 40);
    // Game over overlay
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + Math.floor(state.score), width / 2, height / 2 + 40);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!state.gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
