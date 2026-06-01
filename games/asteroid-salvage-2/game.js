// Simple asteroid salvage game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio context and simple sound helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  const state = {
    ship: { x: width/2, y: height/2, angle: 0, speed: 0 },
    asteroids: [],
    salvage: [],
    fuel: 100,
    score: 0,
    keys: {},
    lastSpawn: 0,
    gameOver: false,
    // flag to ensure audio context is resumed on user interaction
    audioUnlocked: false,
  };

  // Helper functions
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnAsteroid() {
    const radius = rand(15, 30);
    const x = rand(0, width);
    const y = rand(0, height);
    const vx = rand(-0.5, 0.5);
    const vy = rand(-0.5, 0.5);
    state.asteroids.push({ x, y, radius, vx, vy });
  }
  function spawnSalvage() {
    const size = 10;
    const x = rand(0, width - size);
    const y = rand(0, height - size);
    state.salvage.push({ x, y, size, collected: false });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    state.keys[e.key] = true;
    // Unlock audio on first interaction
    if (!state.audioUnlocked) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      state.audioUnlocked = true;
    }
  });
  window.addEventListener('keyup', e => { state.keys[e.key] = false; });

  function update(dt) {
    if (state.gameOver) return;
    // fuel consumption
    state.fuel -= dt * 0.02; // fuel per ms
    if (state.fuel <= 0) { state.fuel = 0; state.gameOver = true; }

    // ship controls (arrows or WASD)
    const thrust = 0.1;
    if (state.keys['ArrowUp'] || state.keys['w']) state.ship.speed += thrust;
    if (state.keys['ArrowDown'] || state.keys['s']) state.ship.speed -= thrust;
    if (state.keys['ArrowLeft'] || state.keys['a']) state.ship.angle -= 0.05;
    if (state.keys['ArrowRight'] || state.keys['d']) state.ship.angle += 0.05;

    // move ship
    const ship = state.ship;
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // friction
    ship.speed *= 0.99;
    // wrap around
    if (ship.x < 0) ship.x += width; else if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height; else if (ship.y > height) ship.y -= height;

    // asteroids motion and wrap
    for (const a of state.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    }

    // check collisions ship-asteroid
    for (const a of state.asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + 10) { // ship radius approx 10
        playTone(200, 0.3); // collision sound
        state.gameOver = true;
        break;
      }
    }

    // salvage collection
    for (const s of state.salvage) {
      if (s.collected) continue;
      const dx = ship.x - (s.x + s.size/2);
      const dy = ship.y - (s.y + s.size/2);
      if (Math.hypot(dx, dy) < 15) {
        s.collected = true;
        state.score += 10;
        state.fuel = Math.min(state.fuel + 5, 100); // small fuel bonus
        playTone(600, 0.1); // salvage collection sound
      }
    }

    // spawn new objects over time
    const now = Date.now();
    if (now - state.lastSpawn > 2000) {
      spawnAsteroid();
      spawnSalvage();
      state.lastSpawn = now;
    }
  }

  function draw() {
    // Background: black with star field
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    if (!state.stars) {
      state.stars = [];
      for (let i = 0; i < 100; i++) {
        state.stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    for (const star of state.stars) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ship with gradient
    const ship = state.ship;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-10, -10, 10, 10);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#0a0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // draw asteroids with radial gradient
    for (const a of state.asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#999');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw salvage with glow effect
    for (const s of state.salvage) {
      if (s.collected) continue;
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ff0';
      ctx.fillRect(s.x, s.y, s.size, s.size);
      ctx.restore();
    }

    // UI: fuel and score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${state.fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${state.score}`, 10, 40);
    if (state.gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
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
