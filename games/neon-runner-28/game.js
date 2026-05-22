// Neon Runner – enhanced graphics
// Targets <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match CSS dimensions (fallback defaults)
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 600;

  // ---------- Game configuration ----------
  const laneCount = 3;
  const laneWidth = width / laneCount;
  const playerSize = laneWidth * 0.6;
  const obstacleSize = playerSize;
  const scrollSpeed = 2; // pixels per frame
  const spawnInterval = 1500; // ms
  const gameDuration = 60; // seconds

  let playerLane = 1; // middle lane (0‑2)
  let obstacles = [];
  let stars = [];
  let lastSpawn = 0;
  let startTime = null;
  let running = true;

  // ------- Utility drawing helpers -------
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawGlow(x, y, w, h, color) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    roundedRect(x, y, w, h, 8);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // ---------- Background (star field) ----------
  function initStars(count = 30) {
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }

  function drawStars() {
    ctx.fillStyle = '#555';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      s.y += s.speed;
      if (s.y > height) s.y = 0;
    });
  }

  // ---------- Player & obstacles ----------
  function drawPlayer() {
    const x = playerLane * laneWidth + laneWidth / 2 - playerSize / 2;
    const y = height - playerSize * 1.5;
    drawGlow(x, y, playerSize, playerSize, '#0ff');
  }

  function drawObstacles() {
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      drawGlow(o.x, o.y, obstacleSize, obstacleSize, '#f00');
    });
  }

  function updateObstacles() {
    obstacles.forEach(o => (o.y += scrollSpeed));
    obstacles = obstacles.filter(o => o.y < height);
  }

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    const x = lane * laneWidth + laneWidth / 2 - obstacleSize / 2;
    obstacles.push({ x, y: -obstacleSize });
  }

  function checkCollision() {
    const px = playerLane * laneWidth + laneWidth / 2 - playerSize / 2;
    const py = height - playerSize * 1.5;
    return obstacles.some(o =>
      !(px + playerSize < o.x ||
        px > o.x + obstacleSize ||
        py + playerSize < o.y ||
        py > o.y + obstacleSize)
    );
  }

  // ---------- UI ----------
  function drawTimer(secondsLeft) {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Time: ${secondsLeft}s`, 10, 30);
  }

  function gameOver(message) {
    running = false;
    // Play appropriate sound
    if (message.includes('Game Over')) {
      playCollisionSound();
    } else {
      playGameOverSound();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(message, width / 2, height / 2);
  }

  // ---------- Main loop ----------
  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    const secondsLeft = Math.max(0, Math.ceil(gameDuration - elapsed));
    if (secondsLeft === 0) {
      gameOver('Time up!');
      return;
    }
    if (!running) return;

    if (timestamp - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = timestamp;
    }

    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawPlayer();
    drawObstacles();
    drawTimer(secondsLeft);
    updateObstacles();
    if (checkCollision()) {
      gameOver('Game Over');
      return;
    }
    requestAnimationFrame(step);
  }

  // ---------- Sound utilities ----------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMoveSound() { playTone(600, 0.1); }
  function playCollisionSound() { playTone(150, 0.3); }
  function playGameOverSound() { playTone(300, 0.5); }

// ---------- Input ----------
  window.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      playerLane = Math.max(0, playerLane - 1);
      playMoveSound();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      playerLane = Math.min(laneCount - 1, playerLane + 1);
      playMoveSound();
    }
  });

  initStars();
  requestAnimationFrame(step);
})();
