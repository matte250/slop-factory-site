// Simple Space Runner game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Starfield background
  const stars = Array.from({length: 100}, () => ({x: Math.random()*width, y: Math.random()*height, size: Math.random()*2+1}));
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height - 60,
    r: 15,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    health: 3,
  };

  // Controls
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') playTone(400, 0.05);
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  // Particle effects for explosions
  const particles = [];
  const asteroidSpawnInterval = 1200; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * width,
      y: -size,
      r: size,
      vy: 1 + Math.random() * 2,
    });
  }

  function update(dt) {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // Move starfield
    stars.forEach(s => {
      s.y += 0.3; // slow downward drift
      if (s.y > height) { s.y = 0; s.x = Math.random()*width; }
    });
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= 0.06;
    if (keys.ArrowRight) ship.angle += 0.06;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * 0.1;
      ship.vy += Math.sin(ship.angle) * 0.1;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship inside canvas
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      // Remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Collision detection
    asteroids.forEach(a => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        ship.health--;
        // create explosion particles
        for (let i = 0; i < 15; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 500,
            size: Math.random() * 2 + 1,
          });
        }
        playTone(200, 0.2);
        a.y = height + a.r; // move asteroid out to be removed
      }
    });
  }

  function draw() {
  // Draw starfield background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
    // background already drawn
    // Draw ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fillStyle = ship.health > 0 ? '#0f0' : '#f00';
    ctx.fill();
    ctx.restore();
    // Draw asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw particles
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 500, 0);
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // UI health
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + ship.health, 10, 20);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (ship.health > 0) {
      update(dt);
      draw();
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
