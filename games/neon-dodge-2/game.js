// Neon Dodge game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 400;
  const h = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = { x: w / 2, y: h - 40, size: 20, speed: 5 };
  let moveLeft = false, moveRight = false;

  // Obstacles
  const obstacles = [];
  const obstacleWidth = 60, gap = 100;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Game state
  let running = true;
  let gameOverPlayed = false;
  let lastTime = 0;

  // Input handling
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  document.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') { moveLeft = true; playTone(440, 0.1); }
    if (e.key === 'ArrowRight') { moveRight = true; playTone(660, 0.1); }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') moveLeft = false;
    if (e.key === 'ArrowRight') moveRight = false;
  });

  function spawnObstacle() {
    // random x position within canvas width
    const x = Math.random() * (w - obstacleWidth);
    // top obstacle slides down
    obstacles.push({ x, y: -obstacleWidth, w: obstacleWidth, h: obstacleWidth, dy: 2 });
    // bottom obstacle slides up
    obstacles.push({ x, y: h, w: obstacleWidth, h: obstacleWidth, dy: -2 });
  }

  function update(dt) {
    // player movement
    if (moveLeft) player.x -= player.speed;
    if (moveRight) player.x += player.speed;
    player.x = Math.max(0, Math.min(w - player.size, player.x));

    // obstacles
    obstacles.forEach(o => o.y += o.dy);
    // remove off-screen obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o.y > h || o.y + o.h < 0) obstacles.splice(i, 1);
    }

    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        running = false;
        break;
      }
    }
  }

  function draw() {
    // Clear with dark gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a001f');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Neon grid lines
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 30) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Helper for rounded rect
    function roundedRect(x, y, w_, h_, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w_ - r, y);
      ctx.quadraticCurveTo(x + w_, y, x + w_, y + r);
      ctx.lineTo(x + w_, y + h_ - r);
      ctx.quadraticCurveTo(x + w_, y + h_, x + w_ - r, y + h_);
      ctx.lineTo(x + r, y + h_);
      ctx.quadraticCurveTo(x, y + h_, x, y + h_ - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // Draw player as glowing circle
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw obstacles with neon glow
    ctx.fillStyle = '#f0f';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    obstacles.forEach(o => {
      roundedRect(o.x, o.y, o.w, o.h, 5);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function loop(timestamp) {
    if (!running) {
      if (!gameOverPlayed) {
        playTone(150, 0.5);
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
      return;
    }
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (timestamp - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = timestamp;
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
