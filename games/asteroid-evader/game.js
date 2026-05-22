// Asteroid Evader game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // Audio assets
  const collisionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='); // simple beep
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='); // placeholder loop
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play().catch(()=>{});

  // Ship configuration
  const shipWidth = 40;
  const shipHeight = 20;
  let shipX = (width - shipWidth) / 2;
  const shipY = height - shipHeight - 10;
  const shipSpeed = 5;
  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1 });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid configuration
  const asteroids = [];
  let asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let speedFactor = 1;
  const maxSpeedFactor = 3;

  // Game state
  let startTime = performance.now();
  const winTime = 30000; // survive 30 seconds
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (width - size);
    const speed = (Math.random() * 1.5 + 1) * speedFactor;
    asteroids.push({ x, y: -size, size, speed });
  }

  function update(dt) {
    if (gameOver) return;

    // Move ship
    if (keys.ArrowLeft) shipX = Math.max(0, shipX - shipSpeed);
    if (keys.ArrowRight) shipX = Math.min(width - shipWidth, shipX + shipSpeed);

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // gradually increase difficulty
      speedFactor = Math.min(maxSpeedFactor, speedFactor + 0.05);
      asteroidSpawnInterval = Math.max(400, asteroidSpawnInterval - 30);
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const shipRect = { x: shipX, y: shipY, w: shipWidth, h: shipHeight };
      const astRect = { x: a.x, y: a.y, w: a.size, h: a.size };
      if (
        shipRect.x < astRect.x + astRect.w &&
        shipRect.x + shipRect.w > astRect.x &&
        shipRect.y < astRect.y + astRect.h &&
        shipRect.y + shipRect.h > astRect.y
      ) {
        gameOver = true;
        collisionSound.play().catch(()=>{});
        break;
      }
    }

    // Win condition
    if (performance.now() - startTime >= winTime) {
      gameOver = true;
    }
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw starfield background
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Draw ship as a triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(shipX + shipWidth / 2, shipY);
    ctx.lineTo(shipX, shipY + shipHeight);
    ctx.lineTo(shipX + shipWidth, shipY + shipHeight);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#ffc');
      grad.addColorStop(1, '#a44');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      const msg = performance.now() - startTime >= winTime ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
