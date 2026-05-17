// Simple Pulse Wave game implementation
// Canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  const obstacles = [];
  const obstacleCount = 30;
  const maxSpeed = 1.5;
  const waveRadius = 80;
  const waveForce = 3;

  // Initialize obstacles as circles
  for (let i = 0; i < obstacleCount; i++) {
    obstacles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 10 + Math.random() * 10,
      vx: (Math.random() - 0.5) * maxSpeed,
      vy: (Math.random() - 0.5) * maxSpeed,
    });
  }

  function update(dt) {
    // Move obstacles
    for (const o of obstacles) {
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      // Wrap around edges
      if (o.x < -o.r) o.x = width + o.r;
      if (o.x > width + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = height + o.r;
      if (o.y > height + o.r) o.y = -o.r;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ff6666';
    for (const o of obstacles) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function pulse(x, y) {
    for (const o of obstacles) {
      const dx = o.x - x;
      const dy = o.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < waveRadius) {
        const factor = (waveRadius - dist) / waveRadius;
        const norm = Math.hypot(dx, dy) || 1;
        o.vx += (dx / norm) * waveForce * factor;
        o.vy += (dy / norm) * waveForce * factor;
      }
    }
  }

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pulse(x, y);
  });

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 16; // normalise to ~60fps
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
