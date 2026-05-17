// Simple Laser Slice game implementation
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player dot
  const player = {
    x: width / 2,
    y: height - 50,
    radius: 8,
    speed: 2,
    color: '#ff6600',
  };

  // Obstacles: simple rectangles
  const obstacles = [];
  const obstacleSize = { w: 60, h: 20 };
  const obstacleColor = '#444';

  // Laser state
  const laser = { length: 40, width: 4, cooldown: 500, lastFired: 0 };

  // Utility: check rectangle intersect line segment
  function lineIntersectsRect(x1, y1, x2, y2, rect) {
    // Simple AABB check for each side of rect
    const { x, y, w, h } = rect;
    // Check if line segment passes through rectangle bounds
    // Using Liang-Barsky algorithm (simplified)
    let t0 = 0, t1 = 1;
    const dx = x2 - x1, dy = y2 - y1;
    const p = [-dx, dx, -dy, dy];
    const q = [x1 - x, x + w - x1, y1 - y, y + h - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) {
        if (q[i] < 0) return false; // Parallel and outside
      } else {
        const r = q[i] / p[i];
        if (p[i] < 0) {
          if (r > t1) return false;
          if (r > t0) t0 = r;
        } else {
          if (r < t0) return false;
          if (r < t1) t1 = r;
        }
      }
    }
    return t0 <= t1;
  }

  function spawnObstacle() {
    const x = Math.random() * (width - obstacleSize.w);
    const y = -obstacleSize.h; // start above view
    obstacles.push({ x, y, w: obstacleSize.w, h: obstacleSize.h });
  }

  // Main loop
  function update(timestamp) {
    // Move player forward (upwards)
    player.y -= player.speed;

    // Remove obstacles that are far below view
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].y > height) obstacles.splice(i, 1);
    }

    // Spawn obstacles ahead of player
    if (Math.random() < 0.02) spawnObstacle();

    // Draw
    ctx.clearRect(0, 0, width, height);
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles
    ctx.fillStyle = obstacleColor;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    requestAnimationFrame(update);
  }

  // Laser handling
  function fireLaser() {
    const now = Date.now();
    if (now - laser.lastFired < laser.cooldown) return; // cooldown
    laser.lastFired = now;
    // Laser line from player forward (upwards)
    const x1 = player.x;
    const y1 = player.y - player.radius;
    const x2 = player.x;
    const y2 = y1 - laser.length;
    // Visual
    ctx.strokeStyle = 'rgba(0,255,255,0.7)';
    ctx.lineWidth = laser.width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // Remove intersecting obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (lineIntersectsRect(x1, y1, x2, y2, obstacles[i])) {
        obstacles.splice(i, 1);
      }
    }
  }

  // Input
  canvas.addEventListener('pointerdown', fireLaser);

  // Start
  requestAnimationFrame(update);
})();
