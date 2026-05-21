// Minimal endless runner based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump() { playTone(440, 0.1); }
  function playHit() { playTone(150, 0.3); }
  const W = canvas.width = 800;
  const H = canvas.height = 200;

  // Player
  const player = { x: 50, y: H - 20, w: 10, h: 10, vy: 0, onGround: true, slide: false };
  const GRAV = 0.8;
  const JUMP_V = -12;

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;

  // Score
  let score = 0;
  let gameOver = false;

  // Input
  window.addEventListener('keydown', e => { audioCtx.resume();
    if (gameOver && e.key === 'Enter') restart();
    if (e.code === 'Space' && player.onGround) { player.vy = JUMP_V; player.onGround = false; playJump(); }
    if (e.code === 'ArrowDown') player.slide = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowDown') player.slide = false;
  });

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'wall';
    if (type === 'spike') {
      obstacles.push({ x: W, y: H - 20, w: 10, h: 10, type });
    } else {
      const h = 30;
      obstacles.push({ x: W, y: H - h, w: 20, h, type });
    }
  }

  function update() {
    // player physics
    player.vy += GRAV;
    player.y += player.vy;
    if (player.y > H - player.h) { player.y = H - player.h; player.vy = 0; player.onGround = true; }
    // slide reduces height
    if (player.slide) { player.h = 5; } else { player.h = 10; }

    // obstacles movement
    obstacleTimer--;
    if (obstacleTimer <= 0) { spawnObstacle(); obstacleTimer = 80 + Math.random() * 40; }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // collision
    for (const o of obstacles) {
      if (rectIntersect(player, o)) { playHit(); gameOver = true; break; }
    }

    if (!gameOver) score++;
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground with slight gradient
    const groundGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    groundGrad.addColorStop(0, '#654321');
    groundGrad.addColorStop(1, '#2b1b0e');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 20, W, 20);

    // Player as a circle with a subtle shadow
    ctx.save();
    ctx.fillStyle = '#00ff7f';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, Math.max(player.w, player.h) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Draw obstacles with type‑based graphics
    obstacles.forEach(o => {
      if (o.type === 'spike') {
        // Draw a red triangle spike
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // Wall – dark rectangle with slight gradient
        const wallGrad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
        wallGrad.addColorStop(0, '#888');
        wallGrad.addColorStop(1, '#555');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(o.x, o.y, o.w, o.h);
      }
    });

    // Score text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '20px sans-serif';
      ctx.fillText('Game Over – Press Enter to Restart', W / 2, H / 2);
    }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  }

  function restart() {
    obstacles.length = 0;
    player.y = H - 20;
    player.vy = 0;
    player.onGround = true;
    player.slide = false;
    score = 0;
    gameOver = false;
    obstacleTimer = 0;
  }

  loop();
})();
