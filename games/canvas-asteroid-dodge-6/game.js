// Simple Canvas Asteroid Dodge game with enhanced visuals
// Assumes a <canvas id="game"></canvas> element in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Helper to play a beep sound
  function playBeep(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Starfield background (static array of stars)
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship state
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0,
    radius: 10,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    rotateSpeed: 0.05,
  };

  // Asteroid list
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  // Score (time survived in seconds)
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') {
      // Play thrust sound
      playBeep(440, 0.05);
    }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    // spawn at random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 0.5 + Math.random() * 0.5;
    if (edge === 0) { // top
      x = Math.random() * canvas.width;
      y = -radius;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // bottom
      x = Math.random() * canvas.width;
      y = canvas.height + radius;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else if (edge === 2) { // left
      x = -radius;
      y = Math.random() * canvas.height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    } else { // right
      x = canvas.width + radius;
      y = Math.random() * canvas.height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    }
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed * dt;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed * dt;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    }
    // Apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Boundary check (lose if out of bounds)
    if (
      ship.x < 0 || ship.x > canvas.width ||
      ship.y < 0 || ship.y > canvas.height
    ) {
      // Play boundary collision sound
      playBeep(220, 0.3);
      gameOver = true;
    }

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > canvas.width + a.radius || a.y < -a.radius || a.y > canvas.height + a.radius) {
        asteroids.splice(i, 1);
      }
    }

    // Collision detection (circle approximations)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.radius + ship.radius) {
      // Play collision sound on asteroid hit
      playBeep(110, 0.4);
      gameOver = true;
      break;
    }
    }

    // Spawn asteroids over time
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function drawBackground() {
    // Black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -10);
    ctx.lineTo(-10, 10);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      gradient.addColorStop(0, '#777');
      gradient.addColorStop(1, '#222');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawScore() {
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${seconds}s`, 10, 20);
  }

  function loop(timestamp) {
    const dt = (timestamp - (loop.last ?? timestamp)) / 16; // normalize to ~60fps steps
    loop.last = timestamp;
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      const seconds = ((timestamp - startTime) / 1000).toFixed(1);
      ctx.fillText(`Score: ${seconds}s`, canvas.width / 2, canvas.height / 2 + 30);
      return;
    }
    drawBackground();
    update(dt);
    drawShip();
    drawAsteroids();
    drawScore();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
