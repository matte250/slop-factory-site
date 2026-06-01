// Asteroid Dodge Game
// Canvas with id="game" must exist in the HTML.
// Simple implementation based on IDEA.md specifications.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaserSound() { playSound(400, 0.1); }
  function playExplosionSound() { playSound(150, 0.2); }
  function playHitSound() { playSound(80, 0.15); }

  const width = canvas.width;
  const height = canvas.height;

  // Game state
  let lives = 3;
  let score = 0;
  let lastAsteroidTime = 0;
  let asteroidInterval = 1500; // ms
  const asteroids = [];
  let laser = null; // {x, y, radius, active}
  const keys = { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false, Space: false };

  // Ship definition
  const ship = {
    width: 30,
    height: 30,
    x: width / 2,
    y: height - 40,
    speed: 5,
    color: '#0f0',
  };

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.code in keys) keys[e.code] = true;
    if (e.code === 'Space') fireLaser();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code in keys) keys[e.code] = false;
  });

  function fireLaser() {
    if (laser && laser.active) return; // one laser at a time
    laser = { x: ship.x, y: ship.y, radius: 5, active: true };
    playLaserSound();
  }

  function spawnAsteroid() {
    const radius = Math.random() * 20 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 1 + Math.random() * 2 + score * 0.001; // accelerate over time
    asteroids.push({ x, y: -radius, radius, speed, color: '#888' });
  }

  function update(dt) {
    // Move ship
    if (keys.ArrowLeft || keys.KeyA) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.KeyD) ship.x += ship.speed;
    ship.x = Math.max(ship.width / 2, Math.min(width - ship.width / 2, ship.x));

    // Update laser
    if (laser && laser.active) {
      laser.y -= 7;
      if (laser.y < 0) laser.active = false;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.width / 2) {
        playHitSound();
        lives--;
        asteroids.splice(i, 1);
        if (lives <= 0) {
          // Game over – stop animation loop
          cancelAnimationFrame(animationId);
          drawGameOver();
          return;
        }
        continue;
      }
      // Collision with laser
      if (laser && laser.active) {
        const ldx = a.x - laser.x;
        const ldy = a.y - laser.y;
        const ldist = Math.hypot(ldx, ldy);
        if (ldist < a.radius + laser.radius) {
          score += Math.floor(10 * a.radius);
          laser.active = false;
          playExplosionSound();
          asteroids.splice(i, 1);
          continue;
        }
      }
      // Remove off-screen asteroids
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
        score += 1; // survived asteroid
      }
    }

    // Spawn new asteroids based on interval
    const now = Date.now();
    if (now - lastAsteroidTime > asteroidInterval) {
      spawnAsteroid();
      lastAsteroidTime = now;
      // gradually increase difficulty
      asteroidInterval = Math.max(300, asteroidInterval - 10);
    }
  }

  function draw() {
    // Draw star background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    // small twinkling stars
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      const sr = Math.random() * 1.5 + 0.5;
      ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * 0.5 + 0.5) + ')';
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.clearRect(0, 0, width, height);
    // Draw ship (triangle)
    // Ship with gradient fill
    const grad = ctx.createLinearGradient(ship.x - ship.width/2, ship.y - ship.height/2, ship.x + ship.width/2, ship.y + ship.height/2);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#090');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.height / 2);
    ctx.lineTo(ship.x - ship.width / 2, ship.y + ship.height / 2);
    ctx.lineTo(ship.x + ship.width / 2, ship.y + ship.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0c0';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Draw laser
    if (laser && laser.active) {
      // Laser with glowing gradient
      const grad = ctx.createRadialGradient(laser.x, laser.y, 0, laser.x, laser.y, laser.radius);
      grad.addColorStop(0, 'rgba(255,0,0,0.9)');
      grad.addColorStop(1, 'rgba(255,0,0,0.2)');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,0,0,0.7)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(laser.x, laser.y, laser.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Draw asteroids
    asteroids.forEach((a) => {
      // Asteroid with radial gradient
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      // subtle outer glow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    });
    // UI text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
  }

  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  let lastTime = 0;
  let animationId;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
