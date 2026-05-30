// Simple Space Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not found
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Sound assets
  const sounds = {
    thrust: new Audio('thrust.wav'),
    explosion: new Audio('explosion.wav'),
    bgm: new Audio('bgm.mp3'),
  };
  // Background music loop (optional)
  sounds.bgm.loop = true;
  sounds.bgm.volume = 0.3;
  // Start music (ignore promise errors for autoplay restrictions)
  sounds.bgm.play().catch(() => {});

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    radius: 10,
    angle: 0,
    speed: 2,
    vx: 0,
    vy: 0,
    fuel: 100, // percent
  };

  // Asteroid pool
  const asteroids = [];
  const maxAsteroids = 30;

  // Score (seconds survived)
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  // Helper: distance between two points
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

  // Spawn an asteroid from a random edge
  const spawnAsteroid = () => {
    const size = 8 + Math.random() * 12;
    let x, y, vx, vy;
    const edge = Math.floor(Math.random() * 4);
    const speed = 1 + Math.random() * 1.5;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -size;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = width + size;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + size;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else { // left
      x = -size;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  };

  // Steering: click/tap sets ship angle toward pointer
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    ship.angle = Math.atan2(my - ship.y, mx - ship.x);
    ship.vx = Math.cos(ship.angle) * ship.speed;
    ship.vy = Math.sin(ship.angle) * ship.speed;
    // Play thrust sound
    sounds.thrust.currentTime = 0;
    sounds.thrust.play().catch(() => {});
  });

  const update = (dt) => {
    if (gameOver) return;

    // Move ship (drift)
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Wrap ship around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Reduce fuel
    ship.fuel -= dt * 0.01; // fuel per ms
    if (ship.fuel <= 0) ship.fuel = 0;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
      }
    }

    // Spawn new asteroids gradually
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) {
      spawnAsteroid();
    }

    // Collision detection
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.radius) {
        gameOver = true;
        // Play explosion sound
        sounds.explosion.currentTime = 0;
        sounds.explosion.play().catch(() => {});
        break;
      }
    }
    if (ship.fuel <= 0) gameOver = true;

    // Update score
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (static points)
    if (!window._stars) {
      window._stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.5,
      }));
    }
    ctx.fillStyle = '#fff';
    for (const s of window._stars) {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ship with gradient and subtle thrust trail
    ctx.save();
    // thrust trail (simple line)
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(ship.x - Math.cos(ship.angle) * 14, ship.y - Math.sin(ship.angle) * 14);
    ctx.lineTo(ship.x - Math.cos(ship.angle) * 4, ship.y - Math.sin(ship.angle) * 4);
    ctx.stroke();

    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 12);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with radial gradient for depth
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${score}s`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
