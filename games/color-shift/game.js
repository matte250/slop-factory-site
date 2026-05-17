// Simple Color‑Shift game targeting <canvas id="game">.
// Added visual polish: background gradient, rounded obstacles, dot shadow.
// Dot moves continuously to the right; clicking/tapping cycles its hue.
// Obstacles of matching hue become transparent for 1 s.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill window.
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game parameters.
  const hues = [0, 60, 120, 180, 240, 300]; // degrees on HSL circle.
  let hueIdx = 0;
  const dot = { x: 50, y: canvas.height / 2, r: 10, hue: hues[hueIdx] };
  const speed = 2; // pixels per frame.
  const obstacles = [];
  const obstacleGap = 200; // distance between obstacles.
  let nextObstacleX = canvas.width;
  let gameOver = false;

  // Cycle hue on user input.
  const cycleHue = () => {
    hueIdx = (hueIdx + 1) % hues.length;
    dot.hue = hues[hueIdx];
    // Make matching obstacles transparent for 1 s.
    const now = performance.now();
    obstacles.forEach(o => {
      if (o.hue === dot.hue) o.transparentUntil = now + 1000;
    });
  };
  canvas.addEventListener('click', cycleHue);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); cycleHue(); }, { passive: false });

  // Create a new obstacle.
  const addObstacle = () => {
    const hue = hues[Math.floor(Math.random() * hues.length)];
    const height = Math.random() * (canvas.height * 0.6) + canvas.height * 0.2;
    const y = Math.random() * (canvas.height - height);
    obstacles.push({ x: canvas.width, y, w: 20, h: height, hue, transparentUntil: 0 });
  };

  const update = (dt) => {
    if (gameOver) return;
    // Move dot forward.
    dot.x += speed * (dt / 16.67);
    // Shift obstacles left.
    obstacles.forEach(o => o.x -= speed);
    // Remove passed obstacles.
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Add new obstacles.
    if (dot.x + obstacleGap > nextObstacleX) {
      addObstacle();
      nextObstacleX = dot.x + obstacleGap;
    }
    // Collision detection.
    const now = performance.now();
    for (const o of obstacles) {
      const solid = now > o.transparentUntil;
      if (solid &&
          dot.x + dot.r > o.x && dot.x - dot.r < o.x + o.w &&
          dot.y + dot.r > o.y && dot.y - dot.r < o.y + o.h) {
        gameOver = true;
        break;
      }
    }
    // Keep dot vertically centered.
    dot.y = canvas.height / 2;
  };

  const draw = () => {
    // Draw background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#1e1e2f');
  bgGrad.addColorStop(1, '#121220');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw obstacles.
    const now = performance.now();
    obstacles.forEach(o => {
      const alpha = now > o.transparentUntil ? 1 : 0.2;
      ctx.fillStyle = `hsla(${o.hue}, 80%, 50%, ${alpha})`;
      // draw rounded rectangle for obstacle
      const radius = 5;
      ctx.beginPath();
      ctx.moveTo(o.x + radius, o.y);
      ctx.lineTo(o.x + o.w - radius, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      ctx.lineTo(o.x + o.w, o.y + o.h - radius);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      ctx.lineTo(o.x + radius, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      ctx.lineTo(o.x, o.y + radius);
      ctx.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.closePath();
      ctx.fill();
    });
    // Draw dot.
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${dot.hue}, 80%, 50%)`;
    ctx.fill();
    // Game over overlay.
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
