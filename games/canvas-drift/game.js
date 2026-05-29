// Minimal endless‑runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // full‑window size
  // sound assets (simple beeps)
  const sounds = {
    collect: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQoAAAAA'),
    crash: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YYoAAAAA')
  };
  canvas.width = canvas.clientWidth || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;

  // Game state
  const ship = { x: canvas.width / 2, y: canvas.height * 0.85, w: 20, h: 30, speed: 4, fuel: 100 };
  const asteroids = [];
  const shipTrail = []; // stores recent ship positions for trail effect
  const stars = [];
  let keys = {};
  let lastAsteroid = 0, lastStar = 0, score = 0;
  let running = true;

  // Input
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({ x: Math.random() * (canvas.width - size), y: -size, size, speed: 2 + Math.random() * 2 });
  }
  function spawnStar() {
    const r = Math.random() * 2 + 2; // radius 2‑4
    const opacity = Math.random() * 0.5 + 0.5; // 0.5‑1.0
    stars.push({ x: Math.random() * (canvas.width - r * 2) + r, y: -r, r, speed: 1.5, opacity });
  }

  function rectCollision(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  function update(dt) {
    // ship movement
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(ship.x, canvas.width - ship.w));
    // record trail position (center of ship)
    shipTrail.push({ x: ship.x + ship.w / 2, y: ship.y + ship.h / 2 });
    if (shipTrail.length > 20) shipTrail.shift();
    // fuel consumption
    ship.fuel -= 0.02 * dt;
    if (ship.fuel <= 0) running = false;
    // spawn entities
    const now = Date.now();
    if (now - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = now; }
    if (now - lastStar > 1500) { spawnStar(); lastStar = now; }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y > canvas.height) { asteroids.splice(i, 1); continue; }
      if (rectCollision(ship.x, ship.y, ship.w, ship.h, a.x, a.y, a.size, a.size)) { sounds.crash.play(); running = false; }
    }
    // update stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > canvas.height) { stars.splice(i, 1); continue; }
      if (circleRect(s.x, s.y, s.r, ship.x, ship.y, ship.w, ship.h)) {
        sounds.collect.play();
        ship.fuel = Math.min(100, ship.fuel + 20);
        stars.splice(i, 1);
        score += 10;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001028');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // ship trail - fading circles
    ctx.fillStyle = '#0a0';
    shipTrail.forEach((p, i) => {
      const alpha = (i + 1) / shipTrail.length * 0.5;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // ship - draw as triangle with outline
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // outline
    ctx.strokeStyle = '#0a0';
    ctx.lineWidth = 2;
    ctx.stroke();
    // asteroids - rounded with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // stars - glowing radial gradient based on opacity
    for (const s of stars) {
      const grad = ctx.createRadialGradient(
        s.x,
        s.y,
        0,
        s.x,
        s.y,
        s.r
      );
      grad.addColorStop(0, `rgba(255,255,200,${s.opacity})`);
      grad.addColorStop(1, `rgba(255,255,200,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}%  Score: ${score}`,
      10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(time) {
    const dt = time - lastTime;
    lastTime = time;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
