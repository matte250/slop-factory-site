// Simple Neon Escape game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Load sound effects (simple beep using data URI)
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABAwAgAEABAAZGF0YQAAAAA='); // placeholder beep
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAABAwAgAEABAAZGF0YQAAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();
  const w = (canvas.width = canvas.clientWidth || 400);
  const h = (canvas.height = canvas.clientHeight || 600);

  const ship = { x: w / 2, y: h - 40, w: 30, h: 30, vx: 0, speed: 4 };
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2 + 1, opacity: Math.random() });
  }
  const asteroids = [];
  let lastSpawn = 0;
  let startTime = performance.now();
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({ x: Math.random() * (w - size), y: -size, w: size, h: size, vy: Math.random() * 2 + 2 });
  }

  function update(dt) {
    if (gameOver) return;
    // ship movement
    ship.vx = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.vx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.vx = ship.speed;
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x + ship.vx));

    // move background stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // speed of starfield
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
      }
    }

    // spawn asteroids every ~1s
    if (performance.now() - lastSpawn > 1000) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.vy;
      if (a.y > h) asteroids.splice(i, 1);
      // collision
        if (
          ship.x < a.x + a.w &&
          ship.x + ship.w > a.x &&
          ship.y < a.y + a.h &&
          ship.y + ship.h > a.y
        ) {
          crashSound.currentTime = 0;
          crashSound.play();
          gameOver = true;
        }
    }
  }

  function draw() {
    // clear with gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);
    // neon style (glow)
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    // ship (neon triangle)
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.stroke();
    // stars background (twinkling)
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,255,255,${s.opacity})`;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 5;
      ctx.fill();
    });
    // asteroids (glowing circles)
    asteroids.forEach(a => {
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, a.w / 2);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#001');
      ctx.beginPath();
      ctx.arc(cx, cy, a.w / 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#0ff';
      ctx.shadowBlur = 12;
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    const score = Math.floor((performance.now() - startTime) / 1000);
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', w / 2 - 60, h / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
