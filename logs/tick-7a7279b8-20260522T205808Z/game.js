// Simple Asteroid Dodge game
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Star field background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { playTone(150, 0.3); }
  function playSpawn() { playTone(300, 0.05); }
  function playStart() { playTone(400, 0.2); }

  // Ship (drawn as a triangle)
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 12, // size (half‑width of triangle)
    speed: 4,
    dx: 0,
    dy: 0,
    angle: 0, // radians, direction ship faces
  };

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  let asteroids = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let speedFactor = 1;

  // Game state
  let startTime = null;
  let gameOver = false;

  function reset() {
    ship.x = width / 2; ship.y = height / 2; ship.dx = ship.dy = 0;
    asteroids = [];
    spawnInterval = 2000;
    speedFactor = 1;
    startTime = performance.now();
    gameOver = false;
    // Ensure audio context is running
    if (audioCtx.state !== 'running') {
      audioCtx.resume();
    }
    playStart();
  }

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const radius = 10 + Math.random() * 20;
    const speed = 1.5 * speedFactor + Math.random();
    // Place on a random edge
    if (side === 0) { x = -radius; y = Math.random() * height; dx = speed; dy = (Math.random() - 0.5) * speed; }
    else if (side === 1) { x = width + radius; y = Math.random() * height; dx = -speed; dy = (Math.random() - 0.5) * speed; }
    else if (side === 2) { x = Math.random() * width; y = -radius; dx = (Math.random() - 0.5) * speed; dy = speed; }
    else { x = Math.random() * width; y = height + radius; dx = (Math.random() - 0.5) * speed; dy = -speed; }
    asteroids.push({ x, y, r: radius, dx, dy });
    playSpawn();
  }

  function update(dt) {
    // Ship movement
    ship.dx = ship.dy = 0;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    // Update ship angle when moving
    if (ship.dx !== 0 || ship.dy !== 0) {
      ship.angle = Math.atan2(ship.dy, ship.dx);
    }
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x + ship.dx));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y + ship.dy));

    // Asteroids movement
    asteroids.forEach(a => {
      a.x += a.dx * dt;
      a.y += a.dy * dt;
    });
    // Remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.x + a.r > -50 && a.x - a.r < width + 50 && a.y + a.r > -50 && a.y - a.r < height + 50);

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) { gameOver = true; playCollision(); break; }
    }

    // Increase difficulty
    if (!gameOver && performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // Gradually speed up and spawn more often
      speedFactor += 0.02;
      spawnInterval = Math.max(500, spawnInterval * 0.97);
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r);
    ctx.lineTo(-ship.r * 0.8, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids (shaded circles)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText('Click to restart', width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (lastFrame || timestamp)) / 16; // normalize ~60fps
    if (!gameOver) update(dt);
    draw();
    lastFrame = timestamp;
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => { if (gameOver) reset(); });
  reset();
  requestAnimationFrame(loop);
})();
