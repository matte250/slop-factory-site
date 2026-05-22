// Simple Asteroid Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Background stars
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship
  const ship = {
    x: width / 2,
    y: height - 40,
    radius: 12,
    speed: 4,
    dx: 0,
    dy: 0,
    draw() {
      // Gradient ship body
      const grad = ctx.createLinearGradient(this.x - this.radius, this.y - this.radius, this.x + this.radius, this.y + this.radius);
      grad.addColorStop(0, '#00ffff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.radius);
      ctx.lineTo(this.x - this.radius, this.y + this.radius);
      ctx.lineTo(this.x + this.radius, this.y + this.radius);
      ctx.closePath();
      ctx.fill();
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSettings = {
    minSize: 10,
    maxSize: 30,
    speedRange: [2, 5],
    spawnInterval: 1000 // ms
  };

  let lastSpawn = 0;
  let startTime = null;
  let gameOver = false;
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * (asteroidSettings.maxSize - asteroidSettings.minSize) + asteroidSettings.minSize;
    const x = Math.random() * (width - size * 2) + size;
    const y = -size;
    const speed = Math.random() * (asteroidSettings.speedRange[1] - asteroidSettings.speedRange[0]) + asteroidSettings.speedRange[0];
    asteroids.push({ x, y, r: size, speed });
    // subtle spawn sound
    playBeep(150, 0.05);
  }

  function update(delta) {
    // Move ship
    ship.x += ship.dx;
    ship.y += ship.dy;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Move stars (parallax effect)
    for (const s of stars) {
      s.y += 0.5; // slow downwards drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off-screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        // collision sound
        playBeep(300, 0.2);
        gameOver = true;
        break;
      }
    }

    // Score based on survival time
    if (!gameOver && startTime !== null) {
      score = ((Date.now() - startTime) / 1000).toFixed(2);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship
    ship.draw();
    // Draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle stroke
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px monospace';
      ctx.fillText(`Survived: ${score}s`, width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const delta = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;

    if (!gameOver) {
      if (timestamp - lastSpawn > asteroidSettings.spawnInterval) {
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(delta);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Keyboard handling
  const keys = {};
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') ship.dx = -ship.speed;
    if (e.key === 'ArrowRight') ship.dx = ship.speed;
    if (e.key === 'ArrowUp') ship.dy = -ship.speed;
    if (e.key === 'ArrowDown') ship.dy = ship.speed;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') ship.dx = 0;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') ship.dy = 0;
  });

  // Start the game loop
  requestAnimationFrame(loop);
})();
