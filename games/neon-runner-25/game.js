// Minimal endless‑runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 300;
  const height = canvas.height = canvas.clientHeight || 400;

  const laneCount = 3;
  const laneWidth = width / laneCount;
  const playerSize = laneWidth * 0.6;
  const playerY = height - playerSize * 1.5;
  let playerLane = 1; // 0,1,2
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMoveSound() { playTone(400, 'square', 0.05); }
  function playCollisionSound() { playTone(100, 'sawtooth', 0.3); }

  const obstacles = [];
  // starfield for neon background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1 });
  }
  const obstacleSize = playerSize;
  const obstacleSpeed = 2;
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  let score = 0;
  let alive = true;

  function drawBackground() {
    // Neon gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // draw moving starfield
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      star.y += 0.5;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });
    ctx.globalAlpha = 1;
  }

  let laneOffset = 0;
function drawLanes() {
    ctx.strokeStyle = '#033';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    for (let i = 1; i < laneCount; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, -laneOffset);
      ctx.lineTo(x, height - laneOffset);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // update offset for motion effect
    laneOffset = (laneOffset + 2) % 20;
  }

function drawPlayer() {
    // neon glowing square
    ctx.save();
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 20;
    const x = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    ctx.fillRect(x, playerY, playerSize, playerSize);
    ctx.restore();
  }

  function drawObstacles() {
    ctx.fillStyle = '#f00';
    obstacles.forEach(o => {
      // neon glow effect
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 15;
      ctx.fillRect(o.x, o.y, obstacleSize, obstacleSize);
      ctx.restore();
    });
  }


  function updateObstacles() {
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      const lane = Math.floor(Math.random() * laneCount);
      const x = lane * laneWidth + (laneWidth - obstacleSize) / 2;
      obstacles.push({ x, y: -obstacleSize });
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      // collision
      const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
      if (
        o.y + obstacleSize > playerY &&
        o.y < playerY + playerSize &&
        o.x === playerX
      ) {
        alive = false; playCollisionSound();
      }
      // remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
  }

  function loop() {
    if (!alive) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      ctx.fillText('Score: ' + score, width / 2 - 60, height / 2 + 30);
      return;
    }
    // draw neon background and lane markers
    drawBackground();
    drawLanes();
    updateObstacles();
    drawPlayer();
    drawObstacles();
    drawScore();
    score++;
    requestAnimationFrame(loop);
  }

  // Input handling
  function moveLeft() { if (playerLane > 0) { playerLane--; playMoveSound(); } }
  function moveRight() { if (playerLane < laneCount - 1) playerLane++; }
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') moveLeft();
    else if (e.key === 'ArrowRight') moveRight();
  });
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < width / 2) moveLeft(); else moveRight();
  });

  // Start game
  requestAnimationFrame(loop);
})();
