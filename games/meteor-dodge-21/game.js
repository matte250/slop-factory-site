// Simple Meteor Dodge game targeting <canvas id="game"></canvas>
(function() {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas present
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship
  const ship = { w: 30, h: 10, x: width / 2, y: height - 20, speed: 4 };
  // Sounds
  const moveSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const explosionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
  const keys = { left: false, right: false };

  // Meteors
  const meteors = [];
  // Particle system for explosions
  const particles = [];
  // Helper to spawn explosion particles
  function createExplosion(x, y) {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 2 + 1,
        alpha: 1
      });
    }
  }
  let meteorTimer = 0;
  let meteorInterval = 90; // frames
  let meteorSpeed = 2;

  // Score
  let score = 0;
  let gameOver = false;

  function spawnMeteor() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size);
    meteors.push({ x, y: -size, size, speed: meteorSpeed + Math.random() * 1 });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn meteors
    meteorTimer++;
    if (meteorTimer >= meteorInterval) {
      spawnMeteor();
      meteorTimer = 0;
    }

    // Update meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      // Remove off‑screen meteors and increase score
      if (m.y > height) {
        meteors.splice(i, 1);
        score++;
        // Gradually increase difficulty
        if (score % 10 === 0 && meteorInterval > 30) meteorInterval -= 5;
        if (score % 20 === 0) meteorSpeed += 0.3;
      } else if (checkCollision(m)) {
        // Trigger explosion particles at collision point
        createExplosion(m.x + m.size / 2, m.y + m.size / 2);
        gameOver = true;
      }
    }
  }

  function checkCollision(m) {
    // Simple AABB vs circle approximation
    const shipRect = { x: ship.x, y: ship.y, w: ship.w, h: ship.h };
    const cx = m.x + m.size / 2;
    const cy = m.y + m.size / 2;
    const radius = m.size / 2;
    const nearestX = Math.max(shipRect.x, Math.min(cx, shipRect.x + shipRect.w));
    const nearestY = Math.max(shipRect.y, Math.min(cy, shipRect.y + shipRect.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw ship as a triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw meteors with radial gradient glow
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size * 0.2,
        m.x + m.size / 2,
        m.y + m.size / 2,
        m.size / 2
      );
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size / 2, m.y + m.size / 2, m.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw particles (if any)
    particles.forEach((p, idx) => {
      ctx.fillStyle = `rgba(255,200,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      // update particle
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particles.splice(idx, 1);
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.font = '18px sans-serif';
      ctx.fillText('Final Score: ' + score, width / 2, height / 2 + 20);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      keys.left = true;
      moveSound.currentTime = 0;
      moveSound.play();
    }
    if (e.key === 'ArrowRight') {
      keys.right = true;
      moveSound.currentTime = 0;
      moveSound.play();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  // Start
  requestAnimationFrame(loop);
})();
