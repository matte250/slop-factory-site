// Void Runner – minimalist endless runner
// Canvas with id="game" must exist in the page.

(function () {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration, type = 'sine', volume = 0.2) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Resize canvas to fill its container (optional)
  // Generate starfield for background
  const stars = [];
  function initStars(count = 100) {
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars(); // reinitialize stars on size change
  }
  window.addEventListener('resize', resize);
  resize();

  // ----- Game constants -----
  const PLAYER_RADIUS = 6;
  const PLAYER_SPEED = 2; // vertical speed
  const OBSTACLE_SPEED = 2; // horizontal speed (to the left)
  const OBSTACLE_WIDTH = 30;
  const GAP_HEIGHT = 80;
  const SPAWN_INTERVAL = 1500; // ms between obstacles

  // ----- Game state -----
  const player = {
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    dir: 1, // 1 = down, -1 = up
    color: '#0ff',
  };

  const obstacles = [];
  const playerTrail = [];
  let lastSpawn = 0;
  let gameOver = false;
  let lastTime = 0;

  // ----- Input handling -----
  function toggleDirection() {
    player.dir *= -1;
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    // Play a short change-direction sound
    playTone(600, 0.08, 'sine', 0.1);
  }
  canvas.addEventListener('click', toggleDirection);
  canvas.addEventListener('touchstart', toggleDirection);

  // ----- Helper functions -----
  function spawnObstacle() {
    const gapY = Math.random() * (canvas.height - GAP_HEIGHT);
    obstacles.push({
      x: canvas.width,
      gapY,
      width: OBSTACLE_WIDTH,
    });
  }

  function update(delta) {
    // Update star twinkling (already handled in draw)
    // Add player trail effect
    playerTrail.push({ x: player.x, y: player.y, alpha: 1 });
    // Fade trail particles
    for (let i = playerTrail.length - 1; i >= 0; i--) {
      const p = playerTrail[i];
      p.alpha -= 0.03;
      if (p.alpha <= 0) playerTrail.splice(i, 1);
    }
    if (gameOver) return;

    // Move player
    player.y += player.dir * PLAYER_SPEED;
    // Keep within bounds (optional bounce back)
    if (player.y - PLAYER_RADIUS < 0) player.y = PLAYER_RADIUS;
    if (player.y + PLAYER_RADIUS > canvas.height) player.y = canvas.height - PLAYER_RADIUS;

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= OBSTACLE_SPEED;
      // Remove off‑screen obstacles
      if (obs.x + obs.width < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Collision detection
    for (const obs of obstacles) {
      const withinX = player.x + PLAYER_RADIUS > obs.x && player.x - PLAYER_RADIUS < obs.x + obs.width;
      if (withinX) {
        const inGap = player.y > obs.gapY && player.y < obs.gapY + GAP_HEIGHT;
        if (!inGap) {
          gameOver = true;
          // Play game over sound
          playTone(150, 0.6, 'sawtooth', 0.3);
          break;
        }
      }
    }
  }

  function draw() {
    // Clear canvas with a dark space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001022');
    bgGrad.addColorStop(1, '#000014');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update stars for a subtle twinkling effect
    for (const s of stars) {
      s.x -= 0.2; // slight drift leftward
      if (s.x < 0) s.x = canvas.width;
    }

    // Draw player trail
    ctx.globalAlpha = 0.5;
    for (const p of playerTrail) {
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.globalAlpha = p.alpha * 0.5;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // Draw player with glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow

    // Draw obstacles with gradient shading
    for (const obs of obstacles) {
      const grad = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
      grad.addColorStop(0, '#444');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      // Upper rectangle
      ctx.fillRect(obs.x, 0, obs.width, obs.gapY);
      // Lower rectangle
      ctx.fillRect(obs.x, obs.gapY + GAP_HEIGHT, obs.width, canvas.height - (obs.gapY + GAP_HEIGHT));
    }

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
