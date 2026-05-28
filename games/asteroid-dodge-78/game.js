// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship and graphics enhancements
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 20,
    speed: 0,          // current speed magnitude
    maxSpeed: 4,
    angle: 0,          // in radians
    vx: 0,
    vy: 0,
  };
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Starfield background
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2,
  }));

  // Sound effects (using data URLs)
  const sounds = {
    thrust: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='), // silent placeholder
    collision: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=') // silent placeholder
  };

  // Asteroids
  const asteroids = [];
  const spawnAsteroid = () => {
    // Random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 2;
    const radius = 15 + Math.random() * 10;
    switch (edge) {
      case 0: // top
        x = Math.random() * width; y = -radius; vx = (Math.random() - 0.5) * speed; vy = speed; break;
      case 1: // bottom
        x = Math.random() * width; y = height + radius; vx = (Math.random() - 0.5) * speed; vy = -speed; break;
      case 2: // left
        x = -radius; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * speed; break;
      case 3: // right
        x = width + radius; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({ x, y, vx, vy, r: radius });
  };

  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  const update = (dt) => {
    // Move ship using velocity and input
    // Update velocity based on arrow keys (simple acceleration)
    const accel = 0.2;
    const anyThrust = keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight;
    if (keys.ArrowUp) ship.vy -= accel;
    if (keys.ArrowDown) ship.vy += accel;
    if (keys.ArrowLeft) ship.vx -= accel;
    if (keys.ArrowRight) ship.vx += accel;
    // Play thrust sound when accelerating
    if (anyThrust) { sounds.thrust.currentTime = 0; sounds.thrust.play(); }
    // Apply friction
    ship.vx *= 0.95;
    ship.vy *= 0.95;
    // Clamp speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > ship.maxSpeed) {
      ship.vx *= ship.maxSpeed / speed;
      ship.vy *= ship.maxSpeed / speed;
    }
    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Update ship angle to face movement direction
    if (speed > 0.01) ship.angle = Math.atan2(ship.vy, ship.vx);
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.size, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.size, ship.y));

    // Move asteroids and bounce
    for (const a of asteroids) {
      a.x += a.vx; a.y += a.vy;
      if (a.x - a.r < 0 || a.x + a.r > width) a.vx *= -1;
      if (a.y - a.r < 0 || a.y + a.r > height) a.vy *= -1;
    }
    // Update starfield positions for parallax effect
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = (ship.x + ship.size / 2) - a.x;
      const dy = (ship.y + ship.size / 2) - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.r + ship.size / 2) {
          gameOver = true;
          // Play collision sound
          sounds.collision.currentTime = 0;
          sounds.collision.play();
          break;
        }
    }

    // Spawn new asteroids every 2 seconds
    if (performance.now() - lastSpawn > 2000) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Increment score
    if (!gameOver) score += dt / 1000;
  };

const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#001020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (draw behind ship)
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // Ship (draw as rotated triangle)
    ctx.save();
    ctx.translate(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let lastTime = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
