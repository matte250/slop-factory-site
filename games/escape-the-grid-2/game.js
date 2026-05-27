// Simple "Escape the Grid" game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 400);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Unlock audio on first user interaction
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, { once: true });
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  // Player
  const player = {
    w: 30,
    h: 30,
    x: width / 2 - 15,
    y: height - 40,
    speed: 5,
    color: '#4CAF50',
  };

  // Game state
  let obstacles = [];
  let powerUps = [];
  let keys = {};
  let shield = false;
  let shieldTimer = 0;
  let startTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = 30;
    const x = Math.random() * (width - size);
    obstacles.push({ x, y: -size, w: size, h: size, speed: 2 + Math.random() * 2 });
  }

  function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (width - size);
    powerUps.push({ x, y: -size, w: size, h: size, speed: 2 });
  }

  let obstacleSpawnTimer = 0;
  let powerUpSpawnTimer = 0;

  function update(dt) {
    if (gameOver) return;

    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Spawn obstacles/power‑ups
    obstacleSpawnTimer += dt;
    powerUpSpawnTimer += dt;
    if (obstacleSpawnTimer > 1000) { // every 1s
      spawnObstacle();
      obstacleSpawnTimer = 0;
    }
    if (powerUpSpawnTimer > 5000) { // every 5s
      spawnPowerUp();
      powerUpSpawnTimer = 0;
    }

    // Update obstacles
    obstacles.forEach(o => (o.y += o.speed));
    obstacles = obstacles.filter(o => o.y < height);

    // Update power‑ups
    powerUps.forEach(p => (p.y += p.speed));
    powerUps = powerUps.filter(p => p.y < height);

    // Collision detection
    const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (rectIntersect(playerRect, o)) {
        if (shield) {
          // destroy obstacle and remove shield
          obstacles.splice(i, 1);
          playTone(600, 200); // shield destroy sound
          shield = false;
          shieldTimer = 0;
        } else {
          playTone(200, 400); // game over sound
gameOver = true;
        }
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      if (rectIntersect(playerRect, p)) {
        shield = true;
        shieldTimer = 3000; // 3 seconds
        powerUps.splice(i, 1);
        playTone(800, 150); // collect sound
      }
    }
    if (shield) {
      shieldTimer -= dt;
      if (shieldTimer <= 0) shield = false;
    }
  }

  function draw() {
// Clear
  ctx.clearRect(0, 0, width, height);
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0d0d0d');
  bgGrad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Player
  ctx.fillStyle = shield ? '#FFD700' : player.color;
  drawRoundedRect(player.x, player.y, player.w, player.h, 5, ctx.fillStyle);

  // Obstacles (spikes as triangles with gradient)
  const obsGrad = ctx.createLinearGradient(0, 0, 0, 30);
  obsGrad.addColorStop(0, '#ff8a80');
  obsGrad.addColorStop(1, '#d50000');
  ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

// Power‑ups (glowing circles with radial gradient)
  powerUps.forEach(p => {
    const grad = ctx.createRadialGradient(
      p.x + p.w / 2,
      p.y + p.h / 2,
      p.w * 0.1,
      p.x + p.w / 2,
      p.y + p.h / 2,
      p.w / 2
    );
    grad.addColorStop(0, '#80DEEA');
    grad.addColorStop(1, '#006064');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
    ctx.fill();
  });

    // Score
    ctx.fillStyle = '#FFF';
    ctx.font = '16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FF5722';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y && a.y + a.h > b.y;
  }

  // Draw a rounded rectangle
  function drawRoundedRect(x, y, w, h, r, fillStyle) {
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
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
