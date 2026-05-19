// Simple Asteroid Escape game targeting <canvas id="game">

(() => {

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth || 800);
  const H = (canvas.height = canvas.clientHeight || 600);

  // ---- Audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }


  // ---- Game state ----
  const ship = { x: W / 2, y: H / 2, r: 12, speed: 3, vx: 0, vy: 0, fuel: 100 };
  const asteroids = [];
  const orbs = [];
  let score = 0;
  let laserCooldown = 0;
  let gameOver = false;

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const r = 15 + Math.random() * 20;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -r : W + r;
    const y = Math.random() * H;
    const vx = (Math.random() * 2 + 1) * (side === 'left' ? 1 : -1);
    const vy = (Math.random() - 0.5) * 2;
    asteroids.push({ x, y, r, vx, vy });
  }

  function spawnOrb() {
    const r = 8;
    const x = Math.random() * W;
    const y = Math.random() * H;
    orbs.push({ x, y, r, value: 5 });
  }

  // ---- Game loop ----
  function update(dt) {
    if (gameOver) return;

    // ship movement
    ship.vx = ship.vy = 0;
    if (keys.ArrowUp) ship.vy = -ship.speed;
    if (keys.ArrowDown) ship.vy = ship.speed;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    if (ship.vx !== 0 || ship.vy !== 0) {
      beep(300, 0.04); // thrust sound
    }
    ship.x = Math.max(ship.r, Math.min(W - ship.r, ship.x + ship.vx));
    ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y + ship.vy));

    // fuel consumption
    ship.fuel -= dt * 0.02; // drains over time
    if (ship.fuel <= 0) gameOver = true;

    // laser
    if (laserCooldown > 0) laserCooldown -= dt;
    if (keys[' '] && laserCooldown <= 0) {
      // simple laser: clear asteroids within 30px of ship
      for (let i = asteroids.length - 1; i >= 0; i--) {
        const a = asteroids[i];
        const dx = a.x - ship.x;
        const dy = a.y - ship.y;
        if (Math.hypot(dx, dy) < ship.r + 30) asteroids.splice(i, 1);
      }
      beep(600, 0.1); // laser sound
      laserCooldown = 0.5; // half‑second cooldown
    }

    // update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
    }
    // remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.r || a.x > W + a.r || a.y < -a.r || a.y > H + a.r) asteroids.splice(i, 1);
    }

    // spawn logic
    if (Math.random() < dt * 0.5) spawnAsteroid(); // avg one every 2 seconds
    if (Math.random() < dt * 0.1) spawnOrb(); // occasional energy orb

    // check collisions with asteroids
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.r) { gameOver = true; break; }
    }

    // collect orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const d = Math.hypot(o.x - ship.x, o.y - ship.y);
      if (d < o.r + ship.r) {
        ship.fuel = Math.min(100, ship.fuel + o.value);
        score += o.value;
        beep(800, 0.08); // orb collection sound
        orbs.splice(i, 1);
      }
    }

    score += dt * 0.1; // survival points
  }

  function draw() {
    // background with starfield
    drawBackground();

    // ship – draw as a triangle with gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.r * 0.2, ship.x, ship.y, ship.r);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#004400');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    const angle = Math.atan2(ship.vy || 0, ship.vx || 0);
    const tipX = ship.x + Math.cos(angle) * ship.r * 1.5;
    const tipY = ship.y + Math.sin(angle) * ship.r * 1.5;
    const leftX = ship.x + Math.cos(angle + Math.PI * 0.75) * ship.r;
    const leftY = ship.y + Math.sin(angle + Math.PI * 0.75) * ship.r;
    const rightX = ship.x + Math.cos(angle - Math.PI * 0.75) * ship.r;
    const rightY = ship.y + Math.sin(angle - Math.PI * 0.75) * ship.r;
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(leftX, leftY);
    ctx.lineTo(rightX, rightY);
    ctx.closePath();
    ctx.fill();

    // asteroids – shaded circles
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // orbs – glowing effect
    for (const o of orbs) {
      const orbGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2);
      orbGrad.addColorStop(0, 'rgba(255,255,0,0.9)');
      orbGrad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
