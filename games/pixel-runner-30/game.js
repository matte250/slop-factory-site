// Simple endless runner for canvas id="game"
// Player: 20×20 square, jumps with Space/ArrowUp
// Obstacles: 20×40 rects generated every 1.5‑2 s, move left
// Score: frames survived (≈ distance)

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  const player = {
    w: 20,
    h: 20,
    x: 50,
    y: H - 20,
    vy: 0,
    color: '#0af',
  };
  const GRAVITY = 0.6;
  const JUMP = -12;

  const obstacles = [];
  const OBSTACLE_W = 20;
  const OBSTACLE_H = 40;
  let obstacleTimer = 0;
  const particles = [];
  let obstacleInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  const reset = () => {
    particles.length = 0;
    player.y = H - player.h;
    player.vy = 0;
    obstacles.length = 0;
    obstacleTimer = 0;
    obstacleInterval = 1500;
    lastTime = performance.now();
    score = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  };

  const spawnObstacle = () => {
    obstacles.push({
      x: W,
      y: H - OBSTACLE_H,
      w: OBSTACLE_W,
      h: OBSTACLE_H,
    });
  };

  const update = (dt) => {
    // update particles
    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    // remove dead particles
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i].life <= 0 || particles[i].x < -10) {
        particles.splice(i, 1);
      }
    }
    // spawn occasional spark particles near player when on ground
    if (player.vy === 0 && Math.random() < 0.05) {
      particles.push({
        x: player.x + player.w / 2,
        y: player.y + player.h,
        vx: -0.05,
        vy: -0.02,
        r: 2 + Math.random() * 2,
        life: 500 + Math.random() * 500,
      });
    }
    // Player physics
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > H - player.h) {
      player.y = H - player.h;
      player.vy = 0;
    }
    // Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= (200 * dt) / 1000; // 200px/s
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Collision
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        gameOver = true;
        break;
      }
    }
    // Spawn timer
    obstacleTimer += dt;
    if (obstacleTimer > obstacleInterval) {
      spawnObstacle();
      obstacleTimer = 0;
      // randomize next interval 1.2‑2 s
      obstacleInterval = 1200 + Math.random() * 800;
    }
    // Score
    score += dt;
  };

  const draw = () => {
    // Background gradient sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#89cfff');
    skyGrad.addColorStop(1, '#5ea9ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Ground with slight gradient
    const groundGrad = ctx.createLinearGradient(0, H - 20, 0, H);
    groundGrad.addColorStop(0, '#3b3b3b');
    groundGrad.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H - 20, W, 20);

    // Draw particles (simple circles)
    ctx.fillStyle = 'rgba(255,255,0,0.8)';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player as rounded square
    ctx.fillStyle = player.color;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // Obstacles with varying colors
    obstacles.forEach(o => {
      const hue = (o.x * 0.1) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score / 100)}`, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2 - 10);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press R to restart', W / 2, H / 2 + 20);
    }
  };

  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  // Input
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (!gameOver && player.y === H - player.h) {
        player.vy = JUMP;
        playBeep(800, 0.1); // jump sound
      }
    }
    if (e.code === 'KeyR' && gameOver) reset();
  });

  // start
  reset();
})();
