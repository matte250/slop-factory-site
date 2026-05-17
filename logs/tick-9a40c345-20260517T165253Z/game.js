// Edge Runner game implementation
// Assumes an existing <canvas> element in the HTML page

(() => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return console.error('Canvas element not found');
  const ctx = canvas.getContext('2d');

  // Canvas sizing
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;
  const { width, height } = canvas;

  // Game constants
  const GRAVITY = 0.4; // downward acceleration per frame
  const THRUST = -8;   // instant upward velocity on tap/click
  const SHIP_X = 80;   // horizontal position of the ship
  const SHIP_SIZE = 20; // ship rendered as a triangle
  const ASTEROID_RADIUS = 20;
  const ASTEROID_SPEED = 4; // horizontal speed (leftward)
  const SPAWN_INTERVAL = 1500; // ms between asteroids

  let shipY = height / 2;
  let shipVy = 0;
  let asteroids = [];
  let lastSpawn = 0;
  let lastTime = 0;
  let running = true;

  const reset = () => {
    shipY = height / 2;
    shipVy = 0;
    asteroids = [];
    lastSpawn = 0;
    lastTime = 0;
    running = true;
    requestAnimationFrame(loop);
  };

  const spawnAsteroid = () => {
    const y = Math.random() * (height - ASTEROID_RADIUS * 2) + ASTEROID_RADIUS;
    asteroids.push({ x: width + ASTEROID_RADIUS, y, r: ASTEROID_RADIUS });
  };

  const handleInput = () => {
    shipVy = THRUST;
  };

  // Mouse / touch handling
  canvas.addEventListener('mousedown', handleInput);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); handleInput(); });

  const detectCollision = (ax, ay, ar) => {
    // Approximate ship as a point at its center (SHIP_X, shipY)
    const dx = ax - SHIP_X;
    const dy = ay - shipY;
    return dx * dx + dy * dy < (ar + SHIP_SIZE / 2) ** 2;
  };

  const loop = timestamp => {
    if (!running) return;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // Update ship physics
    shipVy += GRAVITY;
    shipY += shipVy;
    // Clamp to canvas bounds
    if (shipY > height - SHIP_SIZE) {
      shipY = height - SHIP_SIZE;
      shipVy = 0;
    }
    if (shipY < SHIP_SIZE) {
      shipY = SHIP_SIZE;
      shipVy = 0;
    }

    // Spawn asteroids
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= ASTEROID_SPEED;
      // Remove off‑screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (detectCollision(a.x, a.y, a.r)) {
        running = false;
        break;
      }
    }

    // Draw
    ctx.clearRect(0, 0, width, height);
    // Ship (triangle pointing right)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(SHIP_X - SHIP_SIZE / 2, shipY + SHIP_SIZE / 2);
    ctx.lineTo(SHIP_X - SHIP_SIZE / 2, shipY - SHIP_SIZE / 2);
    ctx.lineTo(SHIP_X + SHIP_SIZE / 2, shipY);
    ctx.closePath();
    ctx.fill();
    // Asteroids
    ctx.fillStyle = '#a33';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }

    if (running) requestAnimationFrame(loop);
  };

  // Start the loop
  requestAnimationFrame(loop);
})();
