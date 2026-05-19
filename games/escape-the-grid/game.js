// Minimal endless‑runner for canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Canvas dimensions
  canvas.width = 400;
  canvas.height = 600;

  const lanes = 3;
  const laneWidth = canvas.width / lanes;
  const playerSize = 30;
  const playerY = canvas.height - playerSize - 10;
  let playerLane = 1; // start middle lane

  const speed = 2; // obstacle downward speed (pixels per frame)
  const spawnInterval = 120; // frames between spawns
  let frameCount = 0;
  const obstacles = [];
  let running = true;

  // Audio setup using Web Audio API
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playBeep(freq, durationMs) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    osc.start(now);
    osc.stop(now + durationMs / 1000);
  }

  // Handle input
  window.addEventListener('keydown', e => {
    if (!running) return;
    if (e.key === 'ArrowLeft') {
      const newLane = Math.max(0, playerLane - 1);
      if (newLane !== playerLane) {
        playerLane = newLane;
        playBeep(600, 80); // lane change sound
      }
    }
    if (e.key === 'ArrowRight') {
      const newLane = Math.min(lanes - 1, playerLane + 1);
      if (newLane !== playerLane) {
        playerLane = newLane;
        playBeep(600, 80);
      }
    }
  });

  function spawnObstacle() {
    const lane = Math.floor(Math.random() * lanes);
    const width = laneWidth * 0.8;
    const height = 20;
    const x = lane * laneWidth + (laneWidth - width) / 2;
    obstacles.push({ x, y: -height, w: width, h: height });
  }

  function update() {
    if (!running) return;
    frameCount++;
    if (frameCount % spawnInterval === 0) spawnObstacle();

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += speed;
      // Remove off‑screen
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }

    // Collision detection
    const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    for (const o of obstacles) {
      if (
        playerX < o.x + o.w &&
        playerX + playerSize > o.x &&
        playerY < o.y + o.h &&
        playerY + playerSize > o.y
      ) {
        if (running) {
          // Play crash sound once
          playBeep(200, 300);
        }
        running = false;
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#444');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw lanes (dashed lines for better visual)
    ctx.strokeStyle = '#666';
    ctx.setLineDash([10, 10]);
    for (let i = 1; i < lanes; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw player – a rounded square with a radial gradient and subtle glow
    const playerX = playerLane * laneWidth + (laneWidth - playerSize) / 2;
    const grad = ctx.createRadialGradient(
      playerX + playerSize / 2,
      playerY + playerSize / 2,
      5,
      playerX + playerSize / 2,
      playerY + playerSize / 2,
      playerSize / 2
    );
    grad.addColorStop(0, '#8f8');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.save();
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(playerX, playerY, playerSize, playerSize, 6);
    ctx.fill();
    ctx.restore();

    // Draw obstacles – rounded rectangles with a subtle color shift
    for (const o of obstacles) {
      const obsGrad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      obsGrad.addColorStop(0, '#b33');
      obsGrad.addColorStop(1, '#800');
      ctx.fillStyle = obsGrad;
      ctx.beginPath();
      ctx.roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
    }

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
