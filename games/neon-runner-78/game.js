// Neon Runner – enhanced graphics with neon glow, stars, and gradients
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + dur);
  };
  // background hum loop
  const bgInterval = setInterval(() => playTone(60, 0.5), 3000);

  // full‑window canvas and star field
  const stars = [];
  const starCount = 100;
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.5 + 0.5 });
    }
  };
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initStars();
  };
  window.addEventListener('resize', resize);
  resize();

  // player ship – triangle
  const player = { x: 80, y: canvas.height / 2, size: 20, speed: 4 };
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => keys[e.key] = false);

  // obstacles – circles moving left
  const obstacles = [];
  let obstacleTimer = 0;
  let speed = 2; // base speed
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  const update = dt => {
    // player movement (arrows or WASD)
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    // keep inside canvas
    player.y = Math.max(0, Math.min(canvas.height, player.y));
    player.x = Math.max(0, Math.min(canvas.width, player.x));

    // spawn obstacles
    obstacleTimer -= dt;
    if (obstacleTimer <= 0) {
      const radius = 10 + Math.random() * 10;
      obstacles.push({ x: canvas.width + radius, y: Math.random() * canvas.height, r: radius });
      obstacleTimer = 800 - Math.min(600, score * 10); // faster over time
    }

    // move obstacles left
    obstacles.forEach(o => o.x -= speed + score * 0.01);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].r < 0) obstacles.shift();

    // collision detection (simple circle‑triangle approximation using player bounding box)
    const playerBox = { x: player.x - player.size, y: player.y - player.size, w: player.size * 2, h: player.size * 2 };
    for (const o of obstacles) {
      const dx = Math.max(playerBox.x, Math.min(o.x, playerBox.x + playerBox.w));
      const dy = Math.max(playerBox.y, Math.min(o.y, playerBox.y + playerBox.h));
      const dist = Math.hypot(o.x - dx, o.y - dy);
      if (dist < o.r) {
        // play collision sound
        playTone(200, 0.3);
        gameOver = true;
        clearInterval(bgInterval);
        break;
      }
    }

    // score based on time survived
    score = Math.floor((performance.now() - startTime) / 100);
  };

  const draw = () => {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // draw player (neon triangle with glow)
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset
    // draw obstacles with slight neon glow
    obstacles.forEach(o => {
      ctx.shadowColor = '#f0f';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f0f';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText('Score: ' + score, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  let last = performance.now();
  const loop = () => {
    const now = performance.now();
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
