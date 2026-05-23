// Minimal endless runner for <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 800);
  const H = (canvas.height = 200);

  // Player
  const player = {x: 50, y: H - 40, w: 30, h: 30, vy: 0, jumpForce: -12, onGround: true};
  const GRAVITY = 0.6;

  // Obstacles
  const obstacles = [];
  const OBSTACLE_W = 20;
  const OBSTACLE_GAP = 1500; // ms between spawns
  let lastObstacle = 0;

  // Score
  let score = 0;
  let gameOver = false;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  };

  // Input handling with sound
  const jump = () => {
    if (player.onGround) {
      player.vy = player.jumpForce;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
  };
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  document.addEventListener('keydown', e => { if (e.code === 'Space') { resumeAudio(); jump(); } });
  canvas.addEventListener('click', e => { resumeAudio(); jump(); });

  const spawnObstacle = () => {
    const height = 30 + Math.random() * 30;
    obstacles.push({x: W, y: H - height, w: OBSTACLE_W, h: height});
  };

  const update = dt => {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
      // Collision
        if (!gameOver &&
            player.x < o.x + o.w && player.x + player.w > o.x &&
            player.y < o.y + o.h && player.y + player.h > o.y) {
          gameOver = true;
          playTone(220, 0.3); // collision sound
        }
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Spawn new obstacle
    if (performance.now() - lastObstacle > OBSTACLE_GAP) {
      spawnObstacle();
      lastObstacle = performance.now();
    }

    // Score
    if (!gameOver) score = Math.floor(performance.now() / 100);
  };

  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    // background with vertical gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#020202');
    bgGrad.addColorStop(1, '#0a0a2a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // neon player with glow
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // reset shadow for other draws
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // neon obstacles with gradient and glow
    const obsGrad = ctx.createLinearGradient(0, 0, 0, H);
    obsGrad.addColorStop(0, '#ff0044');
    obsGrad.addColorStop(1, '#ff2200');
    ctx.fillStyle = obsGrad;
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 8;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    // reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    // ground line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H - 1);
    ctx.lineTo(W, H - 1);
    ctx.stroke();
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  };

  let lastTime = 0;
  const loop = ts => {
    const dt = ts - lastTime;
    lastTime = ts;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
