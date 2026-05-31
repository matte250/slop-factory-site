// game.js – simple Asteroid Run implementation
// Targets <canvas id="game"></canvas> present in the HTML page.
// Controls: Arrow keys / WASD – left/right rotate, up thrust.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Pre‑generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }
  // Sound assets (public domain URLs)
  const sounds = {
    thrust: new Audio('https://cdn.jsdelivr.net/gh/joshua-simpson/free-audio/laser.wav'),
    collision: new Audio('https://cdn.jsdelivr.net/gh/joshua-simpson/free-audio/explosion.wav'),
    bg: new Audio('https://cdn.jsdelivr.net/gh/joshua-simpson/free-audio/space.mp3'),
    gameOver: new Audio('https://cdn.jsdelivr.net/gh/joshua-simpson/free-audio/gameover.wav'),
  };
  sounds.bg.loop = true;
  sounds.bg.volume = 0.3;
  sounds.bg.play().catch(() => {}); // autoplay may be blocked



  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height * 0.8,
    angle: -Math.PI / 2, // pointing up
    radius: 10,
    vx: 0,
    vy: 0,
    shield: 100,
  };

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 20;
    asteroids.push({
      x: Math.random() * width,
      y: -radius,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 1.5,
      radius,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
    });
  }

  // ----- Game Loop -----
  function update(dt) {
    // Ship controls
    if (keys['arrowleft'] || keys['a']) ship.angle -= 0.04;
    if (keys['arrowright'] || keys['d']) ship.angle += 0.04;
    if (keys['arrowup'] || keys['w']) {
      const thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      // Play thrust sound (allow overlapping)
      sounds.thrust.cloneNode().play();
    }
    // Apply velocity & simple damping
    ship.x += ship.vx;
    ship.y += ship.vy;
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship inside bounds (wrap horizontally)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height) ship.y = height;

    // Asteroids movement and rotation
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotSpeed;
      // Remove off‑screen
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection (circle vs circle)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        ship.shield -= 20; // damage
        asteroids.splice(i, 1);
        // Play collision sound
        sounds.collision.cloneNode().play();
        if (ship.shield <= 0) {
          // Game over – stop animation loop
          cancelAnimationFrame(animId);
          // Play game over sound
          sounds.gameOver.cloneNode().play();
          alert('Game Over');
          return;
        }
      }
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // Clear with dark space gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#001');
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Draw ship with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // Draw asteroids with rotation and rough edges
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      ctx.beginPath();
      // irregular polygon approximating a rock
      const points = 8;
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const rad = a.radius * (0.7 + Math.random() * 0.6);
        ctx.lineTo(Math.cos(angle) * rad, Math.sin(angle) * rad);
      }
      ctx.closePath();
      ctx.fillStyle = '#777';
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.stroke();
      ctx.restore();
    }
    // Draw shield bar with gradient background
    const barX = 10, barY = 10, barW = 100, barH = 10;
    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, '#ff0000');
    grad.addColorStop(1, '#00ff00');
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, ship.shield, barH);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(barX, barY, barW, barH);
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
})();
