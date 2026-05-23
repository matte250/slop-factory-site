// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: false,
    rotateDir: 0, // -1 left, 1 right
  };

  // Asteroid list
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const lastSpawn = { time: 0 };
  // Background stars for visual depth
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Input handling and sound setup
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  // Audio context for sounds
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
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
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      if (!keys[e.key]) {
        // key pressed newly
        if (e.key === 'ArrowUp') startThrustSound();
      }
      keys[e.key] = true;
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      if (e.key === 'ArrowUp') stopThrustSound();
      keys[e.key] = false;
    }
  });

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    const size = 15 + Math.random() * 20;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -size; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // right
        x = width + size; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * width; y = height + size; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 3: // left
        x = -size; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  function update(dt) {
    // Ship controls
    ship.rotateDir = 0;
    if (keys.ArrowLeft) ship.rotateDir = -1;
    else if (keys.ArrowRight) ship.rotateDir = 1;
    ship.angle += ship.rotateDir * 0.005 * dt; // rotate speed
    if (keys.ArrowUp) {
      const thrustPower = 0.001 * dt;
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
    }
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Lose if off-screen
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      gameOver();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // Remove if far off-screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver();
      }
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn.time > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn.time = performance.now();
    }
  }

function draw() {
    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw stars for depth
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship (triangle) with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body with gradient
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.fill();
    // Thrust flame when accelerating
    if (keys.ArrowUp) {
      ctx.beginPath();
      ctx.moveTo(-ship.radius, ship.radius / 4);
      ctx.lineTo(-ship.radius - ship.radius, 0);
      ctx.lineTo(-ship.radius, -ship.radius / 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
    ctx.restore();
    // Draw asteroids
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  let lastTime = performance.now();
  let running = true;
  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  function gameOver() {
    running = false;
    playExplosionSound();
    alert('Game Over');
  }

  // Start loop
  requestAnimationFrame(loop);
})();
