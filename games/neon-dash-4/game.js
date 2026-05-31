// Minimal Neon Dash implementation
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);

  // Player (neon square)
  const player = {
    x: W / 2,
    y: H / 2,
    size: 20,
    dx: 0,
    dy: -1, // start moving up
    speed: 2,
    color: '#0ff',
  };

  const obstacles = [];
  let spawnTimer = 0;
  let score = 0;

  const dirs = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + player.speed * 0.5;
    switch (side) {
      case 0: // top
        x = Math.random() * W;
        y = -size;
        vx = 0;
        vy = speed;
        break;
      case 1: // bottom
        x = Math.random() * W;
        y = H + size;
        vx = 0;
        vy = -speed;
        break;
      case 2: // left
        x = -size;
        y = Math.random() * H;
        vx = speed;
        vy = 0;
        break;
      default: // right
        x = W + size;
        y = Math.random() * H;
        vx = -speed;
        vy = 0;
    }
    obstacles.push({ x, y, size, vx, vy, color: '#f0f' });
    // play spawn sound
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playTone(200, 0.05);
  }

  function update(dt) {
    // Move player
    player.x += player.dx * player.speed;
    player.y += player.dy * player.speed;

    // Keep player inside bounds (wrap-around as fall off detection)
    if (player.x < 0 || player.x > W || player.y < 0 || player.y > H) {
      gameOver();
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx;
      o.y += o.vy;
      // remove if out of view
      if (o.x < -o.size || o.x > W + o.size || o.y < -o.size || o.y > H + o.size) {
        obstacles.splice(i, 1);
        continue;
      }
      // collision detection
      if (
        Math.abs(o.x - player.x) < (o.size + player.size) / 2 &&
        Math.abs(o.y - player.y) < (o.size + player.size) / 2
      ) {
        gameOver();
      }
    }

    // spawn logic
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = 1000 / (player.speed * 0.5 + 0.5); // faster speed => more obstacles
    }

    // increase speed/score over time
    score += dt * 0.01;
    player.speed = 2 + Math.sqrt(score) * 0.05;
  }

  function draw() {
    // background gradient (dark to neon)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // helper for rounded neon rectangles
    const drawRounded = (x, y, size, color) => {
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      const r = size * 0.2; // corner radius
      ctx.moveTo(x - size / 2 + r, y - size / 2);
      ctx.lineTo(x + size / 2 - r, y - size / 2);
      ctx.quadraticCurveTo(x + size / 2, y - size / 2, x + size / 2, y - size / 2 + r);
      ctx.lineTo(x + size / 2, y + size / 2 - r);
      ctx.quadraticCurveTo(x + size / 2, y + size / 2, x + size / 2 - r, y + size / 2);
      ctx.lineTo(x - size / 2 + r, y + size / 2);
      ctx.quadraticCurveTo(x - size / 2, y + size / 2, x - size / 2, y + size / 2 - r);
      ctx.lineTo(x - size / 2, y - size / 2 + r);
      ctx.quadraticCurveTo(x - size / 2, y - size / 2, x - size / 2 + r, y - size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // draw player with neon glow
    drawRounded(player.x, player.y, player.size, player.color);

    // draw obstacles with neon glow
    obstacles.forEach(o => {
      drawRounded(o.x, o.y, o.size, o.color);
    });

    // draw score with subtle glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    ctx.restore();
  }

  let last = performance.now();
  let running = true;
  function loop(now) {
    if (!running) return;
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    // game over sound
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playTone(100, 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f88';
    ctx.font = '24px monospace';
    ctx.fillText('Game Over', W / 2 - 60, H / 2);
    ctx.fillText('Score: ' + Math.floor(score), W / 2 - 60, H / 2 + 30);
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // input handling
  document.addEventListener('keydown', e => {
    if (dirs[e.key]) {
      const [dx, dy] = dirs[e.key];
      player.dx = dx;
      player.dy = dy;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      playTone(400, 0.07);
    }
  });

  requestAnimationFrame(loop);
})();
