// Game: Grid Escape
// Minimal implementation targeting <canvas id="game">

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for simple beep sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width = 400;
  const height = canvas.height = 400;

  // Game state
  let speed = 2; // pixels per frame
  let distance = 0;
  let score = 0;
  const tileSize = 40;

  // Player
  const player = {
    x: width / 2 - tileSize / 2,
    y: height - tileSize * 2,
    size: tileSize * 0.8,
    color: '#00f',
    dx: 0,
    dy: 0,
    move(dx, dy) {
      this.dx = dx;
      this.dy = dy;
    }
  };

  // Obstacles: {x, y, w, h}
  const obstacles = [];

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updatePlayer() {
    const step = speed;
    if (keys.ArrowUp) player.y -= step;
    if (keys.ArrowDown) player.y += step;
    if (keys.ArrowLeft) player.x -= step;
    if (keys.ArrowRight) player.x += step;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));
  }

  function spawnObstacle() {
    // Random column, start at top
    const cols = Math.floor(width / tileSize);
    const col = Math.floor(Math.random() * cols);
    obstacles.push({
      x: col * tileSize,
      y: -tileSize,
      w: tileSize,
      h: tileSize,
      color: '#f00'
    });
    // Play a short beep when obstacle appears
    playBeep(200, 0.05);
  }

  let spawnTimer = 0;
  const spawnInterval = 60; // frames

  function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += speed;
      if (o.y > height) obstacles.splice(i, 1);
    }
    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
    }
  }

  function checkCollision() {
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        return true;
      }
    }
    return false;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#f0f8ff');
    bgGrad.addColorStop(1, '#e6e6fa');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Draw background grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // Draw player with glow
    const grad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size * 0.1,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2
    );
    grad.addColorStop(0, 'rgba(0, 0, 255, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 180, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
    // Draw obstacles with rounded corners
    ctx.fillStyle = '#900';
    for (const o of obstacles) {
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
    }
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function gameLoop() {
    updatePlayer();
    updateObstacles();
if (checkCollision()) {
        // Play crash sound
        playBeep(100, 0.2);
        alert('Game Over! Score: ' + Math.floor(score));
        // Reset
        obstacles.length = 0;
        player.x = width / 2 - tileSize / 2;
        player.y = height - tileSize * 2;
        speed = 2;
        distance = 0;
        score = 0;
        return;
      }
    distance += speed;
    score = distance / 10;
    // Gradually increase speed
    speed += 0.0005;
    draw();
    requestAnimationFrame(gameLoop);
  }

  // Start the loop
  requestAnimationFrame(gameLoop);
})();
