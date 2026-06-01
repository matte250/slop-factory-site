// Simple top‑down endless runner for canvas with id "game"
// Ship (player) avoids asteroids, collects power‑ups
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // size canvas to its CSS size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // player ship
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    size: 20,
    speed: 4,
    dx: 0,
    dy: 0,
  };
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  // asteroids and power‑ups
  const asteroids = [];
  const powerUps = [];
  let spawnTimer = 0;
  let puTimer = 0;
  let score = 0;
  let gameOver = false;

  const rnd = (min, max) => Math.random() * (max - min) + min;

  // spawn a background star
  const spawnStar = () => {
    const size = Math.random() * 2 + 1;
    stars.push({
      x: rnd(0, canvas.width),
      y: -size,
      size,
      speed: rnd(0.5, 1.5),
    });
  };

  const spawnAsteroid = () => {
    const radius = rnd(10, 30);
    asteroids.push({
      x: rnd(radius, canvas.width - radius),
      y: -radius,
      r: radius,
      speed: rnd(1, 3) + score * 0.005,
    });
  };

  const spawnPowerUp = () => {
    const size = 12;
    powerUps.push({
      x: rnd(size, canvas.width - size),
      y: -size,
      size,
      speed: 2,
    });
  };

  const updatePlayer = () => {
    player.dx = 0; player.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
    player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x + player.dx));
    player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y + player.dy));
  };

  const rectCircleCollide = (rx, ry, rw, rh, cx, cy, cr) => {
    const distX = Math.abs(cx - rx - rw / 2);
    const distY = Math.abs(cy - ry - rh / 2);
    if (distX > rw / 2 + cr) return false;
    if (distY > rh / 2 + cr) return false;
    if (distX <= rw / 2) return true;
    if (distY <= rh / 2) return true;
    const dx = distX - rw / 2;
    const dy = distY - rh / 2;
    return dx * dx + dy * dy <= cr * cr;
  };

  const update = () => {
    if (gameOver) return;
    // spawn timers
    spawnTimer++;
    if (spawnTimer > 60) { spawnAsteroid(); spawnTimer = 0; }
    puTimer++;
    if (puTimer > 500) { spawnPowerUp(); puTimer = 0; }
    starTimer++;
    if (starTimer > 5) { spawnStar(); starTimer = 0; }
    updatePlayer();
    // move stars (background)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y - s.size > canvas.height) { stars.splice(i, 1); }
    }
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > canvas.height) { asteroids.splice(i, 1); score++; continue; }
      // collision with player (approx ship as rectangle)
      if (rectCircleCollide(player.x - player.size, player.y - player.size, player.size * 2, player.size * 2, a.x, a.y, a.r)) {
        gameOver = true;
        playBeep(200, 0.3); // collision sound
      }
    }
    // move power‑ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.y += p.speed;
      if (p.y - p.size > canvas.height) { powerUps.splice(i, 1); continue; }
      // collect
      if (rectCircleCollide(player.x - player.size, player.y - player.size, player.size * 2, player.size * 2, p.x, p.y, p.size)) {
        player.speed += 0.5; // temporary boost
        powerUps.splice(i, 1);
        score += 5;
        playBeep(600, 0.15); // power‑up sound
      }
    }
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // player ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // power‑ups
    ctx.fillStyle = '#ff0';
    powerUps.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
