// Game based on IDEA.md – Space Escape
// Canvas element with id="game" is assumed to exist in the page.

(() => {
  // Ensure AudioContext is running after first user interaction
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }
  document.addEventListener('click', resumeAudio, {once:true});
  document.addEventListener('keydown', resumeAudio, {once:true});

  // Audio helper using Web Audio API
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playSound(400, 100); }
  function playCollision() { playSound(100, 300); }
  function playFuel() { playSound(800, 150); }
  function playGameOver() { playSound(60, 500); }

  // Audio helper using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  function playThrust() { playSound(400, 100); }
  function playCollision() { playSound(100, 300); }
  function playFuel() { playSound(800, 150); }
  function playGameOver() { playSound(60, 500); }

  // --- rest of code follows ---

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ---------- Game State ----------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 12,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    friction: 0.99,
  };

  // Ship trail history for visual effect
  const shipTrail = [];

  const asteroids = [];
  const fuels = [];
  let score = 0;
  let fuel = 100; // depletes over time
  let running = true;
  let gameOverPlayed = false;

  // Stars for background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // ---------- Input ----------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'ArrowUp') playThrust(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ---------- Helpers ----------
  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  function distance(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = randRange(1, 3);
    switch (side) {
      case 0: // top
        x = randRange(0, width);
        y = -20;
        break;
      case 1: // right
        x = width + 20;
        y = randRange(0, height);
        break;
      case 2: // bottom
        x = randRange(0, width);
        y = height + 20;
        break;
      case 3: // left
        x = -20;
        y = randRange(0, height);
        break;
    }
    const angle = Math.atan2(height/2 - y, width/2 - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, vx, vy, r: randRange(15, 30) });
  }

  function spawnFuel() {
    fuels.push({
      x: randRange(0, width),
      y: randRange(0, height),
      r: 8,
    });
  }

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  spawnFuel();

  // ---------- Main Loop ----------
  function update(dt) {
    if (!running) return;
    // Handle input
    if (keys['ArrowLeft']) ship.angle -= 0.05;
    if (keys['ArrowRight']) ship.angle += 0.05;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }

    // Apply friction & move ship
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Record trail
    shipTrail.push({ x: ship.x, y: ship.y });
    if (shipTrail.length > 30) shipTrail.shift();

    // Wrap ship around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // Wrap
      if (a.x < -50) a.x = width + 50;
      if (a.x > width + 50) a.x = -50;
      if (a.y < -50) a.y = height + 50;
      if (a.y > height + 50) a.y = -50;
    });

    // Collision detection ship-asteroid
    for (const a of asteroids) {
      if (distance(ship.x, ship.y, a.x, a.y) < ship.radius + a.r) {
        running = false; // game over
        playCollision();
        break;
      }
    }

    // Fuel collection
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (distance(ship.x, ship.y, f.x, f.y) < ship.radius + f.r) {
        score += 10;
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
        spawnFuel();
        playFuel();
      }
    }

    // Decrease fuel over time
    fuel -= dt * 0.01;
    if (fuel <= 0) {
        running = false; // out of fuel
        if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
      }

    // Periodically add new asteroids
    if (Math.random() < dt * 0.001) spawnAsteroid();
  }

  function draw() {
    // Clear with semi‑transparent fill for motion blur effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, width, height);

    // Draw stars background
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Draw ship trail (fading line)
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < shipTrail.length; i++) {
      const p = shipTrail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Draw ship with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#00ffff';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw fuels with glow
    fuels.forEach(f => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = 'yellow';
      ctx.fillStyle = 'yellow';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'red';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
    else {
      // allow restart on space press
window.addEventListener('keydown', function handler(e) {
          if (e.code === 'Space') {
            // Reset state
            ship.x = width / 2; ship.y = height / 2; ship.vx = ship.vy = 0; ship.angle = 0;
            asteroids.length = 0; fuels.length = 0; score = 0; fuel = 100; running = true;
            shipTrail.length = 0; // clear trail
            for (let i = 0; i < 5; i++) spawnAsteroid();
            spawnFuel();
            last = performance.now();
            requestAnimationFrame(loop);
            window.removeEventListener('keydown', handler);
          }
        });
    }
  }

  requestAnimationFrame(loop);
})();
