// Simple endless vertical scroller – Pixel Plunge with enhanced graphics and sound
// Targets a <canvas id="game"> element.

(() => {
  // ------- Audio Setup -------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // ------- Setup -------

  // ------- Setup -------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);

  // ----- Constants -----
  const PLAYER_SIZE = 10;
  const PLAYER_Y = H - PLAYER_SIZE * 3;
  const MOVE_STEP = 20;
  const OBSTACLE_WIDTH = 40;
  const OBSTACLE_HEIGHT = 10;
  const SPAWN_INTERVAL = 800; // ms
  const ORB_RADIUS = 4;

  // ----- State -----
  let playerX = W / 2 - PLAYER_SIZE / 2;
  let moveRight = true; // toggle direction on each click/tap
  let obstacles = [];
  let orbs = [];
  let stars = [];
  let lastSpawn = 0;
  let score = 0;
  let hits = 0;
  let gameOver = false;

  // ----- Input -----
  canvas.addEventListener('click', async () => {
    // Ensure audio can play after user interaction
    if (audioCtx.state !== 'running') {
      await audioCtx.resume();
    }
    if (gameOver) return;
    moveRight = !moveRight;
    playerX += moveRight ? MOVE_STEP : -MOVE_STEP;
    playerX = Math.max(0, Math.min(W - PLAYER_SIZE, playerX));
    // Play movement sound
    playSound(300, 'square', 0.05);
  });

  // ----- Helpers -----
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

  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * W, y: Math.random() * H, size: Math.random() * 2 + 1, speed: Math.random() * 0.05 + 0.02 });
    }
  }

  function updateStars(dt) {
    stars.forEach(s => {
      s.y += s.speed * dt;
      if (s.y > H) {
        s.x = Math.random() * W;
        s.y = -s.size;
        s.speed = Math.random() * 0.05 + 0.02;
      }
    });
  }

  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
  }

  // ----- Game Logic -----
  function spawnObstacle() {
    const gapX = Math.random() * (W - OBSTACLE_WIDTH);
    obstacles.push({ x: 0, y: -OBSTACLE_HEIGHT, w: gapX, h: OBSTACLE_HEIGHT });
    obstacles.push({ x: gapX + OBSTACLE_WIDTH, y: -OBSTACLE_HEIGHT, w: W - (gapX + OBSTACLE_WIDTH), h: OBSTACLE_HEIGHT });
    if (Math.random() < 0.3) {
      orbs.push({ x: gapX + OBSTACLE_WIDTH / 2, y: -OBSTACLE_HEIGHT - 20, collected: false });
    }
  }

  function update(dt) {
    if (gameOver) return;
    // Move obstacles and orbs
    obstacles.forEach(o => (o.y += dt * 0.2));
    obstacles = obstacles.filter(o => o.y < H);
    orbs.forEach(o => (o.y += dt * 0.2));
    orbs = orbs.filter(o => !o.collected && o.y < H);

    // Collision with obstacles
    for (const o of obstacles) {
      if (
        playerX < o.x + o.w &&
        playerX + PLAYER_SIZE > o.x &&
        PLAYER_Y < o.y + o.h &&
        PLAYER_Y + PLAYER_SIZE > o.y
      ) {
        hits++;
        // Play hit sound
        playSound(100, 'sawtooth', 0.2);
        if (hits >= 3) {
          gameOver = true;
          // Play game over sound
          playSound(50, 'sine', 0.5);
        }
        break;
      }
    }
    // Collect orbs
    for (const orb of orbs) {
      const dx = playerX + PLAYER_SIZE / 2 - orb.x;
      const dy = PLAYER_Y + PLAYER_SIZE / 2 - orb.y;
      if (Math.hypot(dx, dy) < ORB_RADIUS + PLAYER_SIZE / 2) {
        orb.collected = true;
        score += 10;
      }
    }
    // Spawn obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }
    // Update stars background
    updateStars(dt);
  }

  // ----- Rendering -----
  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    drawStars();
    // Obstacles – rounded with red gradient
    const obsGrad = ctx.createLinearGradient(0, 0, 0, OBSTACLE_HEIGHT);
    obsGrad.addColorStop(0, '#ff5555');
    obsGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = obsGrad;
    obstacles.forEach(o => {
      roundedRect(o.x, o.y, o.w, o.h, 2);
      ctx.fill();
    });
    // Orbs – glowing yellow
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => ctx.beginPath() || ctx.arc(o.x, o.y, ORB_RADIUS, 0, Math.PI * 2) && ctx.fill());
    // Player – cyan radial gradient for a neon look
    const pGrad = ctx.createRadialGradient(
      playerX + PLAYER_SIZE / 2,
      PLAYER_Y + PLAYER_SIZE / 2,
      2,
      playerX + PLAYER_SIZE / 2,
      PLAYER_Y + PLAYER_SIZE / 2,
      PLAYER_SIZE
    );
    pGrad.addColorStop(0, '#0ff');
    pGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = pGrad;
    roundedRect(playerX, PLAYER_Y, PLAYER_SIZE, PLAYER_SIZE, 2);
    ctx.fill();
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Hits: ${hits}/3`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  // Init stars background
  initStars();

  // Main loop
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
