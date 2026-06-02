// Canvas Dodger game with enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 300;
  const H = canvas.height = canvas.clientHeight || 400;

  const laneCount = 3;
  const laneWidth = W / laneCount;
  const playerSize = 20;
  let playerLane = 1; // start middle
  const playerY = H - playerSize - 10;

  const obstacles = [];
  const obstacleSize = 20;
  const speed = 2;
  let spawnTimer = 0;
  const spawnInterval = 80; // frames
let score = 0;

  // Helper to draw a rounded square with a vertical gradient
  const drawRoundedSquare = (x, y, size, colorStart, colorEnd) => {
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    grad.addColorStop(0, colorStart);
    grad.addColorStop(1, colorEnd);
    ctx.fillStyle = grad;
    const radius = 4;
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
    ctx.fill();
  };

  const drawPlayer = () => {
    const x = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    drawRoundedSquare(x, playerY, playerSize, '#00ff00', '#006400');
  };

  // Helper to draw a rounded obstacle (circle) with gradient
  const drawObstacle = (x, y, size) => {
    const grad = ctx.createRadialGradient(x + size/2, y + size/2, size/4, x + size/2, y + size/2, size/2);
    grad.addColorStop(0, '#ff8080');
    grad.addColorStop(1, '#800000');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fill();
  };

  // Draw all obstacles using the rounded obstacle helper
  const drawObstacles = () => {
    obstacles.forEach(o => drawObstacle(o.x, o.y, obstacleSize));
  };



  // Draw background gradient
  const drawBackground = () => {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
  };



  const updateObstacles = () => {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].y += speed;
      if (obstacles[i].y > H) {
        obstacles.splice(i, 1);
        score++;
        // play a short tone on score increase
        playTone(880, 0.1);
      }
    }
    // collision
    const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    for (const o of obstacles) {
      if (
        o.x < playerX + playerSize &&
        o.x + obstacleSize > playerX &&
        o.y < playerY + playerSize &&
        o.y + obstacleSize > playerY
      ) {
        gameOver();
        return;
      }
    }
  };
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].y += speed;
      if (obstacles[i].y > H) obstacles.splice(i, 1);
    }
    // collision
    const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    for (const o of obstacles) {
      if (
        o.x < playerX + playerSize &&
        o.x + obstacleSize > playerX &&
        o.y < playerY + playerSize &&
        o.y + obstacleSize > playerY
      ) {
        gameOver();
        return;
      }
    }
  };

  let audioStarted = false;

  const spawnObstacle = () => {
    const lane = Math.floor(Math.random() * laneCount);
    const x = lane * laneWidth + (laneWidth - obstacleSize) / 2;
    obstacles.push({ x, y: -obstacleSize });
  };

  let running = true;
  const gameOver = () => {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  };

  const loop = () => {
    if (!running) return;
    // draw background first
    drawBackground();
    if (++spawnTimer >= spawnInterval) {
      spawnObstacle();
      spawnTimer = 0;
    }
    updateObstacles();
    drawObstacles();
    drawPlayer();
    drawScore();
    requestAnimationFrame(loop);
  };

  window.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    if (e.key === 'ArrowRight' && playerLane < laneCount - 1) playerLane++;
  });

  requestAnimationFrame(loop);
})();
