// Simple Asteroid Drift game with enhanced graphics
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  // Create a simple star field for background
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    radius: Math.random() * 1.5 + 0.5
  }));
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Load sound effects (tiny beep data URLs)
  const sndThrust = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const sndCollect = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const sndExplosion = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const sndGameOver = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Ship
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 10,
    speed: 0,
    angle: 0,
    thrust: 0.1,
    fuel: 100,
    maxFuel: 100,
  };

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    if (side === 0) { x = -size; y = Math.random() * H; vx = Math.random() * 1 + 0.5; vy = (Math.random() - 0.5) * 0.5; }
    else if (side === 1) { x = W + size; y = Math.random() * H; vx = -(Math.random() * 1 + 0.5); vy = (Math.random() - 0.5) * 0.5; }
    else if (side === 2) { x = Math.random() * W; y = -size; vx = (Math.random() - 0.5) * 0.5; vy = Math.random() * 1 + 0.5; }
    else { x = Math.random() * W; y = H + size; vx = (Math.random() - 0.5) * 0.5; vy = -(Math.random() * 1 + 0.5); }
    asteroids.push({x, y, vx, vy, r: size});
  }

  // Fuel cells
  const fuels = [];
  function spawnFuel() {
    const size = 8;
    const x = Math.random() * (W - size * 2) + size;
    const y = Math.random() * (H - size * 2) + size;
    fuels.push({x, y, r: size});
  }

  // Game loop
  let gameOver = false;
  let gameOverSoundPlayed = false;
  function update(dt) {
    if (gameOver) return;
    // Controls
    if (keys.ArrowUp) { ship.speed += ship.thrust; ship.fuel = Math.max(0, ship.fuel - 0.05); if (sndThrust.paused) sndThrust.play(); }
    if (keys.ArrowDown) { ship.speed = Math.max(0, ship.speed - ship.thrust); }
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;

    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // Wrap ship
    if (ship.x < -ship.r) ship.x = W + ship.r;
    if (ship.x > W + ship.r) ship.x = -ship.r;
    if (ship.y < -ship.r) ship.y = H + ship.r;
    if (ship.y > H + ship.r) ship.y = -ship.r;

    // Asteroids move
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // Remove off-screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.r || a.x > W + a.r || a.y < -a.r || a.y > H + a.r) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x; const dy = a.y - ship.y; const d = Math.hypot(dx, dy);
      if (d < a.r + ship.r) {
          sndExplosion.currentTime = 0;
          sndExplosion.play();
          gameOver = true;
        }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const d = Math.hypot(f.x - ship.x, f.y - ship.y);
      if (d < f.r + ship.r) {
        ship.fuel = Math.min(ship.maxFuel, ship.fuel + 30);
        fuels.splice(i, 1);
        sndCollect.currentTime = 0;
        sndCollect.play();
      }
    }
    if (ship.fuel <= 0) gameOver = true;

    // Spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
  }

  function draw() {
    // Draw star field background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship with slight gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-ship.r, -ship.r, ship.r, ship.r);
    shipGrad.addColorStop(0, '#e0e0ff');
    shipGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#333333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel cells with glow effect
    for (const f of fuels) {
      const glow = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2);
      glow.addColorStop(0, 'rgba(0,255,0,0.8)');
      glow.addColorStop(1, 'rgba(0,255,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel gauge
    ctx.fillStyle = 'yellow';
    ctx.fillRect(10, 10, ship.fuel, 10);
    if (gameOver) {
      if (!gameOverSoundPlayed) {
        sndGameOver.currentTime = 0;
        sndGameOver.play();
        gameOverSoundPlayed = true;
      }
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W/2 - 80, H/2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last; last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
