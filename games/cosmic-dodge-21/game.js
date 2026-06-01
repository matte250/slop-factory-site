// Minimal Cosmic Dodge game with enhanced graphics
// Canvas with id="game" must exist in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height - 60,
    radius: 8,
    angle: -Math.PI / 2, // point up
    vx: 0,
    vy: 0,
    thrust: 0.07,
    rotateSpeed: 0.07,
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Play thrust sound on ArrowUp press
    if (e.key === 'ArrowUp') beep(400, 0.08);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ----- Stars -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.5 + 0.2 });
  }

  // ----- Asteroids -----
  const asteroids = [];
  let asteroidTimer = 0;

  // ----- Timer -----
  const totalTime = 60; // seconds
  let timeLeft = totalTime;
  let lastTime = performance.now();
  let gameOver = false;

  function update(dt) {
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
    }
    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction / damping
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within bounds (wrap horizontally)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height) ship.y = height;

    // Update stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    }

    // Spawn asteroids
    asteroidTimer -= dt;
    if (asteroidTimer <= 0) {
      const size = Math.random() * 15 + 10;
      asteroids.push({ x: Math.random() * width, y: -size, radius: size, speed: Math.random() * 1.5 + 1 });
      asteroidTimer = Math.random() * 1000 + 500; // ms until next spawn
    }

    // Update asteroids and check collision
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        beep(200, 0.2); // collision sound
      }
    }

    // Timer countdown
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver = true;
    }
  }

  function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw timer
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
