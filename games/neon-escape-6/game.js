// Simple Neon Escape game based on IDEA.md
// Canvas with id="game"; a glowing dot moves forward automatically.
// Arrow keys steer the dot. Random moving rectangular obstacles appear.
// Collision ends the game; score = distance traveled.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Load sound effects
  const hitSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  hitSound.volume = 0.5;
  // Set canvas size to fill its container or full window
  const resize = () => {
    canvas.width = canvas.clientWidth || window.innerWidth;
    canvas.height = canvas.clientHeight || window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game parameters
  const dot = { x: canvas.width / 2, y: canvas.height / 2, radius: 5, angle: 0, speed: 2 };
  const obstacles = [];
  const obstacleSpawnInterval = 2000; // ms
  const obstacleSpeed = 1.5;
  let lastSpawn = 0;
  let particles = [];
  let lastTime = 0;
  let distance = 0;
  let running = true;

  // Input handling – arrow keys adjust angle
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false };
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  const updateDirection = () => {
    // Simple steering: left/right rotate, up/down change speed slightly
    if (keys.ArrowLeft) dot.angle -= 0.04;
    if (keys.ArrowRight) dot.angle += 0.04;
    if (keys.ArrowUp) dot.speed = Math.min(dot.speed + 0.02, 5);
    if (keys.ArrowDown) dot.speed = Math.max(dot.speed - 0.02, 0.5);
  };

  const spawnObstacle = () => {
    const w = 30 + Math.random() * 60;
    const h = 20 + Math.random() * 40;
    // spawn at random edge moving inward
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    switch (edge) {
      case 0: // left
        x = -w; y = Math.random() * canvas.height; vx = obstacleSpeed; vy = 0; break;
      case 1: // right
        x = canvas.width; y = Math.random() * canvas.height; vx = -obstacleSpeed; vy = 0; break;
      case 2: // top
        x = Math.random() * canvas.width; y = -h; vx = 0; vy = obstacleSpeed; break;
      case 3: // bottom
        x = Math.random() * canvas.width; y = canvas.height; vx = 0; vy = -obstacleSpeed; break;
    }
    obstacles.push({ x, y, w, h, vx, vy });
  };

  const updateObstacles = (dt) => {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx;
      o.y += o.vy;
      // Remove if completely out of view
      if (o.x + o.w < 0 || o.x > canvas.width || o.y + o.h < 0 || o.y > canvas.height) {
        obstacles.splice(i, 1);
      }
    }
    // Spawn new obstacles over time
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
  };

  const checkCollision = () => {
    for (const o of obstacles) {
      // Circle-rectangle collision
      const nearestX = Math.max(o.x, Math.min(dot.x, o.x + o.w));
      const nearestY = Math.max(o.y, Math.min(dot.y, o.y + o.h));
      const dx = dot.x - nearestX;
      const dy = dot.y - nearestY;
      if (dx * dx + dy * dy < dot.radius * dot.radius) {
        return true;
      }
    }
    return false;
  };

  const draw = () => {
  // Update particle lifetimes
  particles.forEach(p => p.life -= 0.02);
    // Draw background with vertical neon gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#020');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set additive blending for neon effect
    ctx.globalCompositeOperation = 'lighter';

    // Draw obstacles with neon glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // Reset shadow for dot
    ctx.shadowBlur = 0;

    // Draw trailing particles (simple fading circles)
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,0,255,${p.life})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw dot with radial glow
    const grad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.radius * 4);
    grad.addColorStop(0, 'rgba(255,0,255,0.9)');
    grad.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    ctx.fill();

    // Reset composite operation for UI text
    ctx.globalCompositeOperation = 'source-over';

    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 20);
  };

  const loop = (timestamp) => {
    if (!running) return;
    const dt = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    updateDirection();
    dot.x += Math.cos(dot.angle) * dot.speed;
    dot.y += Math.sin(dot.angle) * dot.speed;
    distance += dot.speed;
    // Add trailing particle
    particles.push({ x: dot.x, y: dot.y, size: dot.radius * 2, life: 0.5 });

    // wrap around edges to keep dot in view
    if (dot.x < 0) dot.x = canvas.width;
    if (dot.x > canvas.width) dot.x = 0;
    if (dot.y < 0) dot.y = canvas.height;
    if (dot.y > canvas.height) dot.y = 0;

    updateObstacles(dt);
    if (checkCollision()) {
      // Play collision sound
      hitSound.currentTime = 0;
      hitSound.play();
      running = false;
      ctx.fillStyle = 'rgba(255,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
      ctx.fillText(`Final Score: ${Math.floor(distance)}`, canvas.width / 2 - 110, canvas.height / 2 + 40);
      return;
    }

    draw();
    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
