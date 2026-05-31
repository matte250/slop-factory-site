// Simple endless runner based on IDEA.md
// Targets a <canvas id="game"></canvas> present in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas found.
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 800);
  const height = (canvas.height = canvas.offsetHeight || 200);

  // Player properties
  const player = {
    x: 50,
    y: height - 30,
    w: 20,
    h: 30,
    vy: 0,
    jumpStrength: -8,
    color: '#0f0',
  };

  const gravity = 0.4;

  // Audio context and helper functions
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() {
    playTone(440, 0.1);
  }
  function playHitSound() {
    playTone(100, 0.3);
  }
  const groundY = height - player.h;

  // Obstacles array
  const obstacles = [];
  const obstacleSpeed = 3;
  const obstacleFreq = 1500; // ms between obstacles
  let lastObstacleTime = 0;

  let score = 0;
  let lastTime = 0;
  let gameOver = false;

  function reset() {
    player.y = groundY;
    player.vy = 0;
    obstacles.length = 0;
    score = 0;
    lastObstacleTime = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const size = Math.random() * 20 + 20; // 20-40px height
    obstacles.push({
      x: width,
      y: height - size,
      w: 20,
      h: size,
      color: '#f00',
    });
  }

  function update(dt) {
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y > groundY) {
      player.y = groundY;
      player.vy = 0;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacles
    if (Date.now() - lastObstacleTime > obstacleFreq) {
      spawnObstacle();
      lastObstacleTime = Date.now();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Play hit sound on collision
        if (audioCtx.state !== 'running') audioCtx.resume();
        playHitSound();
        gameOver = true;
        break;
      }
    }

    if (!gameOver) score += dt * 0.01; // score based on time
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#3a3a55');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground with subtle gradient
    const groundGrad = ctx.createLinearGradient(0, groundY + player.h, 0, groundY + player.h + 10);
    groundGrad.addColorStop(0, '#444');
    groundGrad.addColorStop(1, '#222');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY + player.h, width, 10);

    // Helper to draw rounded rect
    function drawRoundedRect(x, y, w, h, r, col) {
      ctx.fillStyle = col;
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
      ctx.fill();
    }

    // Player with rounded corners
    drawRoundedRect(player.x, player.y, player.w, player.h, 4, player.color);

    // Obstacles – vary color and add slight blue tint for depth
    for (const o of obstacles) {
      const col = o.color;
      drawRoundedRect(o.x, o.y, o.w, o.h, 3, col);
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Input handling
  function jump() {
    if (player.y === groundY) {
      player.vy = player.jumpStrength;
      // Ensure audio context is running (required after user gesture)
      if (audioCtx.state !== 'running') audioCtx.resume();
      playJumpSound();
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
  window.addEventListener('touchstart', jump);

  // Start the game once the page is ready
  if (document.readyState === 'complete') reset();
  else window.addEventListener('load', reset);
})();
