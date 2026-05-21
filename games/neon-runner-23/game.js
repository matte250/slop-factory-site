// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  let audioCtx = null;
  const playBeep = (freq, dur) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  };

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Player settings
  const player = {
    x: 50,
    y: HEIGHT / 2,
    size: 20,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    color: '#0ff',
  };

  // Obstacle settings
  const obstacleWidth = 30;
  const gapHeight = 120; // vertical gap for player to pass
  const obstacleSpeed = 3;
  const spawnInterval = 1500; // ms
  let obstacles = [];
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;
  // Starfield background
  const numStars = 60;
  const stars = [];
  for (let i = 0; i < numStars; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, size: Math.random() * 2 + 1 });
  }

  // Input: space or arrow up to jump
  const jump = () => {
    if (gameOver) return;
    // Ensure AudioContext is running (required after user interaction)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    player.vy = player.jumpStrength;
    // Play jump beep
    playBeep(440, 100);
  };
  document.addEventListener('keydown', (e) => {
    // Initialize/resume audio context on any key press (user gesture)
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (e.code === 'Space' || e.code === 'ArrowUp') jump();
  });

  function spawnObstacle() {
    const gapY = Math.random() * (HEIGHT - gapHeight - 40) + 20; // keep gap away from edges
    obstacles.push({ x: WIDTH, gapY, passed: false });
  }

  function update(delta) {
    if (gameOver) return;
    // Player physics
    player.vy += player.gravity;
    player.y += player.vy;
    // Keep player inside canvas vertically
    if (player.y + player.size > HEIGHT) {
      player.y = HEIGHT - player.size;
      player.vy = 0;
    }
    if (player.y < 0) {
      player.y = 0;
      player.vy = 0;
    }

    // Move starfield (parallax)
    stars.forEach(star => {
      star.x -= 0.5; // slower than obstacles
      if (star.x < 0) star.x = WIDTH;
    });

    // Obstacles movement
    obstacles.forEach((obs) => {
      obs.x -= obstacleSpeed;
    });
    // Remove off‑screen obstacles
    obstacles = obstacles.filter((obs) => obs.x + obstacleWidth > 0);

    // Spawn new obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Collision detection & scoring
    obstacles.forEach((obs) => {
      // Score when player passes obstacle centre
      if (!obs.passed && obs.x + obstacleWidth < player.x) {
        obs.passed = true;
        score++;
        // Play score beep
        playBeep(660, 80);
      }

      const inXRange = player.x + player.size > obs.x && player.x < obs.x + obstacleWidth;
      if (inXRange) {
        const inGap = player.y + player.size > obs.gapY && player.y < obs.gapY + gapHeight;
        if (!inGap) {
          gameOver = true;
        }
      }
    });
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background with gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Player with neon glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.restore();

    // Obstacles with neon glow
    obstacles.forEach((obs) => {
      ctx.save();
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f0f';
      // Top bar
      ctx.fillRect(obs.x, 0, obstacleWidth, obs.gapY);
      // Bottom bar
      ctx.fillRect(obs.x, obs.gapY + gapHeight, obstacleWidth, HEIGHT - (obs.gapY + gapHeight));
      ctx.restore();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f55';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
