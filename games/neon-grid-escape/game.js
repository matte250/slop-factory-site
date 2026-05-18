// Neon Grid Escape - simple canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const player = { x: 50, y: canvas.height / 2, r: 8, speed: 3 };
  const obstacles = [];
  let score = 0;
  let lastSpawn = 0;
  let gameOver = false;
  let lastTime = 0;

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  const spawnObstacle = () => {
    const size = 20 + Math.random() * 30; // random size
    const y = Math.random() * (canvas.height - size);
    obstacles.push({ x: canvas.width, y, w: size, h: size });
  };

  const update = (dt) => {
    if (gameOver) return;
    // move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep inside bounds
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

    // move obstacles leftwards (grid scroll)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= 2 + dt * 0.005; // speed increases slightly with time
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // spawn new obstacles periodically
    if (performance.now() - lastSpawn > 800) {
      spawnObstacle();
      // sound for new obstacle
      playTone(300, 0.05);
      lastSpawn = performance.now();
    }

    // collision detection
    for (const ob of obstacles) {
      const dx = Math.abs(player.x - (ob.x + ob.w / 2));
      const dy = Math.abs(player.y - (ob.y + ob.h / 2));
      if (dx < player.r + ob.w / 2 && dy < player.r + ob.h / 2) {
        // collision sound
        playTone(100, 0.2);
        gameOver = true;
        break;
      }
    }

    // increase score based on distance (time)
    score += dt * 0.01;
  };

  const drawGrid = () => {
    const spacing = 40;
    ctx.lineWidth = 1;
    // Neon grid lines with glow
    ctx.strokeStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    for (let x = 0; x < canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  };

  const render = () => {
        // Background gradient for depth
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // neon grid effect
    ctx.save();
    ctx.globalAlpha = 0.3;
    drawGrid();
    ctx.restore();

    // draw obstacles with neon glow
    ctx.fillStyle = '#ff00aa';
    ctx.shadowColor = '#ff00aa';
    ctx.shadowBlur = 6;
    for (const ob of obstacles) {
      ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
    }
    // reset shadow after obstacles
    ctx.shadowBlur = 0;

    // draw player with neon glow
    ctx.fillStyle = '#00ffcc';
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // reset shadow after player
    ctx.shadowBlur = 0;

    // draw score with neon glow
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 6;
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.shadowBlur = 0;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff5555';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px monospace';
      ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 30);
    }
  };

  const loop = (timestamp) => {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // restart on click after game over
  canvas.addEventListener('click', () => {
    if (!gameOver) return;
    obstacles.length = 0;
    player.x = 50;
    player.y = canvas.height / 2;
    score = 0;
    gameOver = false;
    lastSpawn = performance.now();
  });
})();
