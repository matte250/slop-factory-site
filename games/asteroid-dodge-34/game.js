// Asteroid Dodge game – targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context and simple beep helper
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
  const W = canvas.width = canvas.width || 400;
  const H = canvas.height = canvas.height || 600;

  // Ship
  const shipW = 30, shipH = 15;
  let shipX = (W - shipW) / 2;
  const shipY = H - shipH - 10;
  const shipSpeed = 4;
  const keys = { ArrowLeft: false, ArrowRight: false };

  // Asteroids
  const asteroids = [];
  let spawnInterval = 1000; // ms
  let lastSpawn = 0;
  let gameOver = false;
  let startTime = performance.now();

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 10;
    const x = Math.random() * (W - radius * 2) + radius;
    const speed = 1 + Math.random() * 2 + (performance.now() - startTime) / 60000; // increase over time
    asteroids.push({ x, y: -radius, r: radius, s: speed });
    // sound effect for new asteroid
    beep(400, 0.05);
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) shipX = Math.max(0, shipX - shipSpeed);
    if (keys.ArrowRight) shipX = Math.min(W - shipW, shipX + shipSpeed);

    // asteroids
    asteroids.forEach(a => a.y += a.s);
    // remove off‑screen
    while (asteroids.length && asteroids[0].y - asteroids[0].r > H) asteroids.shift();

    // collision
    for (const a of asteroids) {
      const cx = a.x, cy = a.y, r = a.r;
      // simple rectangle‑circle overlap
      const nearestX = Math.max(shipX, Math.min(cx, shipX + shipW));
      const nearestY = Math.max(shipY, Math.min(cy, shipY + shipH));
      const dx = cx - nearestX, dy = cy - nearestY;
if (dx * dx + dy * dy < r * r) {
          gameOver = true;
          beep(200, 0.2);
          break;
        }
        if (a.y - r > H) {
          gameOver = true;
          beep(200, 0.2);
          break;
        }
    }

    // spawn logic
    if (!gameOver && performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // gradually speed up spawns
      spawnInterval = Math.max(200, spawnInterval - 10);
    }
  }

  function draw() {
    // background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // simple star field
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillStyle = '#555';
      ctx.fillRect(sx, sy, 1, 1);
    }
    // ship as triangle
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(shipX + shipW / 2, shipY);
    ctx.lineTo(shipX, shipY + shipH);
    ctx.lineTo(shipX + shipW, shipY + shipH);
    ctx.closePath();
    ctx.fill();
    // asteroids with gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // input handling
  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // resume audio on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });
})();
