// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 200;

  // Create background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');

  // Star field for parallax effect
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Audio setup (Web Audio API)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
      osc.stop(audioCtx.currentTime + 0.03);
    }, duration);
  }

  // Player (neon triangle)
  const player = {
    x: 50,
    y: HEIGHT - 30,
    width: 20,
    height: 30,
    vy: 0,
    jumpStrength: -8,
    gravity: 0.4,
    onGround: true,
  };

  // Obstacles (spikes as simple triangles)
  const obstacles = [];
  const OBSTACLE_SPACING = 200; // distance between obstacles
  let nextObstacleX = WIDTH;

  let score = 0;
  let gameOver = false;

  // Input
  window.addEventListener('keydown', async (e) => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state !== 'running') {
      try { await audioCtx.resume(); } catch (_) {}
    }
    if (e.code === 'Space' && player.onGround && !gameOver) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playTone(660, 80); // jump sound
    }
    if (e.code === 'Enter' && gameOver) restart();
  });

  function restart() {
    obstacles.length = 0;
    player.y = HEIGHT - 30;
    player.vy = 0;
    player.onGround = true;
    nextObstacleX = WIDTH;
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#0ff';
      ctx.font = '20px monospace';
      ctx.fillText('Game Over – Score: ' + Math.floor(score), 20, HEIGHT / 2);
      ctx.fillText('Press Enter to restart', 20, HEIGHT / 2 + 30);
      return;
    }

    // Clear with gradient background
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw stars (parallax)
    ctx.fillStyle = '#fff';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed; // move left
      if (s.x < 0) s.x = WIDTH;
    }

    // Update player
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y >= HEIGHT - 30) {
      player.y = HEIGHT - 30;
      player.vy = 0;
      player.onGround = true;
    }

    // Draw player (neon triangle) with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x - player.width / 2, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Add obstacles
    if (nextObstacleX - player.x < OBSTACLE_SPACING) {
      obstacles.push({ x: nextObstacleX, y: HEIGHT - 30, size: 20 });
      nextObstacleX += OBSTACLE_SPACING + Math.random() * 100;
    }

    // Update & draw obstacles
    ctx.fillStyle = '#f0f';
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= 3; // speed
      // Draw spike (upside‑down triangle) with neon glow
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.size);
      ctx.lineTo(obs.x - obs.size / 2, obs.y);
      ctx.lineTo(obs.x + obs.size / 2, obs.y);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Collision detection (simple AABB check)
        if (
          player.x + player.width / 2 > obs.x - obs.size / 2 &&
          player.x - player.width / 2 < obs.x + obs.size / 2 &&
          player.y + player.height > obs.y &&
          player.y < obs.y + obs.size
        ) {
          playTone(220, 150); // collision sound
          gameOver = true;
        }

      // Remove off‑screen obstacles
      if (obs.x + obs.size < 0) obstacles.splice(i, 1);
    }

    // Score (distance traveled)
    score += 0.05;
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
