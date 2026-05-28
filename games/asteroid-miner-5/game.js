// Simple Asteroid Miner game with improved graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Resize canvas to displayed size (support retina)
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth * dpr;
  const height = canvas.clientHeight * dpr;
  canvas.width = width;
  canvas.height = height;
  ctx.scale(dpr, dpr);

  // Generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Duplicate canvas setup removed (using DPR-scaled canvas)

  // ----- Game state -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.1,
    rotationSpeed: 0.07,
    fuel: 100,
    fuelDrain: 0.02,
    fuelThrustDrain: 0.08,
  };

  let asteroids = [];
  let minerals = [];
  let score = 0;
  let gameOver = false;

  // ----- Helper functions -----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function dist(ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  }

  // ----- Input -----
  const keys = {};
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200;
    thrustOsc.type = 'square';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.02);
    thrustOsc.start();
    thrustOsc.gainNode = gain;
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.stop(audioCtx.currentTime + 0.2);
    thrustOsc = null;
  }
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    if (e.key === 'ArrowUp') startThrustSound();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp') stopThrustSound();
  });

  // ----- Spawn -----
  function spawnAsteroid() {
    const side = Math.floor(rand(0, 4));
    const pos = {
      x: side === 0 ? 0 : side === 1 ? width : rand(0, width),
      y: side === 2 ? 0 : side === 3 ? height : rand(0, height),
    };
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 1.5);
    asteroids.push({
      x: pos.x,
      y: pos.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(15, 30),
    });
  }

  function spawnMineral() {
    minerals.push({
      x: rand(0, width),
      y: rand(0, height),
      r: 6,
    });
  }

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  for (let i = 0; i < 3; i++) spawnMineral();

  // ----- Main loop -----
  function update(dt) {
    if (gameOver) return;

    // Fuel drain
    ship.fuel -= ship.fuelDrain * dt;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      // Thrust
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel -= ship.fuelThrustDrain * dt;
    }
    if (keys['ArrowLeft']) ship.angle -= ship.rotationSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotationSpeed;

    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x += width;
      if (a.x > width) a.x -= width;
      if (a.y < 0) a.y += height;
      if (a.y > height) a.y -= height;
    });

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
        if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.r) {
          // Collision sound
          playTone(150, 0.4);
          gameOver = true;
          break;
        }
    }
    for (let i = minerals.length - 1; i >= 0; i--) {
      const m = minerals[i];
      if (dist(ship.x, ship.y, m.x, m.y) < ship.radius + m.r) {
        score += 10;
        minerals.splice(i, 1);
        spawnMineral();
      }
    }

    // Periodic asteroid spawn
    if (Math.random() < 0.01) spawnAsteroid();
  }

  function draw() {
  // Draw starfield background
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });

    // Background already cleared by starfield fill

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.restore();

    // Draw asteroids
    // Draw asteroids with gradient shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw minerals
    ctx.fillStyle = 'gold';
    minerals.forEach(m => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, ship.fuel).toFixed(1)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(time) {
    const dt = (time - last) / 16; // approx 60fps scale
    last = time;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
