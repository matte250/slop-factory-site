// Simple Asteroid Dodge game – enhanced graphics
// Canvas element with id="game"
(() => {
  // Create starfield for background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, radius: Math.random() * 1.5 + 0.5 });
  }

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  const keys = {};
  addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  addEventListener('keyup', e => (keys[e.key] = false));

  // Utility to draw polygon shape with rotation
  const drawPolygon = (points, x, y, rotation, fillStyle) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
    ctx.restore();
  };

  const player = { x: canvas.width / 2, y: canvas.height / 2, r: 15, speed: 4, angle: 0, shape: [{x:-10,y:-8},{x:12,y:0},{x:-10,y:8}] };
  const asteroids = [];
  let lastSpawn = 0;
  let gameOver = false;
  let score = 0;

  // Helper to create a rough asteroid shape
  const createPolygon = (radius, sides) => {
    const points = [];
    const angleStep = (Math.PI * 2) / sides;
    for (let i = 0; i < sides; i++) {
      const variance = radius * (0.6 + Math.random() * 0.4); // irregularity
      const a = i * angleStep;
      points.push({ x: Math.cos(a) * variance, y: Math.sin(a) * variance });
    }
    return points;
  };

  const spawnAsteroid = () => {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const centerX = canvas.width / 2, centerY = canvas.height / 2;
    const speed = 1.5 + Math.random();
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -20;
        break;
      case 1: // right
        x = canvas.width + 20;
        y = Math.random() * canvas.height;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + 20;
        break;
      case 3: // left
        x = -20;
        y = Math.random() * canvas.height;
        break;
    }
    const dx = centerX - x;
    const dy = centerY - y;
    const len = Math.hypot(dx, dy);
    vx = (dx / len) * speed;
    vy = (dy / len) * speed;
    const r = 10 + Math.random() * 15;
    const sides = 5 + Math.floor(Math.random() * 4);
    const shape = createPolygon(r, sides);
    asteroids.push({ x, y, vx, vy, r, shape, angle: 0 });
  };

  const update = (dt) => {
    // player movement with direction tracking
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w']) dy -= player.speed;
    if (keys['ArrowDown'] || keys['s']) dy += player.speed;
    if (keys['ArrowLeft'] || keys['a']) dx -= player.speed;
    if (keys['ArrowRight'] || keys['d']) dx += player.speed;
    player.x += dx; player.y += dy;
    if (dx !== 0 || dy !== 0) player.angle = Math.atan2(dy, dx);
    // keep within bounds
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
    // spawn asteroids
    if (performance.now() - lastSpawn > 1000) { spawnAsteroid(); lastSpawn = performance.now(); }
    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      // set rotation based on velocity
      a.angle = Math.atan2(a.vy, a.vx);
      // collision
      const pdx = a.x - player.x, pdy = a.y - player.y;
      if (Math.hypot(pdx, pdy) < a.r + player.r) { playBeep(150, 400); gameOver = true; }
      // remove if far off screen
      if (a.x < -50 || a.x > canvas.width + 50 || a.y < -50 || a.y > canvas.height + 50) {
        asteroids.splice(i, 1);
        score++;
      }
    }
  };

  const draw = () => {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // draw player with custom shape and rotation
    drawPolygon(player.shape, player.x, player.y, player.angle, '#0af');
    // draw asteroids with irregular polygons
    for (const a of asteroids) {
      drawPolygon(a.shape, a.x, a.y, a.angle, '#999');
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last; last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
