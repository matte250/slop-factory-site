// Simple Space Dodger game with enhanced graphics
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Starfield background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  const unlockAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', unlockAudio, {once: true});

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 15,
    speed: 3,
    dx: 0,
    dy: 0,
    color: '#0f0',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  const asteroidOpts = {
    minSize: 10,
    maxSize: 30,
    minSpeed: 0.5,
    maxSpeed: 2,
    spawnInterval: 1500, // ms
  };

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, vx, vy;
    const size = Math.random() * (asteroidOpts.maxSize - asteroidOpts.minSize) + asteroidOpts.minSize;
    const speed = Math.random() * (asteroidOpts.maxSpeed - asteroidOpts.minSpeed) + asteroidOpts.minSpeed;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -size;
        vx = (Math.random() - 0.5) * speed; vy = speed;
        break;
      case 1: // right
        x = width + size; y = Math.random() * height;
        vx = -speed; vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * width; y = height + size;
        vx = (Math.random() - 0.5) * speed; vy = -speed;
        break;
      case 3: // left
        x = -size; y = Math.random() * height;
        vx = speed; vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({ x, y, vx, vy, size, color: '#888' });
    // Play spawn sound
    playTone(300, 0.05);
  }

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  // Track if ship is currently moving for sound
  let wasMoving = false;
  function update(dt) {
    // Move ship based on arrow keys
    ship.dx = ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    // Play thrust sound when movement starts or continues
    const isMoving = ship.dx !== 0 || ship.dy !== 0;
    if (isMoving && !wasMoving) {
      playTone(400, 0.04);
    }
    wasMoving = isMoving;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.dy));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidOpts.spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove if off-screen
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision detection (circle-square approx)
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
      if (dx < a.size + ship.size && dy < a.size + ship.size) {
        gameOver = true;
        // Play collision/explosion sound
        playTone(150, 0.2);
      }
    }

    if (!gameOver) score += dt;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      // move star for parallax effect
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });

    // Draw ship with rotation based on movement direction
    ctx.save();
    const angle = Math.atan2(ship.dy, ship.dx) || -Math.PI / 2; // default up
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(-ship.size, ship.size);
    ctx.lineTo(ship.size, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
