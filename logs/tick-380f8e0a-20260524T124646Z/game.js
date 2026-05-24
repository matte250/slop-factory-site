// Simple Asteroid Escape game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Pre‑generated starfield to avoid jittery stars each frame
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  // Load sound effects (placeholders, ensure files exist in project)
  const soundMove = new Audio('move.wav');
  const soundPoint = new Audio('point.wav');
  const soundExplosion = new Audio('explosion.wav');
  // Optional background music loop
  const bgMusic = new Audio('bg-music.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {}); // ignore autoplay restrictions

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    movingLeft: false,
    movingRight: false,
  };

  // Asteroid configuration
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  const lastSpawn = { time: 0 };
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') {
      ship.movingLeft = true;
      soundMove.currentTime = 0;
      soundMove.play();
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      ship.movingRight = true;
      soundMove.currentTime = 0;
      soundMove.play();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') ship.movingLeft = false;
    if (e.key === 'ArrowRight' || e.key === 'd') ship.movingRight = false;
  });

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = Math.random() * 2 + 1;
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // small rotation per frame
    asteroids.push({ x, y: -radius, radius, speed, rot, rotSpeed });
  }

  function update(delta) {
    if (gameOver) return;
    // Move ship
    if (ship.movingLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.movingRight) ship.x = Math.min(width - ship.width, ship.x + ship.speed);

    // Spawn asteroids
    if (performance.now() - lastSpawn.time > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn.time = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.rot += a.rotSpeed; // rotate asteroid
      // Check collision with ship (simple AABB vs circle)
      const shipRect = { x: ship.x, y: ship.y, w: ship.width, h: ship.height };
      const distX = Math.abs(a.x - (shipRect.x + shipRect.w / 2));
      const distY = Math.abs(a.y - (shipRect.y + shipRect.h / 2));
      if (distX > (shipRect.w / 2 + a.radius) || distY > (shipRect.h / 2 + a.radius)) {
        // no collision
        } else {
          // collision detected
          gameOver = true;
          soundExplosion.currentTime = 0;
          soundExplosion.play();
        }
      // Remove off‑screen asteroids and increment score
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
        score++;
        soundPoint.currentTime = 0;
        soundPoint.play();
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Simple starfield (pre‑generated)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Draw ship as a triangle for better visual
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y); // tip
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient shading and rotation
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot);
      const grad = ctx.createRadialGradient(0, 0, a.radius * 0.3, 0, 0, a.radius);
      grad.addColorStop(0, '#aaaaaa');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
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
