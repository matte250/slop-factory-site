// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Neon background gradient
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };

  const bgGradient = () => {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    return grad;
  };

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const laneCount = 3;
  const laneWidth = () => canvas.width / laneCount;
  const player = {
    lane: 1, // start middle lane
    y: canvas.height * 0.85,
    size: 20,
    color: '#0ff',
  };

  const obstacles = [];
  let lastSpawn = 0;
  const spawnInterval = 1500; // ms
  let score = 0;
  let lastTime = performance.now();
  let gameOver = false;

  const keyHandler = (e) => {
    if (gameOver) return;
    // Ensure audio context can play
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') {
      player.lane = Math.max(0, player.lane - 1);
      playTone(500, 80); // left move tone
    } else if (e.key === 'ArrowRight') {
      player.lane = Math.min(laneCount - 1, player.lane + 1);
      playTone(600, 80); // right move tone
    }
  };
  window.addEventListener('keydown', keyHandler);

  const drawPlayer = () => {
    const x = player.lane * laneWidth() + laneWidth() / 2;
    const y = player.y;
    const s = player.size;
    ctx.fillStyle = player.color;
    // Neon glow
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x - s, y + s);
    ctx.lineTo(x + s, y + s);
    ctx.closePath();
    ctx.fill();
    // Outline for extra neon effect
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  };

  const drawObstacles = () => {
    // Neon obstacle squares with glow
    ctx.fillStyle = '#ff0';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ff0';
    obstacles.forEach((obs) => {
      const x = obs.lane * laneWidth() + laneWidth() / 2;
      const y = obs.y;
      const s = obs.size;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
      // Outline for contrast
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.strokeRect(x - s / 2, y - s / 2, s, s);
    });
    ctx.shadowBlur = 0;
  };

  const updateObstacles = (dt) => {
    const speed = 0.3 * canvas.height; // pixels per second
    obstacles.forEach((obs) => {
      obs.y += speed * dt;
    });
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y - obstacles[0].size > canvas.height) {
      obstacles.shift();
    }
  };

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * laneCount);
    obstacles.push({ lane, y: -20, size: 30 });
    // Sound for new obstacle
    playTone(400, 50);
  };

  const checkCollision = () => {
    const playerX = player.lane;
    return obstacles.some((obs) => {
      if (obs.lane !== playerX) return false;
      const dy = obs.y - player.y;
      return Math.abs(dy) < (obs.size + player.size) / 2;
    });
  };

  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
  };

  const loop = (time) => {
    const dt = (time - lastTime) / 1000; // seconds
    lastTime = time;
    // Draw neon background
    ctx.fillStyle = bgGradient();
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
      // spawn
      if (time - lastSpawn > spawnInterval) {
        spawnObstacle();
        lastSpawn = time;
      }
      updateObstacles(dt);
      if (checkCollision()) {
        gameOver = true;
        ctx.fillStyle = '#f88';
        ctx.font = '40px sans-serif';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
      }
      score += dt * 100; // arbitrary scaling
    }

    drawPlayer();
    drawObstacles();
    drawScore();

    if (!gameOver) requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
