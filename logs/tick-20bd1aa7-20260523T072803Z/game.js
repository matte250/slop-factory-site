// Canvas Asteroid Dodge – concise implementation
// The HTML includes <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: W / 2 - 20,
    y: H - 30,
    speed: 5,
    dir: 0, // -1 left, 1 right
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  // Load sound effects (tiny data URLs)
  const thrustSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAA=='); // short click
  const explodeSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAA=='); // reuse click as placeholder

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      keys.left = true;
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
    if (e.key === 'ArrowRight') {
      keys.right = true;
      thrustSound.currentTime = 0;
      thrustSound.play();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (W - radius * 2) + radius;
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function update(dt) {
    if (gameOver) return;

    // Move ship
    ship.dir = 0;
    if (keys.left) ship.dir = -1;
    if (keys.right) ship.dir = 1;
    ship.x += ship.dir * ship.speed;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Collision detection (simple circle‑rect)
      if (
        a.y + a.r > ship.y &&
        a.x > ship.x &&
        a.x < ship.x + ship.w
      ) {
        gameOver = true;
        explodeSound.currentTime = 0;
        explodeSound.play();
        break;
      }
      // Remove off‑screen
      if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // Increment score (per frame)
    score++;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Stars field (static small white dots)
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 100; i++) {
        window._stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.5 + 0.5 });
      }
    }
    ctx.fillStyle = '#fff';
    window._stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship – draw as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial gradient for glow
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ffa');
      grad.addColorStop(1, '#a00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score with outline for readability
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = '16px sans-serif';
    ctx.strokeText('Score: ' + Math.floor(score / 60), 10, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);

    // Game over overlay with larger font and outline
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#f00';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('Game Over', W / 2, H / 2);
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
