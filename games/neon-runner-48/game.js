// Simple Neon Runner game
// Canvas with id "game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = { x: W / 2, y: H - 50, r: 8, speed: 4 };

  // Obstacles
  const obstacles = [];
  const obstacleSize = 20;
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Timer
  const totalTime = 30; // seconds
  let remaining = totalTime;
  let lastTick = performance.now();

  // Audio setup
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollision() { playTone(150, 200); }
  function playMove() { playTone(300, 50); }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') playMove();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    // Move player left/right
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      lastSpawn = performance.now();
      const obsX = Math.random() * (W - obstacleSize);
      obstacles.push({ x: obsX, y: -obstacleSize, w: obstacleSize, h: obstacleSize, speed: 2 + Math.random() * 2 });
    }

    // Move obstacles downward (player moves upward visually)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off‑screen
      if (o.y > H) obstacles.splice(i, 1);
      // Collision (circle‑rect)
      const dx = Math.max(o.x - player.x, 0, player.x - (o.x + o.w));
      const dy = Math.max(o.y - player.y, 0, player.y - (o.y + o.h));
      if (dx * dx + dy * dy < player.r * player.r) { playCollision(); endGame(); }
    }

    // Timer countdown
    const now = performance.now();
    if (now - lastTick >= 1000) {
      remaining--;
      lastTick = now;
      if (remaining <= 0) endGame();
    }
  }

  function draw() {
    // Gradient neon background
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001120');
    grad.addColorStop(1, '#00060a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Neon corridor lines with glow
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.shadowBlur = 0; // reset

    // Player with neon glow
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Obstacles with rounded neon edges
    obstacles.forEach(o => {
      ctx.fillStyle = '#ff9900';
      ctx.shadowColor = '#ff9900';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y);
      ctx.lineTo(o.x + o.w - 4, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + 4);
      ctx.lineTo(o.x + o.w, o.y + o.h - 4);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - 4, o.y + o.h);
      ctx.lineTo(o.x + 4, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - 4);
      ctx.lineTo(o.x, o.y + 4);
      ctx.quadraticCurveTo(o.x, o.y, o.x + 4, o.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Timer text with neon outline
    ctx.fillStyle = '#00ff00';
    ctx.font = '18px monospace';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 6;
    ctx.fillText(`Time: ${remaining}s`, 10, 10);
    ctx.shadowBlur = 0;
  }

  let animationId;
  function loop() {
    const now = performance.now();
    const dt = now - (loop.last ?? now);
    loop.last = now;
    update(dt);
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function endGame() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff0000';
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  // Start
  loop();
})();
