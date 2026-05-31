// Neon Dodge Game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player properties
  const player = {
    // Audio utilities
    // Create a single AudioContext for the game
    // (initialized lazily on first user interaction to satisfy browsers)
    get audioCtx() {
      if (!window._gameAudioCtx) {
        window._gameAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      return window._gameAudioCtx;
    },
    playTone(freq, dur) {
      const ctx = this.audioCtx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.value = 0.07;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    x: width / 2,
    y: height / 2,
    radius: 15,
    speed: 4,
    dx: 0,
    dy: 0,
    color: '#0ff', // neon cyan
  };

  // Obstacles array
  const obstacles = [];
  const obstacleSizeRange = [20, 50];
  const spawnInterval = 1500; // ms
  const obstacleSpeed = 2;

  let lastSpawn = 0;
  let startTime = null;
  let animationId = null;
  let gameOver = false;

  // Input handling
  // Unlock audio on first interaction
  window.addEventListener('click', () => {
    const ctx = player.audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
  }, { once: true });
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function updatePlayer() {
    player.dx = 0;
    player.dy = 0;
    if (keys.ArrowUp) player.dy = -player.speed;
    if (keys.ArrowDown) player.dy = player.speed;
    if (keys.ArrowLeft) player.dx = -player.speed;
    if (keys.ArrowRight) player.dx = player.speed;
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x + player.dx));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y + player.dy));
  }

  function spawnObstacle() {
    // Random side: left or right
    const fromLeft = Math.random() < 0.5;
    const size = Math.random() * (obstacleSizeRange[1] - obstacleSizeRange[0]) + obstacleSizeRange[0];
    const y = Math.random() * (height - size) + size / 2;
    const obstacle = {
      x: fromLeft ? -size : width + size,
      y,
      size,
      vx: fromLeft ? obstacleSpeed : -obstacleSpeed,
      vy: 0,
      color: `hsl(${Math.random() * 360}, 80%, 60%)`,
    };
    obstacles.push(obstacle);
    // Play a short tone when a new obstacle appears
    player.playTone(400, 0.07);
  }

  function updateObstacles(delta) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx;
      // Remove off‑screen obstacles
      if (o.x < -o.size || o.x > width + o.size) obstacles.splice(i, 1);
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      const distX = Math.abs(o.x - player.x);
      const distY = Math.abs(o.y - player.y);
      if (distX < o.size / 2 + player.radius && distY < o.size / 2 + player.radius) {
        // Simple AABB‑circle test works well for squares
        // Play collision sound
        player.playTone(150, 0.3);
        gameOver = true;
        cancelAnimationFrame(animationId);
        return;
      }
    }
  }

  function draw() {
    // Draw semi‑transparent fade for motion trails
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(0, 0, width, height);
    // Draw background gradient (stars)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // small stars
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#0ff';
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Draw player with neon glow
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Draw obstacles with gradient fills and rotation
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x, o.y);
      const angle = o.vx * 0.05; // simple rotation based on direction
      ctx.rotate(angle);
      const gradObs = ctx.createLinearGradient(-o.size/2, -o.size/2, o.size/2, o.size/2);
      gradObs.addColorStop(0, o.color);
      gradObs.addColorStop(1, '#000');
      ctx.fillStyle = gradObs;
      ctx.fillRect(-o.size/2, -o.size/2, o.size, o.size);
      ctx.restore();
    }
    // Draw score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Final Score: ${elapsed}s`, width / 2, height / 2 + 40);
    }
  }
    // (old drawing logic removed – enhanced graphics handled above)

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const delta = timestamp - (lastSpawn || timestamp);
    if (delta > spawnInterval) {
      spawnObstacle();
      lastSpawn = timestamp;
    }
    if (!gameOver) {
      updatePlayer();
      updateObstacles(delta);
      checkCollision();
      draw();
      animationId = requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over overlay
    }
  }

  // Start the game loop
  animationId = requestAnimationFrame(loop);
})();
