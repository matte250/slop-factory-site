(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 400;
  const H = canvas.height = canvas.offsetHeight || 600;

  const player = { w: 40, h: 20, x: W / 2 - 20, y: H - 30, speed: 5, dir: 0 };
  let asteroids = [];
  let score = 0;
  let gameOver = false;
  let lastSpawn = 0;
  // sound effects
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA');
  crashSound.load();
  const spawnSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQgAAAAA');
  spawnSound.load();

  const keys = {};
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') keys.left = true; if (e.key === 'ArrowRight') keys.right = true; });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft') keys.left = false; if (e.key === 'ArrowRight') keys.right = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left - player.w / 2;
  });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    player.x = touch.clientX - rect.left - player.w / 2;
  }, { passive: false });

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    const x = Math.random() * (W - size);
    const speed = Math.random() * 2 + 1;
    asteroids.push({ x, y: -size, size, speed });
    // play spawn sound if not muted
    if (spawnSound && typeof spawnSound.play === 'function') {
      spawnSound.currentTime = 0;
      spawnSound.play();
    }
  }

  function update(dt) {
    // player movement
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // asteroids
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y < H + a.size);

    // spawn
    if (performance.now() - lastSpawn > 800) { spawnAsteroid(); lastSpawn = performance.now(); }

    // collision
    for (const a of asteroids) {
      const collX = player.x < a.x + a.size && player.x + player.w > a.x;
      const collY = player.y < a.y + a.size && player.y + player.h > a.y;
      if (collX && collY) { gameOver = true; if (crashSound && typeof crashSound.play === 'function') { crashSound.currentTime = 0; crashSound.play(); } break; }
    }

    // score
    score += dt * 0.01;
  }

  function draw() {
    // background gradient space
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // starfield (simple twinkling)
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * W;
      const sy = (performance.now() / 50 + i * 10) % H;
      const brightness = Math.random() * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255,255,255,${brightness})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // player as triangle ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // asteroids as circles with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x + a.size/2, a.y + a.size/2, a.size*0.2, a.x + a.size/2, a.y + a.size/2, a.size/2);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size/2, a.y + a.size/2, a.size/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', W / 2, H / 2 + 30);
    }
  }

  let lastTime = 0;
  function loop(ts) {
    const dt = ts - lastTime;
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('click', () => { if (gameOver) { asteroids = []; score = 0; gameOver = false; } });

  requestAnimationFrame(loop);
})();
