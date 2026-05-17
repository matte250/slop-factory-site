// Game: Asteroid Dodge
// Canvas with id="game" is expected in the HTML.
// Arrow keys move the ship. Asteroids spawn from the edges and move toward the ship.
// Survive as long as possible; score = seconds survived.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    speed: 200, // pixels per second
    angle: 0,
  };

  // Input handling and sound setup
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  // Audio context (created on first user interaction)
  let audioCtx = null;
  const initAudio = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  };
  const playTone = (freq, duration) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(200, 0.05);
  const playExplosion = () => playTone(100, 0.3);

  let lastThrustTime = 0;
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      initAudio();
    }
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroid definition
  const asteroids = [];
  let asteroidSpawnTimer = 0;
  const spawnInterval = 1.5; // seconds
  let baseAsteroidSpeed = 80;
  let elapsed = 0;
  let lastTimestamp = 0;
  let gameOver = false;

  function spawnAsteroid() {
    // Choose a random edge
    const edge = Math.floor(Math.random() * 4); // 0=top,1=right,2=bottom,3=left
    let x, y, vx, vy;
    const angleToShip = Math.atan2(ship.y - y, ship.x - x);
    const speed = baseAsteroidSpeed + elapsed * 5; // increase over time
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -20;
        break;
      case 1: // right
        x = width + 20;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 20;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * height;
        break;
    }
    const angle = Math.atan2(ship.y - y, ship.x - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, vx, vy, radius: 12 + Math.random() * 8 });
  }

  // Additional visual assets
  const STAR_COUNT = 80;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.5 + 0.5 });
  }

  function update(dt) {
    if (gameOver) return;
    // Move ship based on input
    let dx = 0, dy = 0;
    if (keys.ArrowUp) dy -= 1;
    if (keys.ArrowDown) dy += 1;
    if (keys.ArrowLeft) dx -= 1;
    if (keys.ArrowRight) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      dx = (dx / length) * ship.speed * dt;
      dy = (dy / length) * ship.speed * dt;
      ship.x = Math.min(width, Math.max(0, ship.x + dx));
      ship.y = Math.min(height, Math.max(0, ship.y + dy));
      ship.vx = dx / dt;
      ship.vy = dy / dt;
      // Play thrust sound, rate‑limited
      const now = performance.now();
      if (now - lastThrustTime > 100) {
        playThrust();
        lastThrustTime = now;
      }
    } else {
      ship.vx = 0;
      ship.vy = 0;
    }

    // Twinkling stars – subtle radius change
    for (const s of stars) {
      s.radius += (Math.random() - 0.5) * 0.05;
      if (s.radius < 0.3) s.radius = 0.3;
      if (s.radius > 2) s.radius = 2;
    }

    // Spawn asteroids
    asteroidSpawnTimer += dt;
    if (asteroidSpawnTimer >= spawnInterval) {
      asteroidSpawnTimer -= spawnInterval;
      spawnAsteroid();
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }

    // Collision detection
    for (const a of asteroids) {
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        break;
      }
    }

    // Remove off-screen asteroids to avoid memory leak
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
      }
    }
  }

  function draw() {
    // Clear and draw background stars with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (triangle) with rotation based on movement direction
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const shipAngle = Math.atan2(ship.vy || 0, ship.vx || 0);
    ctx.rotate(shipAngle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fillStyle = 'cyan';
    ctx.fill();
    // thrust flame when accelerating
    if (ship.vx !== 0 || ship.vy !== 0) {
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(-ship.radius * 0.5, ship.radius + 10);
      ctx.lineTo(ship.radius * 0.5, ship.radius + 10);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // Asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(elapsed)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;
    if (!gameOver) elapsed += dt;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
