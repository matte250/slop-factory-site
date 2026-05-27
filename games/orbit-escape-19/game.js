// Simple arcade game based on IDEA.md
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // ---- Game objects ----
  const planet = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 40,
  };

  const ship = {
    x: planet.x,
    y: planet.y - planet.r - 20,
    angle: Math.PI / 2, // pointing up
    velX: 0,
    velY: 0,
    radius: 10,
  };

  const asteroids = [];
  const ASTEROID_MIN_R = 8;
  const ASTEROID_MAX_R = 25;
  const SPAWN_INTERVAL = 2000; // ms

  let lastSpawn = 0;
  let lastTime = performance.now();
  let running = true;

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function update(dt) {
    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= 3 * dt; // rad/s
    if (keys['ArrowRight']) ship.angle += 3 * dt;
    // Thrust
    if (keys['ArrowUp']) {
      const thrust = 200; // px/s^2
      ship.velX += Math.cos(ship.angle) * thrust * dt;
      ship.velY += Math.sin(ship.angle) * thrust * dt;
      // play thrust sound
      playSound(400, 'square', 0.05);
    }
    // Apply velocity
    ship.x += ship.velX * dt;
    ship.y += ship.velY * dt;

    // Simple drag to prevent endless drift
    ship.velX *= 0.99;
    ship.velY *= 0.99;

    // Spawn asteroids
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    asteroids.forEach((a) => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    });

    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.r) {
        endGame();
        return;
      }
    }

    // Lose if ship leaves canvas
    if (
      ship.x < 0 || ship.x > WIDTH || ship.y < 0 || ship.y > HEIGHT
    ) {
      endGame();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw stars background (gradient with twinkling stars)
    // simple star field generated once
    if (!window._starField) {
      const starCount = 100;
      window._starField = [];
      for (let i = 0; i < starCount; i++) {
        window._starField.push({
          x: Math.random() * WIDTH,
          y: Math.random() * HEIGHT,
          r: Math.random() * 1.5 + 0.5,
        });
      }
    }
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    window._starField.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Planet with radial gradient and subtle atmosphere
    const planetGrad = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.r * 0.3,
      planet.x,
      planet.y,
      planet.r
    );
    planetGrad.addColorStop(0, '#6ab7ff'); // bright center
    planetGrad.addColorStop(1, '#2c3e50'); // darker edge
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // atmosphere glow
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r + 4, 0, Math.PI * 2);
    ctx.stroke();

    // Ship (triangle) with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 2, ship.radius);
    ctx.lineTo(-ship.radius / 2, ship.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (keys['ArrowUp']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 4, ship.radius + 10);
      ctx.lineTo(-ship.radius / 4, ship.radius + 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Asteroids with radial gradient for depth
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x,
        a.y,
        a.r * 0.2,
        a.x,
        a.y,
        a.r
      );
      grad.addColorStop(0, '#c0c0c0');
      grad.addColorStop(1, '#7f8c8d');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function loop(timestamp) {
    if (!running) return;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function spawnAsteroid() {
    // Random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { // top
      x = Math.random() * WIDTH;
      y = -ASTEROID_MAX_R;
    } else if (edge === 1) { // right
      x = WIDTH + ASTEROID_MAX_R;
      y = Math.random() * HEIGHT;
    } else if (edge === 2) { // bottom
      x = Math.random() * WIDTH;
      y = HEIGHT + ASTEROID_MAX_R;
    } else { // left
      x = -ASTEROID_MAX_R;
      y = Math.random() * HEIGHT;
    }
    const r = ASTEROID_MIN_R + Math.random() * (ASTEROID_MAX_R - ASTEROID_MIN_R);
    // Velocity towards planet center
    const angle = Math.atan2(planet.y - y, planet.x - x);
    const speed = 50 + Math.random() * 50; // px/s
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, r, vx, vy });
  }

  function endGame() {
    running = false;
    // play explosion / crash sound
    playSound(150, 'sawtooth', 0.3);
    alert('Game Over');
  }

  // Start loop
  requestAnimationFrame(loop);
})();
