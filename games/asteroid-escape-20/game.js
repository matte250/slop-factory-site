// Minimal Asteroid Escape game
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = {
    x: 50,
    y: height / 2,
    w: 30,
    h: 20,
    speed: 4,
    color: '#0f0',
  };

  let health = 3;
  let score = 0;
  let distance = 0;
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const keys = {};

  // Starfield data
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
    });
  }

  // Ship rotation angle (radians)
  let shipAngle = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      r: size,
      speed: Math.random() * 2 + 2,
    });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp within canvas
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update ship rotation based on movement direction
    const moveX = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    const moveY = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (moveX !== 0 || moveY !== 0) {
      shipAngle = Math.atan2(moveY, moveX);
    }

    // Spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // collision detection (circle-rect)
      const closestX = Math.max(ship.x, Math.min(a.x, ship.x + ship.w));
      const closestY = Math.max(ship.y, Math.min(a.y, ship.y + ship.h));
      const distX = a.x - closestX;
      const distY = a.y - closestY;
      if (distX * distX + distY * distY < a.r * a.r) {
        health--;
        asteroids.splice(i, 1);
        // Collision sound
        playTone(150, 0.2);
        if (health <= 0) {
          // Game over sound
          playTone(80, 0.5);
          alert('Game Over! Score: ' + Math.floor(score));
          document.location.reload();
          return;
        }
      } else if (a.x + a.r < 0) {
        asteroids.splice(i, 1);
        score += 10;
        // Score increase sound
        playTone(600, 0.1);
      }
    }

    distance += ship.speed * dt * 0.001; // simplistic distance metric
    score = distance * 2; // points based on distance
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    // Draw ship as triangle with rotation
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(shipAngle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(-ship.w / 2, -ship.h / 2);
    ctx.lineTo(ship.w / 2, 0);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Health: ' + health, 10, 20);
    ctx.fillText('Score: ' + Math.floor(score), 10, 40);
  }

  let lastTime = performance.now();
  function loop(time) {
    const dt = time - lastTime;
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
