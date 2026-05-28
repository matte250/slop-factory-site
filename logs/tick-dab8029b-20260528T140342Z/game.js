// Simple Asteroid Dodge game based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playTone(600, 0.1); }
  function playExplosionSound() { playTone(150, 0.2); }
  function playGameOverSound() { playTone(80, 0.5); }

  // Ship definition (triangle)
  const ship = {
    w: 60,
    h: 20,
    x: width / 2 - 30,
    y: height - 30,
    speed: 5,
    // Use a gradient for nicer look
    color: null
  };

  // Laser (single bullet at a time)
  const laser = {
    active: false,
    x: 0,
    y: 0,
    w: 4,
    h: 12,
    speed: 8,
    color: '#f00'
  };

  // Asteroid collection
  const asteroids = [];
  // Star field for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const asteroidSpeedBase = 1.5;
  const asteroidSpeedIncrement = 0.0005; // per ms

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { audioCtx.resume(); keys[e.code] = true; if (e.code === 'Space') fireLaser(); });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function fireLaser() {
    if (!laser.active) {
      laser.active = true;
      laser.x = ship.x + ship.w / 2 - laser.w / 2;
      laser.y = ship.y;
      playLaserSound();
    }
  }

  function spawnAsteroid() {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    asteroids.push({
      x,
      y: -radius,
      r: radius,
      speed: asteroidSpeedBase + Math.random() * 1.5,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 0.02 // rotate slowly
    });
  }

  function update(delta) {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft'] || keys['KeyA']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Update laser
    if (laser.active) {
      laser.y -= laser.speed;
      if (laser.y + laser.h < 0) laser.active = false;
    }

    // Spawn asteroids over time
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed + asteroidSpeedIncrement * performance.now();
      // Collision with ship
      if (
        a.x + a.r > ship.x &&
        a.x - a.r < ship.x + ship.w &&
        a.y + a.r > ship.y &&
        a.y - a.r < ship.y + ship.h
      ) {
          gameOver = true;
          playGameOverSound();
          }

      }
      // Remove if off screen
      if (a.y - a.r > height) {
        gameOver = true;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship as triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00f');
    shipGrad.addColorStop(1, '#88f');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Laser with glow
    if (laser.active) {
      ctx.save();
      ctx.shadowColor = 'red';
      ctx.shadowBlur = 10;
      ctx.fillStyle = laser.color;
      ctx.fillRect(laser.x, laser.y, laser.w, laser.h);
      ctx.restore();
    }

    // Asteroids with radial gradient
    ctx.fillStyle = '#555'; // fallback
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
