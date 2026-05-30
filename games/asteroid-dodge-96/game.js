// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
// Arrow keys / WASD control the ship: left/right rotate, up thrust.
// Asteroids spawn from the right and move left. Collision ends the game.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 150;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
  function playGameOverSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = {
    x: width / 4,
    y: height / 2,
    angle: 0, // radians
    radius: 12,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: Math.PI / 180 * 3,
  };

  const asteroids = [];
  // Explosion particles
  const particles = [];
  let explosion = false;
  // Background stars for parallax effect
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.2 + Math.random() * 0.3,
    });
  }
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms
  let gameOver = false;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function update(dt) {
    // Update background stars for parallax
    for (const s of stars) {
      s.x -= s.speed * dt * 60; // speed relative to frame rate
      if (s.x < 0) s.x = width;
    }
    if (gameOver) return;
    // Ship rotation
    if (keys['arrowleft'] || keys['a']) ship.angle -= ship.rotateSpeed;
    if (keys['arrowright'] || keys['d']) ship.angle += ship.rotateSpeed;
    // Ship thrust
    if (keys['arrowup'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within bounds
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Spawn asteroids
    const now = performance.now();
    if (now - lastSpawn > spawnInterval) {
      lastSpawn = now;
      const size = Math.random() * 30 + 10;
      asteroids.push({
        x: width + size,
        y: Math.random() * height,
        radius: size,
        vx: - (Math.random() * 0.1 + 0.05), // leftward
        angle: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 0.02,
      });
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.angle += a.angularVel * dt;
      // Remove if off screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
    // Update explosion particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt; // fade over 1 second
      if (p.life <= 0) particles.splice(i, 1);
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.radius + ship.radius) {
        gameOver = true;
        // Stop thrust sound
        stopThrustSound();
        // Generate explosion particles
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
          });
        }
        // Play sounds
        playExplosionSound();
        playGameOverSound();
        break;
      }
    }
  }

  function draw() {
    // Draw background stars and apply motion trail
    // Fill with semi-transparent black for trailing effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    // Draw stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Ship (gradient triangle with thrust flame)
    // Draw thrust flame if accelerating
    if (keys['arrowup'] || keys['w']) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.radius, 0);
      ctx.lineTo(-ship.radius - 8, -5);
      ctx.lineTo(-ship.radius - 8, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Ship body with radial gradient
    const grad = ctx.createRadialGradient(ship.x, ship.y, ship.radius * 0.2, ship.x, ship.y, ship.radius);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#050');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids (rotating polygons for visual flair)
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      // draw a simple 5‑point star shape
      const points = 5;
      for (let i = 0; i < points; i++) {
        const theta = (i / points) * Math.PI * 2;
        const r = i % 2 === 0 ? a.radius : a.radius * 0.5;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // Explosion particles (fading)
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,165,0,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
