// Simple Asteroid Dodge game based on IDEA.md
// Assumes an HTML <canvas id="game"></canvas> exists.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Set canvas size (fallback to 800x600 if not set via CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Preload sounds (ensure files exist in the same directory)
  const sounds = {
    dodge: new Audio('dodge.wav'),
    crash: new Audio('crash.wav'),
  };

  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    movingLeft: false,
    movingRight: false,
  };

  // Asteroid definition
  const asteroids = [];
  let asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let asteroidSpeed = 2; // initial fall speed, will increase over time

  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.movingLeft = true;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.movingRight = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.movingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.movingRight = false;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const angle = 0;
    const rotationSpeed = (Math.random() - 0.5) * 0.05; // random rotation
    asteroids.push({ x, y: -radius, radius, speed: asteroidSpeed, angle, rotationSpeed });
  }

  function update(dt) {
    // Move ship
    if (ship.movingLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.movingRight) ship.x = Math.min(canvas.width - ship.width, ship.x + ship.speed);

    // Update starfield for parallax effect
    for (const s of stars) {
      s.y += 0.3; // slow downward drift
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Spawn asteroids based on interval
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
      // Gradually increase difficulty
      asteroidSpeed += 0.05;
      asteroidSpawnInterval = Math.max(300, asteroidSpawnInterval - 10);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove if off screen
        if (a.y - a.radius > canvas.height) {
          asteroids.splice(i, 1);
          score++;
          // Play dodge sound on successful avoidance
          sounds.dodge.currentTime = 0;
          sounds.dodge.play();
        }

    }

    // Collision detection
    for (const a of asteroids) {
      const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));

        if (distX <= shipRect.w / 2 + a.radius && distY <= shipRect.h / 2 + a.radius) {
          // Simple AABB-circle hit test
          gameOver = true;
          // Play crash sound on collision
          sounds.crash.currentTime = 0;
          sounds.crash.play();
          break;
        }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw stars (background)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (simple triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient and rotation
    for (const a of asteroids) {
      // Update rotation angle
      a.angle += a.rotationSpeed;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
      grad.addColorStop(0, '#ddd');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gameOver) update(dt);
    draw();

    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
