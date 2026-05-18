// Astro Dodge game implementation
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.07,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  // Audio context and sound functions
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.1); }
  function playCrash() { playTone(100, 0.4); }
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Stars for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const maxAsteroidSize = 30;
  function createAsteroidShape(size) {
    const points = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const radius = size * (0.6 + Math.random() * 0.4);
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    return points;
  }
  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let x, y, vx, vy;
    const size = Math.random() * (maxAsteroidSize - 10) + 10;
    const speed = Math.random() * 1.5 + 0.5;
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
    const shape = createAsteroidShape(size);
    const rotation = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // slow spin
    asteroids.push({ x, y, vx, vy, size, shape, rotation, rotSpeed });
  }
  let lastSpawn = 0;

  // Scoring
  let startTime = null;
  let score = 0;
  let gameOver = false;

  let crashPlayed = false;
function update(dt) {
    if (gameOver) return;
    // Ship rotation
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    // Thrust
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      playThrust();
    }
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Keep ship within bounds (wrap or game over). Here we end game if out of canvas.
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      if (!crashPlayed) { playCrash(); crashPlayed = true; }
      gameOver = true;
    }

    // Update asteroids and rotation
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.rotSpeed) a.rotation += a.rotSpeed;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection (circle approx)
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.size) {
        if (!crashPlayed) { playCrash(); crashPlayed = true; }
        gameOver = true;
        break;
      }
    }

    // Scoring based on survival time
    const now = Date.now();
    if (!startTime) startTime = now;
    score = Math.floor((now - startTime) / 1000);

    // Spawn new asteroids
    if (now - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = now;
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#000040');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw background stars (twinkling)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const s of stars) {
      // slight flicker
      if (Math.random() < 0.02) continue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle) with stroke
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    ctx.fillStyle = '#00ffcc';
    ctx.strokeStyle = '#006655';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw asteroids with irregular shapes
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      const shape = a.shape || createAsteroidShape(a.size);
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation || 0);
      ctx.beginPath();
      shape.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastTimestamp || timestamp);
    lastTimestamp = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastTimestamp = 0;
  requestAnimationFrame(loop);
})();
