// Nebula Drift – simple canvas game
// The HTML contains a <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 600);

  // Game state
  let score = 0;
  let fuel = 100; // percent
  let gameOver = false;

  // Ship
  const ship = {
    x: width / 2,
    y: height - 60,
    radius: 12,
    speedX: 0,
    speedY: -1.5, // forward thrust upward
    maxSpeed: 3,
  };

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play thrust sound on lateral movement keys
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') playThrust();
  });
  window.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine', volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.value = volume;
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect() { playTone(800, 0.08, 'triangle', 0.3); }
  function playExplosion() { playTone(200, 0.4, 'sawtooth', 0.5); }
  function playThrust() { playTone(400, 0.05, 'square', 0.1); }

  // Asteroids and orbs
  const asteroids = [];
  const orbs = [];
  const stars = [];
  const asteroidSpawnRate = 0.02; // per frame
  const orbSpawnRate = 0.01;

  // Generate static starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * width,
      y: -size,
      radius: size,
      speedY: Math.random() * 2 + 1,
    });
  }

  function spawnOrb() {
    const size = 8;
    orbs.push({
      x: Math.random() * width,
      y: -size,
      radius: size,
      speedY: 2,
    });
  }

  function update() {
    if (gameOver) return;

    // Fuel consumption
    fuel -= 0.05;
    if (fuel <= 0) fuel = 0;

    // Ship controls
    if (keys.ArrowLeft) ship.speedX = Math.max(ship.speedX - 0.1, -ship.maxSpeed);
    if (keys.ArrowRight) ship.speedX = Math.min(ship.speedX + 0.1, ship.maxSpeed);
    if (!keys.ArrowLeft && !keys.ArrowRight) ship.speedX *= 0.95; // friction

    ship.x += ship.speedX;
    ship.y += ship.speedY; // constant forward motion
    // Keep within bounds horizontally
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = 0; // cannot go off top

    // Spawn obstacles
    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    if (Math.random() < orbSpawnRate) spawnOrb();

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speedY;
      // collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) {
        playExplosion();
        gameOver = true;
        break;
      }
      // remove off-screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += o.speedY;
      const dx = o.x - ship.x;
      const dy = o.y - ship.y;
      if (Math.hypot(dx, dy) < o.radius + ship.radius) {
        score += 10;
        fuel = Math.min(fuel + 10, 100);
        playCollect();
        orbs.splice(i, 1);
        continue;
      }
      if (o.y - o.radius > height) orbs.splice(i, 1);
    }

    // End condition when fuel runs out
    if (fuel <= 0) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#001d3d'); // deep space blue
    skyGrad.addColorStop(1, '#000');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (pre-generated)
    ctx.fillStyle = '#fff';
    stars.forEach(st => ctx.fillRect(st.x, st.y, 1, 1));

    // Ship (triangular)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // Asteroids (radial gradient)
    asteroids.forEach((a) => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Orbs (glowing)
    orbs.forEach((o) => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.radius);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0.1)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start
  loop();
})();
