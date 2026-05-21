// Asteroid Dodge – improved graphics with sound
(function() {
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
  function playExplosion() {
    // low‑frequency burst
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Background stars
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 12,
    speed: 3,
    vx: 0,
    vy: 0,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Play a short tone for movement keys
    if (e.key.startsWith('Arrow')) playTone(440, 0.05);
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroid definition
  const asteroids = [];
  const spawnInterval = 1500; // ms
  const asteroidSpeed = 1.5;
  const baseAsteroidSize = 20;
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -baseAsteroidSize;
        break;
      case 1: // right
        x = width + baseAsteroidSize;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + baseAsteroidSize;
        break;
      case 3: // left
        x = -baseAsteroidSize;
        y = Math.random() * height;
        break;
    }
    const angle = Math.atan2(height / 2 - y, width / 2 - x);
    dx = Math.cos(angle) * asteroidSpeed;
    dy = Math.sin(angle) * asteroidSpeed;
    asteroids.push({ x, y, dx, dy, size: baseAsteroidSize + Math.random() * 10 });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship movement
    ship.vx = ship.vy = 0;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    if (keys.ArrowUp) ship.vy = -ship.speed;
    if (keys.ArrowDown) ship.vy = ship.speed;
    ship.x = Math.max(0, Math.min(width, ship.x + ship.vx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.vy));

    // Asteroids movement
    asteroids.forEach(a => {
      a.x += a.dx;
      a.y += a.dy;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.size || a.x > width + a.size || a.y < -a.size || a.y > height + a.size) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection
    for (const a of asteroids) {
      const dist = Math.hypot(a.x - ship.x, a.y - ship.y);
if (dist < a.size + ship.size) {
          gameOver = true;
          playExplosion();
          break;
        }
    }
  }

  function drawBackground() {
    // Dark space
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#ffffff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShip() {
    // Ship as white triangle with bold outline
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawAsteroid(a) {
    const gradient = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
    gradient.addColorStop(0, '#888888');
    gradient.addColorStop(1, '#222222');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    drawBackground();
    drawShip();
    asteroids.forEach(drawAsteroid);
    // Score
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#ffff00';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastSpawn || timestamp);
    if (!gameOver && timestamp - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
