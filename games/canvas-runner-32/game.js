// Canvas Runner – simple endless runner
// Assumes an HTML <canvas id="game"></canvas> present in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', dur = 150) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playJumpSound() { playSound(300, 'triangle', 120); }
  function playGameOverSound() { playSound(100, 'sawtooth', 500); }

  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // Player settings
  const player = { x: 50, y: 0, w: 30, h: 30, vy: 0, jumpStrength: -12 };
  const gravity = 0.6;

  // Obstacles (spikes) – simple rectangles
  const obstacles = [];
  let obstacleTimer = 0;
  let obstacleInterval = 1500; // ms, will decrease over time

  // Game state
  let lastTime = 0;
  let speed = 4; // base horizontal speed
  let speedIncrease = 0.002; // per ms
  let running = true;

  const handleInput = (e) => {
    // Ensure audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.code === 'Space' || e.type === 'touchstart') {
      // Only allow jump if on or near ground
      if (player.y + player.h >= canvas.height - 1) {
        player.vy = player.jumpStrength;
        playJumpSound();
      }
    }
  };
  window.addEventListener('keydown', handleInput);
  window.addEventListener('touchstart', handleInput);

  function spawnObstacle() {
    const size = 20 + Math.random() * 30; // random spike size
    obstacles.push({ x: canvas.width, y: canvas.height - size, w: size, h: size });
  }

  function update(dt) {
    // Move player
    player.vy += gravity;
    player.y += player.vy;
    if (player.y + player.h > canvas.height - 40) { // account for ground height
      player.y = canvas.height - 40 - player.h;
      player.vy = 0;
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update clouds
    updateClouds(dt);

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        running = false; // game over
        playGameOverSound();
        break;
      }
    }

    // Obstacle spawn timing
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
      // gradually increase difficulty
      obstacleInterval = Math.max(500, obstacleInterval - 20);
    }

    // Increase speed over time
    speed += speedIncrease * dt;
  }

  // Helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  // Cloud data for background
  const clouds = [];
  const maxClouds = 5;
  function initClouds() {
    for (let i = 0; i < maxClouds; i++) {
      const size = 40 + Math.random() * 60;
      clouds.push({ x: Math.random() * canvas.width, y: 20 + Math.random() * 80, size });
    }
  }
  initClouds();

  function updateClouds(dt) {
    const cloudSpeed = speed * 0.3; // slower than obstacles
    for (const c of clouds) {
      c.x -= cloudSpeed;
      if (c.x + c.size < 0) {
        c.x = canvas.width + Math.random() * 100;
        c.y = 20 + Math.random() * 80;
        c.size = 40 + Math.random() * 60;
      }
    }
  }

  function draw() {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87CEFA'); // light sky blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw moving clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 0.6, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(c.x + c.size * 0.5, c.y - c.size * 0.6, c.size * 0.6, Math.PI * 1, Math.PI * 2);
      ctx.arc(c.x + c.size, c.y, c.size * 0.6, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // Ground
    const groundHeight = 40;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // player (rounded square with shadow)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#4A90E2');
    playerGrad.addColorStop(1, '#0A84FF');
    drawRoundedRect(player.x, player.y, player.w, player.h, 6, playerGrad);
    ctx.restore();

    // obstacles (spikes – drawn as triangles with gradient)
    const spikeGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    spikeGrad.addColorStop(0, '#ff7f7f');
    spikeGrad.addColorStop(1, '#ff3b30');
    ctx.fillStyle = spikeGrad;
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

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

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
