// Minimalist Asteroid Escape game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // Star speed for parallax effect
  const STAR_SPEED = 0.05;
  // Sound effects (simple beeps via data URIs)
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YVgAAAAA'); // short silent placeholder
  const explosionAudio = new Audio('data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQAAAAA='); // placeholder


  // Ship definition
  const ship = {
    x: 100,
    y: H / 2,
    r: 15,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  // Input handling
  const keys = {};
  let thrustPlaying = false;
  addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp' && !thrustPlaying) {
      thrustAudio.currentTime = 0;
      thrustAudio.play();
      thrustPlaying = true;
    }
  });
  addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') {
      thrustAudio.pause();
      thrustAudio.currentTime = 0;
      thrustPlaying = false;
    }
  });

  // Asteroid array and starfield
  const asteroids = [];
  const stars = [];
  const ASTEROID_INTERVAL = 1500; // ms
  let lastAsteroid = 0;
  // generate background stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Game state
  let score = 0;
  let alive = true;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const points = [];
    const sides = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const rad = size * (0.6 + Math.random() * 0.4);
      points.push({ x: Math.cos(angle) * rad, y: Math.sin(angle) * rad });
    }
    asteroids.push({
      x: W + size,
      y: Math.random() * H,
      r: size,
      speed: 1 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.01,
      points,
    });
  }

function update(dt) {
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed * dt;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed * dt;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust * dt;
      ship.vy += Math.sin(ship.angle) * ship.thrust * dt;
    }
    // Apply friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Keep ship in bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x > W) ship.x = W;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > H) ship.y = H;

    // Asteroids and stars
    const now = performance.now();
    if (now - lastAsteroid > ASTEROID_INTERVAL) {
      spawnAsteroid();
      lastAsteroid = now;
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      // rotate asteroid
      if (a.rotSpeed) a.angle += a.rotSpeed * dt;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
    // Update stars for parallax
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= STAR_SPEED * dt;
      if (s.x < 0) {
        s.x = W + s.r;
        s.y = Math.random() * H;
      }
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        alive = false;
        break;
      }
    }

    if (alive) score += dt * 0.01;
  }
    // Apply friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Keep ship in bounds
    if (ship.x < 0) ship.x = 0;
    if (ship.x > W) ship.x = W;
    if (ship.y < 0) ship.y = 0;
    if (ship.y > H) ship.y = H;

      // Asteroids (polygon shapes)
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      for (const a of asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle || 0);
        ctx.beginPath();
        const pts = a.points;
        if (pts && pts.length) {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, a.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        alive = false;
        break;
      }
    }

    if (alive) score += dt * 0.01;
  }

function draw() {
    // Space background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars (twinkling slight variation)
    ctx.fillStyle = '#777';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (with optional thrust flame)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    // Thrust flame when accelerating
    if (keys['ArrowUp']) {
      ctx.beginPath();
      ctx.moveTo(-ship.r, 0);
      ctx.lineTo(-ship.r - 12, -6);
      ctx.lineTo(-ship.r - 12, 6);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // Asteroids (polygon shapes)
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 2;
      for (const a of asteroids) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle || 0);
        ctx.beginPath();
        const pts = a.points;
        if (pts && pts.length) {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
        } else {
          ctx.arc(0, 0, a.r, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.restore();
      }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = (now - last) / 16; // normalize to ~60fps units
    last = now;
    if (alive) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
