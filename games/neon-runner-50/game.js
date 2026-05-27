// Minimalist Neon Runner – endless runner on canvas #game

(() => {
  // --- Audio setup ---
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // background ambience (soft low hum)
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
  bgGain.gain.setValueAtTime(0.002, audioCtx.currentTime);
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const width = (canvas.width = canvas.clientWidth * dpr);
  const height = (canvas.height = canvas.clientHeight * dpr);
  ctx.scale(dpr, dpr);
  // neon glow settings (will be applied before drawing objects)
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;

  const laneCount = 3;
  const laneWidth = width / laneCount;
  const groundY = height * 0.75;

  // player state
  let playerLane = 1; // 0‑left,1‑center,2‑right
  let playerY = groundY;
  let vy = 0;
  const gravity = 0.9;
  const jumpStrength = -15;
  const playerSize = laneWidth * 0.4;

  // obstacles
  const obstacles = [];
  const obstacleSpeed = 6;
  const obstacleFreq = 90; // frames
  let frame = 0;

  let score = 0;
  let gameOver = false;

  // input
  window.addEventListener('keydown', e => {
    // resume audio on first user interaction
    if (!window._audioResumed) {
      audioCtx.resume();
      window._audioResumed = true;
    }
    if (gameOver) return;
    if (e.key === 'ArrowLeft' && playerLane > 0) playerLane--;
    else if (e.key === 'ArrowRight' && playerLane < laneCount - 1) playerLane++;
    else if (e.key === 'ArrowUp' && playerY === groundY) {
      vy = jumpStrength;
      playTone(660, 0.2); // jump sound
    }
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * laneCount);
    const size = laneWidth * 0.5;
    obstacles.push({ lane, x: width, size, y: groundY - size });
  }

  function update() {
    if (gameOver) return;
    frame++;
    if (frame % obstacleFreq === 0) spawnObstacle();

    // player physics
    playerY += vy;
    vy += gravity;
    if (playerY > groundY) { playerY = groundY; vy = 0; }

    // move obstacles
    obstacles.forEach(o => o.x -= obstacleSpeed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].size < 0) obstacles.shift();

    // collision
    for (const o of obstacles) {
      if (o.lane === playerLane) {
        const playerX = playerLane * laneWidth + laneWidth / 2;
        const half = playerSize / 2;
        const ox = o.x + o.size / 2;
        const oh = o.size / 2;
        const px = playerX;
        const py = playerY - playerSize / 2;
        if (Math.abs(px - ox) < half + oh && Math.abs(py - (groundY - o.size / 2)) < half + oh && playerY === groundY) {
          playTone(200, 0.3); // crash sound
          gameOver = true;
          break;
        }
      }
    }

    score = Math.floor(frame / 10);
  }

  function drawGrid() {
    // neon grid lines
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    for (let i = 0; i <= laneCount; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // horizontal grid lines (optional)
    for (let y = 0; y < height; y += laneWidth) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    // reset shadow for other draws
    ctx.shadowBlur = 0;
  }

  function draw() {
    // background gradient – dark to deep neon
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#002');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    // neon background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    drawGrid();

    // player – neon triangle ship with glow
    const px = playerLane * laneWidth + laneWidth / 2;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(px, playerY - playerSize);
    ctx.lineTo(px - playerSize / 2, playerY);
    ctx.lineTo(px + playerSize / 2, playerY);
    ctx.closePath();
    ctx.fill();

    // obstacles – neon squares with subtle glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      const ox = o.x;
      const oy = o.y;
      ctx.fillRect(ox, oy, o.size, o.size);
    });
    // reset shadows for UI text
    ctx.shadowBlur = 0;

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f55';
      ctx.textAlign = 'center';
      ctx.font = '40px monospace';
      ctx.fillText('GAME OVER', width / 2, height / 2);
      ctx.font = '20px monospace';
      ctx.fillText('Press R to restart', width / 2, height / 2 + 30);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  // restart
  window.addEventListener('keydown', e => {
    if (gameOver && e.key.toLowerCase() === 'r') {
      // reset state
      obstacles.length = 0;
      playerLane = 1;
      playerY = groundY;
      vy = 0;
      frame = 0;
      score = 0;
      gameOver = false;
    }
  });

  loop();
})();
