// Neon Runner – minimal canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }

  // Helper: draw rounded rectangle with current fill style
  function drawRoundedRect(x, y, w, h, r) {
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
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  // Player definition
  const player = {
    x: 50,
    y: H - 40,
    w: 30,
    h: 30,
    vy: 0,
    jumpStrength: -12,
    gravity: 0.5,
    onGround: true,
  };

  // Obstacle pool
  const obstacles = [];
  const obstacleSpeed = 4;
  let spawnTimer = 0;
  const spawnInterval = 90; // frames

  let gameOver = false;
  let frame = 0;

  // Input – single click/tap to jump
  canvas.addEventListener('pointerdown', () => {
    if (gameOver) return restart();
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      // Jump sound
      playTone(500, 80);
    }
  });

  function restart() {
    obstacles.length = 0;
    player.y = H - 40;
    player.vy = 0;
    player.onGround = true;
    gameOver = false;
    frame = 0;
    requestAnimationFrame(loop);
  }

  function rectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function loop() {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', W / 2, H / 2);
      return;
    }

    // Update player
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawn obstacles
    if (spawnTimer <= 0) {
      const obstacleHeight = 30 + Math.random() * 30;
      obstacles.push({
        x: W,
        y: H - obstacleHeight,
        w: 20 + Math.random() * 20,
        h: obstacleHeight,
      });
      spawnTimer = spawnInterval + Math.random() * 30;
    } else {
      spawnTimer--;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision check
      if (rectCollision(player, o)) {
        // Collision sound
        playTone(200, 150);
        gameOver = true;
      }
    }

    // Render with neon style
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Neon glow settings for player
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    drawRoundedRect(player.x, player.y, player.w, player.h, 6);

    // Neon glow for obstacles
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => drawRoundedRect(o.x, o.y, o.w, o.h, 4));

    frame++;
    requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
