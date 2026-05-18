// Minimal Cosmic Drift game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(800, 80); }
  function playExplosion() { playTone(200, 300); }

  // Set canvas size to fill its container or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // Initialize star field
  const stars = [];
  const starCount = 120;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
    });
  }

  // Ship definition
  const ship = {
    x: canvas.width / 4,
    y: canvas.height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    radius: 10,
    thrust: 0.1,
    rotateSpeed: Math.PI / 180 * 3,
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const lastSpawn = { time: 0 };

  let score = 0;
  let lastTime = performance.now();
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume AudioContext on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp' || e.key === 'w') playThrust();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    const speed = Math.random() * 1.5 + 0.5;
    const y = Math.random() * canvas.height;
    asteroids.push({
      x: canvas.width + size,
      y,
      vx: -speed,
      radius: size,
    });
  }

  function update(dt) {
    // Move stars for parallax background
    const starSpeed = 0.4;
    for (const s of stars) {
      s.x -= starSpeed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }
    // Ship rotation
    if (keys.ArrowLeft || keys.a) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight || keys.d) ship.angle += ship.rotateSpeed;
    // Thrust
    if (keys.ArrowUp || keys.w) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Inertia
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Wrap around vertically
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
    // Keep ship horizontally within view (scroll effect)
    if (ship.x > canvas.width * 0.7) ship.x = canvas.width * 0.7;

    // Asteroid update
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      // Remove off‑screen asteroids
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn.time > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn.time = performance.now();
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        playExplosion();
        running = false;
        break;
      }
    }

    // Score based on time survived
    score = Math.floor((performance.now() - startTime) / 100);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw ship with gradient triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Create gradient for ship glow
    const shipGrad = ctx.createLinearGradient(-10, -7, 15, 0);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#fff');
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();

    // Draw stars (background)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  const startTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
