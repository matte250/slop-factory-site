// game.js – simple endless runner for canvas #game
// Ship (triangle) avoids rotating asteroids and gaps in a scrolling starfield.
// Collect power‑ups (yellow squares) to extend run. Collision → game over.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ---------- audio setup ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playPowerUp() { playBeep(800, 0.1); }
  function playCollision() { playBeep(200, 0.3); }


  // ------- game objects -------
  const ship = { x: 80, y: height / 2, size: 20, dy: 0 };
  const asteroids = [];
  const powerUps = [];
  const stars = [];

  // generate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.5 + 0.2 });
  }

  let frame = 0;
  let score = 0;
  let gameOver = false;

  // input
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    asteroids.push({ x: width + radius, y: Math.random() * (height - 2 * radius) + radius, r: radius, angle: 0, speed: 2 + Math.random() * 2, rotSpeed: (Math.random() - 0.5) * 0.1 });
  }

  function spawnPowerUp() {
    const size = 12;
    powerUps.push({ x: width + size, y: Math.random() * (height - size), size, speed: 2.5 });
  }

  function update() {
    if (gameOver) return;
    frame++;
    // starfield scroll left
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
    }
    // ship control – up/down arrows
    if (keys['ArrowUp']) ship.dy = -3;
    else if (keys['ArrowDown']) ship.dy = 3;
    else ship.dy *= 0.9; // friction
    ship.y += ship.dy;
    ship.y = Math.max(ship.size, Math.min(height - ship.size, ship.y));

    // spawn obstacles
    if (frame % 90 === 0) spawnAsteroid();
    if (frame % 300 === 0) spawnPowerUp();

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      a.angle += a.rotSpeed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
        if (Math.hypot(dx, dy) < a.r + ship.size) { gameOver = true; playCollision(); }
    }

    // update power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.x -= p.speed;
      if (p.x + p.size < 0) powerUps.splice(i, 1);
      // collision
        if (Math.abs(p.x - ship.x) < ship.size + p.size && Math.abs(p.y - ship.y) < ship.size + p.size) {
          score += 10; // extend run / reward
          powerUps.splice(i, 1);
          playPowerUp();
        }
    }
    score += 0.01; // distance based
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#020111');
    bgGrad.addColorStop(1, '#090c46');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // ship – gradient triangle with glow
    const shipGrad = ctx.createLinearGradient(ship.x - ship.size, ship.y, ship.x, ship.y - ship.size);
    shipGrad.addColorStop(0, '#00ff88');
    shipGrad.addColorStop(1, '#006644');
    ctx.fillStyle = shipGrad;
    ctx.shadowColor = '#0f4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size / 2);
    ctx.lineTo(ship.x - ship.size, ship.y - ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // asteroids – gradient fill with glow
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#ffb199');
      grad.addColorStop(1, '#7a0c0c');
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff6';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // power‑ups
    ctx.fillStyle = '#ff0';
    for (const p of powerUps) {
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
