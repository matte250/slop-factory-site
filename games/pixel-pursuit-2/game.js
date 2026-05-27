// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth || 400);
  const height = (canvas.height = canvas.offsetHeight || 300);

  const laneCount = 3;
  const laneWidth = width / laneCount;
  const playerSize = 20;
  const player = {
    lane: 1, // start in middle lane (0,1,2)
    y: height - playerSize - 5,
    size: playerSize,
    color: '#ff5722',
  };

  const obstacles = [];
  const collectibles = [];
  const speed = 2; // pixels per frame
  let frame = 0;
  let score = 0;
  let gameOver = false;

  const randInt = (max) => Math.floor(Math.random() * max);
  // Pre‑generate starfield for background
  const starCount = 80;
  const stars = Array.from({length: starCount}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
  }));

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const playCollectSound = () => playTone(500, 0.1);
  const playCrashSound = () => playTone(150, 0.3);

  const spawnObstacle = () => {
    obstacles.push({
      lane: randInt(laneCount),
      y: -playerSize,
      size: playerSize,
      color: '#3f51b5',
    });
  };

  const spawnCollectible = () => {
    collectibles.push({
      lane: randInt(laneCount),
      y: -playerSize,
      size: playerSize * 0.8,
      color: '#ffeb3b',
    });
  };

  const handleInput = () => {
    // Cycle lane on click or space
    const nextLane = (player.lane + 1) % laneCount;
    player.lane = nextLane;
  };
  canvas.addEventListener('click', (e) => {
    // resume audio on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    handleInput(e);
  });
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') handleInput();
    if (e.code === 'ArrowLeft') player.lane = Math.max(0, player.lane - 1);
    if (e.code === 'ArrowRight') player.lane = Math.min(laneCount - 1, player.lane + 1);
  });

  const update = () => {
    if (gameOver) return;
    frame++;
    // Spawn obstacles/collectibles at intervals
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 150 === 0) spawnCollectible();
    // Move obstacles downwards (simulating forward motion)
    obstacles.forEach((o) => (o.y += speed));
    collectibles.forEach((c) => (c.y += speed));
    // Move stars slowly for parallax effect
    stars.forEach((s) => {
      s.y += speed * 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // Remove off‑screen items
    while (obstacles.length && obstacles[0].y > height) obstacles.shift();
    while (collectibles.length && collectibles[0].y > height) collectibles.shift();
    // Collision detection
    const playerX = player.lane * laneWidth + laneWidth / 2 - player.size / 2;
    const playerRect = { x: playerX, y: player.y, w: player.size, h: player.size };
    for (const o of obstacles) {
      const ox = o.lane * laneWidth + laneWidth / 2 - o.size / 2;
      const rect = { x: ox, y: o.y, w: o.size, h: o.size };
      if (rect.x < playerRect.x + playerRect.w && rect.x + rect.w > playerRect.x && rect.y < playerRect.y + playerRect.h && rect.y + rect.h > playerRect.y) {
        playCrashSound();
        gameOver = true;
        break;
      }
    }
    // Collectibles
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      const cx = c.lane * laneWidth + laneWidth / 2 - c.size / 2;
      const rect = { x: cx, y: c.y, w: c.size, h: c.size };
      if (rect.x < playerRect.x + playerRect.w && rect.x + rect.w > playerRect.x && rect.y < playerRect.y + playerRect.h && rect.y + rect.h > playerRect.y) {
        playCollectSound();
        score += 10;
        collectibles.splice(i, 1);
      }
    }
    score += 0.05; // survival points
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#fafafa');
    bgGrad.addColorStop(1, '#e0e0ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw lanes with subtle shadows
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    for (let i = 1; i < laneCount; i++) {
      const x = i * laneWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    // Draw starfield
    stars.forEach((s) => {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Draw player as gradient circle with shadow
    const px = player.lane * laneWidth + laneWidth / 2;
    const radius = player.size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, player.y + radius, radius, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    const playerGrad = ctx.createRadialGradient(px, player.y + radius, radius * 0.2, px, player.y + radius, radius);
    playerGrad.addColorStop(0, '#ff8a65');
    playerGrad.addColorStop(1, player.color);
    ctx.fillStyle = playerGrad;
    ctx.fill();
    ctx.restore();
    // Draw obstacles as rounded gradient blocks
    obstacles.forEach((o) => {
      const ox = o.lane * laneWidth + laneWidth / 2 - o.size / 2;
      const rad = 4;
      const grad = ctx.createLinearGradient(ox, o.y, ox, o.y + o.size);
      grad.addColorStop(0, '#6a8caf');
      grad.addColorStop(1, o.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(ox + rad, o.y);
      ctx.lineTo(ox + o.size - rad, o.y);
      ctx.quadraticCurveTo(ox + o.size, o.y, ox + o.size, o.y + rad);
      ctx.lineTo(ox + o.size, o.y + o.size - rad);
      ctx.quadraticCurveTo(ox + o.size, o.y + o.size, ox + o.size - rad, o.y + o.size);
      ctx.lineTo(ox + rad, o.y + o.size);
      ctx.quadraticCurveTo(ox, o.y + o.size, ox, o.y + o.size - rad);
      ctx.lineTo(ox, o.y + rad);
      ctx.quadraticCurveTo(ox, o.y, ox + rad, o.y);
      ctx.closePath();
      ctx.fill();
    });
    // Draw collectibles as glowing circles
    collectibles.forEach((c) => {
      const cx = c.lane * laneWidth + laneWidth / 2;
      const radius = c.size / 2;
      ctx.save();
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      const grad = ctx.createRadialGradient(cx, c.y + radius, radius * 0.2, cx, c.y + radius, radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, c.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, c.y + radius, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = () => {
    if (!gameOver) update();
    draw();
    requestAnimationFrame(loop);
  };

  // Start the game loop
  requestAnimationFrame(loop);
})();
