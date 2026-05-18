// Simple Neon Runner game targeting <canvas id="game">
// Player: neon ship (rectangle) moves with arrow keys.
// Obstacles: moving rectangles scrolling downwards.
// Score: time survived (seconds).

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent (fallback 800x600)
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Generate simple star field for background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  const player = {
    w: 40,
    h: 40,
    x: canvas.width / 2 - 20,
    y: canvas.height - 60,
    speed: 4,
    color: '#0ff',
  };

  const obstacles = [];
  const obstacleConfig = {
    w: 50,
    h: 20,
    speed: 2,
    spawnInterval: 1200, // ms
    lastSpawn: 0,
  };

  let keys = {};
  const score = { value: 0, start: Date.now() };

  // Input handling
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const x = Math.random() * (canvas.width - obstacleConfig.w);
    obstacles.push({ x, y: -obstacleConfig.h, w: obstacleConfig.w, h: obstacleConfig.h });
    // sound for new obstacle
    beep(200, 0.05);
  }

  function update(dt) {
    // move star field
    stars.forEach(s => {
      s.y += 0.5; // slow scroll
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    });
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep within bounds
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // obstacle spawn timing
    if (Date.now() - obstacleConfig.lastSpawn > obstacleConfig.spawnInterval) {
      spawnObstacle();
      obstacleConfig.lastSpawn = Date.now();
    }
    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleConfig.speed;
      // remove off-screen
      if (o.y > canvas.height) obstacles.splice(i, 1);
    }
    // collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // game over
        alert('Game Over! Score: ' + Math.floor(score.value));
        // reset
        obstacles.length = 0;
        player.x = canvas.width / 2 - player.w / 2;
        player.y = canvas.height - 60;
        score.value = 0;
        score.start = Date.now();
        break;
      }
    }
    // update score
    score.value = (Date.now() - score.start) / 1000;
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw player with neon gradient
    const grad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 8,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w / 2
    );
    grad.addColorStop(0, player.color);
    grad.addColorStop(1, '#001');
    ctx.fillStyle = grad;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 20;
    // draw triangular ship
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw obstacles with subtle neon
    ctx.fillStyle = '#f0f';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 10;
    obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));
    ctx.shadowBlur = 0;
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score.value), 10, 20);
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
