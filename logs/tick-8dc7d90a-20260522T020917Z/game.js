// Simple endless‑runner with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  const height = canvas.height = canvas.offsetHeight || 600;

  // Ship (approximated as circle for collision)
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 12,
    speed: 2,
    vx: 0,
    vy: 0,
  };

  // Debris objects (circles)
  const debris = [];
  const stars = [];
  const shipTrail = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnDebris() {
    const edge = Math.floor(Math.random() * 4);
    const size = 8 + Math.random() * 12;
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 2;
    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -size;
        vx = (Math.random() - 0.5) * 0.5;
        vy = speed;
        break;
      case 1: // bottom
        x = Math.random() * width;
        y = height + size;
        vx = (Math.random() - 0.5) * 0.5;
        vy = -speed;
        break;
      case 2: // left
        x = -size;
        y = Math.random() * height;
        vx = speed;
        vy = (Math.random() - 0.5) * 0.5;
        break;
      case 3: // right
        x = width + size;
        y = Math.random() * height;
        vx = -speed;
        vy = (Math.random() - 0.5) * 0.5;
        break;
    }
    debris.push({ x, y, r: size, vx, vy });
  }

  function update(dt) {
    // add current position to ship trail
    shipTrail.push({ x: ship.x, y: ship.y, alpha: 1 });
    if (shipTrail.length > 20) shipTrail.shift();
    // fade trail particles
    for (let i = 0; i < shipTrail.length; i++) {
      shipTrail[i].alpha *= 0.96;
    }
    // ship control – simple acceleration
    if (keys.ArrowUp || keys.w) ship.vy -= ship.speed * 0.02;
    if (keys.ArrowDown || keys.s) ship.vy += ship.speed * 0.02;
    if (keys.ArrowLeft || keys.a) ship.vx -= ship.speed * 0.02;
    if (keys.ArrowRight || keys.d) ship.vx += ship.speed * 0.02;

    // apply inertia & clamp speed
    ship.vx *= 0.98;
    ship.vy *= 0.98;
    ship.x += ship.vx;
    ship.y += ship.vy;

    // boundary check (lose if outside)
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) gameOver = true;

    // update debris
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.x += d.vx;
      d.y += d.vy;
      // remove if far off screen
      if (d.x < -50 || d.x > width + 50 || d.y < -50 || d.y > height + 50) {
        debris.splice(i, 1);
      }
    }

    // collision detection
    for (const d of debris) {
      const dx = ship.x - d.x;
      const dy = ship.y - d.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.r + d.r) {
        gameOver = true;
        break;
      }
    }

    // spawn new debris
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnDebris();
      lastSpawn = performance.now();
    }

    // score as time survived (seconds)
    score = Math.floor(performance.now() / 1000);
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars background
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();
    }
    // debris
    // use radial gradient for each debris piece

    // debris with radial gradient
    for (const d of debris) {
      const grad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      grad.addColorStop(0, 'rgba(255,80,80,0.9)');
      grad.addColorStop(1, 'rgba(150,0,0,0.3)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship
    drawShip();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
