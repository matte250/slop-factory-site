// Simple Canvas Dodge game based on IDEA.md
// Canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player configuration
  const player = {
    x: width / 2,
    y: height / 2,
    size: 20,
    speed: 4,
    color: '#00ff00',
  };
  // Trail of recent positions for visual effect
  const trail = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Obstacles
  const obstacles = [];
  const obstacleSpawnInterval = 1500; // ms
  const obstacleSpeed = 2;
  const obstacleSizeRange = [10, 30];
  let lastSpawn = 0;

  // Game state
  let score = 0;
  let startTime = null;
  let gameOver = false;

  function spawnObstacle() {
    const size = Math.random() * (obstacleSizeRange[1] - obstacleSizeRange[0]) + obstacleSizeRange[0];
    const angle = Math.random() * Math.PI * 2;
    const speedX = Math.cos(angle) * obstacleSpeed;
    const speedY = Math.sin(angle) * obstacleSpeed;
    const x = Math.random() * width;
    const y = Math.random() * height;
    obstacles.push({ x, y, size, speedX, speedY, color: '#ff5555' });
  }

  function update(dt) {
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep player within bounds
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // Record trail
    trail.push({ x: player.x, y: player.y });
    if (trail.length > 12) trail.shift();

    // Spawn obstacles over time
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (const o of obstacles) {
      o.x += o.speedX;
      o.y += o.speedY;
      // Wrap around edges
      if (o.x < -o.size) o.x = width + o.size;
      if (o.x > width + o.size) o.x = -o.size;
      if (o.y < -o.size) o.y = height + o.size;
      if (o.y > height + o.size) o.y = -o.size;
    }

    // Collision detection
    for (const o of obstacles) {
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < o.size + player.size / 2) {
        gameOver = true;
        playBeep();
        break;
      }
    }

    // Update score
    if (!gameOver) {
      const now = performance.now();
      score = Math.floor((now - startTime) / 1000);
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);

    // Draw trail
    for (let i = trail.length - 1; i >= 0; i--) {
      const p = trail[i];
      const alpha = (i + 1) / trail.length * 0.4; // fade out
      ctx.fillStyle = `rgba(0,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, player.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player with radial gradient
    const grad = ctx.createRadialGradient(player.x, player.y, player.size / 4, player.x, player.y, player.size / 2);
    grad.addColorStop(0, '#bfff00');
    grad.addColorStop(1, '#006400');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles with size‑based hue
    for (const o of obstacles) {
      const hue = Math.round((o.size - obstacleSizeRange[0]) / (obstacleSizeRange[1] - obstacleSizeRange[0]) * 120;
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastRender ?? timestamp);
    lastRender = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastRender;
  // Sound state
  let soundPlayed = false;
  // Simple beep using Web Audio API
  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 220;
      gain.gain.value = 0.2;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error('Audio not supported', e);
    }
  }
  requestAnimationFrame(loop);
})();
