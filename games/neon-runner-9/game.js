// Neon Runner – minimal implementation targeting <canvas id="game">

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // player
  const player = { w: 30, h: 30, x: width / 2 - 15, y: height - 40, speed: 5, dx: 0 };

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // sound setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  };

  // game state
  let obstacles = [];
  let stars = [];
  let obstacleTimer = 0;
  let starTimer = 0;
  let speed = 2; // falling speed
  let score = 0;
  let slowTimer = 0; // power‑up timer
  let gameOver = false;

  function spawnObstacle() {
    const w = 50 + Math.random() * 50;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -30, w, h: 30 });
  }

  function spawnStar() {
    const size = 15;
    const x = Math.random() * (width - size);
    stars.push({ x, y: -size, size });
  }

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys['ArrowLeft']) player.dx = -player.speed;
    else if (keys['ArrowRight']) player.dx = player.speed;
    else player.dx = 0;
    player.x = Math.max(0, Math.min(width - player.w, player.x + player.dx));

    // spawn logic
    obstacleTimer += dt;
    starTimer += dt;
    if (obstacleTimer > 1000) { spawnObstacle(); obstacleTimer = 0; speed += 0.02; }
    if (starTimer > 3000) { spawnStar(); starTimer = 0; }

    // update obstacles and stars
    const curSpeed = slowTimer > 0 ? speed / 2 : speed;
    obstacles.forEach(o => o.y += curSpeed);
    stars.forEach(s => s.y += curSpeed);
    obstacles = obstacles.filter(o => o.y < height);
    stars = stars.filter(s => s.y < height);

    // collision with obstacles (play sound on hit)
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x && player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        // low tone for crash
        playTone(150, 0.3);
        break;
      }
    }

    // collision with stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
        if (player.x < s.x + s.size && player.x + player.w > s.x && player.y < s.y + s.size && player.y + player.h > s.y) {
          score += 10;
          // high tone for star collection
          playTone(400, 0.15);
          if (Math.random() < 0.2) slowTimer = 5000; // ms
          stars.splice(i, 1);
        }
    }

    if (slowTimer > 0) slowTimer -= dt;
  }

  function draw() {
    // gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // helper for rounded rect
    const roundRect = (x, y, w, h, r) => {
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
    };

    // player with neon glow and rounded corners
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0ff';
    roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // obstacles with glow
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      roundRect(o.x, o.y, o.w, o.h, 4);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // stars as glowing circles
    ctx.shadowColor = '#ff0';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x + s.size / 2, s.y + s.size / 2, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();