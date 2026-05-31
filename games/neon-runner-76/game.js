// Simple Neon Runner game targeting <canvas id="game"></canvas>
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Set canvas size (you can adjust via CSS as needed)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const lanes = 5; // number of horizontal slots
  const laneWidth = canvas.width / lanes;
  const playerY = canvas.height - 40; // player vertical position
  let playerLane = Math.floor(lanes / 2);

  const obstacles = [];
  const obstacleSpeed = 2; // px per frame
  const obstacleSpawnRate = 90; // frames between spawns
  let frameCount = 0;
  let running = true;

  // Input handling
  document.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft') {
      playerLane = Math.max(0, playerLane - 1);
      playTone(600, 0.07);
    } else if (e.key === 'ArrowRight') {
      playerLane = Math.min(lanes - 1, playerLane + 1);
      playTone(600, 0.07);
    }
    if (!running) return;
    if (e.key === 'ArrowLeft') playerLane = Math.max(0, playerLane - 1);
    else if (e.key === 'ArrowRight') playerLane = Math.min(lanes - 1, playerLane + 1);
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes);
    obstacles.push({ lane, y: -30 });
  }

  function drawNeonLine() {
    // Neon glow effect for player line
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(laneWidth * playerLane + laneWidth / 2, playerY);
    ctx.lineTo(laneWidth * playerLane + laneWidth / 2, playerY - 20);
    ctx.stroke();
  }

  function drawPlayer() {
    // Player ship with neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    const grad = ctx.createLinearGradient(0, playerY, 0, playerY + 20);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#005');
    ctx.fillStyle = grad;
    ctx.fillRect(
      laneWidth * playerLane + laneWidth * 0.2,
      playerY,
      laneWidth * 0.6,
      20
    );
    ctx.restore();
    ctx.fillStyle = '#0ff';
    ctx.fillRect(
      laneWidth * playerLane + laneWidth * 0.2,
      playerY,
      laneWidth * 0.6,
      20
    );
  }

  function drawObstacles() {
    // Obstacles with neon glow
    ctx.save();
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(ob => {
      const grad = ctx.createLinearGradient(0, ob.y, 0, ob.y + 30);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#500');
      ctx.fillStyle = grad;
      ctx.fillRect(
        laneWidth * ob.lane + laneWidth * 0.2,
        ob.y,
        laneWidth * 0.6,
        30
      );
    });
    ctx.restore();
    ctx.fillStyle = '#f0f';
    obstacles.forEach(ob => {
      ctx.fillRect(
        laneWidth * ob.lane + laneWidth * 0.2,
        ob.y,
        laneWidth * 0.6,
        30
      );
    });
  }

  function update() {
    // move obstacles
    obstacles.forEach(ob => (ob.y += obstacleSpeed));
    // remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();
    // collision check
    for (const ob of obstacles) {
      if (ob.lane === playerLane && ob.y + 30 >= playerY) {
        running = false;
        // Play collision sound
        playTone(200, 0.3);
        break;
      }
    }
  }

  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      return;
    }
    frameCount++;
    if (frameCount % obstacleSpawnRate === 0) spawnObstacle();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw moving grid lines for neon effect
    ctx.strokeStyle = 'rgba(0,255,255,0.1)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const offset = frameCount % gridSpacing;
    for (let x = offset; x < canvas.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = offset; y < canvas.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    drawNeonLine();
    drawPlayer();
    drawObstacles();
    update();
    requestAnimationFrame(loop);
  }

  loop();
});
