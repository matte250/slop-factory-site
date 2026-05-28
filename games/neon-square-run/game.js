// Simple neon‑square endless runner for <canvas id="game"></canvas>
// Click/tap the canvas to switch lanes and avoid obstacles.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Basic configuration
  const lanes = 3; // number of vertical lanes
  const laneWidth = () => canvas.width / lanes;
  const playerSize = 30; // neon square size
  const playerSpeed = 2; // pixels per frame (downward movement)
  const obstacleSpeed = 2; // same speed as player background scroll
  const obstacleSize = 30;
  const spawnInterval = 1000; // ms between obstacles

  // Game state
  let playerLane = 1; // start in middle lane (0‑based)
  let playerY = canvas.height - playerSize - 10;
  let obstacles = [];
  let lastSpawn = 0;
  let running = true;

  // Helper: draw neon style rounded square with glow
  function drawNeonRect(x, y, size, color) {
    const radius = 6;
    // draw rounded rectangle with gradient fill
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, color);
    grad.addColorStop(1, '#fff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    // glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes);
    obstacles.push({ lane, y: -obstacleSize });
  }

  function update(delta) {
    // move obstacles
    obstacles.forEach(o => o.y += obstacleSpeed);
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o => o.y < canvas.height + obstacleSize);

    // spawn new obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // collision detection
    const playerX = playerLane * laneWidth() + (laneWidth() - playerSize) / 2;
    for (const o of obstacles) {
      const ox = o.lane * laneWidth() + (laneWidth() - obstacleSize) / 2;
        if (
          o.y + obstacleSize > playerY &&
          o.y < playerY + playerSize &&
          ox < playerX + playerSize &&
          ox + obstacleSize > playerX
        ) {
          // collision: play low tone and end game
          playTone(200, 0.3);
          running = false;
          break;
        }
    }
  }

function draw() {
    // draw background with vertical neon grid
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // neon grid lines
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 8]);
    for (let i = 0; i <= lanes; i++) {
      const x = i * laneWidth();
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // draw player neon rounded square (cyan)
    const playerX = playerLane * laneWidth() + (laneWidth() - playerSize) / 2;
    drawNeonRect(playerX, playerY, playerSize, '#0ff');

    // draw obstacles (magenta) with slight rotation effect
    obstacles.forEach(o => {
      const ox = o.lane * laneWidth() + (laneWidth() - obstacleSize) / 2;
      ctx.save();
      ctx.translate(ox + obstacleSize / 2, o.y + obstacleSize / 2);
      ctx.rotate(Math.sin(o.y * 0.05) * 0.2);
      ctx.translate(-obstacleSize / 2, -obstacleSize / 2);
      drawNeonRect(0, 0, obstacleSize, '#f0f');
      ctx.restore();
    });
  }

  function loop(timestamp) {
    if (!running) {
      // Game over overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }

  // Input: click/tap toggles lane (cycle left‑right)
  canvas.addEventListener('click', () => {
    playerLane = (playerLane + 1) % lanes; // cycle through lanes
    // play a high‑pitched tone on lane switch
    playTone(800, 0.1);
  });

  // Resize handling
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  requestAnimationFrame(loop);
})();
