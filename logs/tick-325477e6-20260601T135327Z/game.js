// Simple endless runner based on IDEA.md
// Canvas element with id "game" must exist in the HTML.

(() => {
  // Audio setup
  const AudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = AudioCtx.createOscillator();
    const gain = AudioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(AudioCtx.destination);
    gain.gain.setValueAtTime(0.001, AudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, AudioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, AudioCtx.currentTime + dur);
    osc.start();
    osc.stop(AudioCtx.currentTime + dur);
  }
  function playCollisionSound() { playTone(200, 0.2); }
  function playPowerUpSound() { playTone(600, 0.15); }
  function startBackgroundMusic() {
    setInterval(() => playTone(80, 0.3), 2000);
  }
  let musicStarted = false;

  const canvas = document.getElementById('game');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);

  // --- player ---
  const player = {
    x: 50,
    y: H / 2 - 15,
    w: 30,
    h: 30,
    dy: 0,
    speed: 4,
    health: 3,
  };

  // --- obstacles & power‑ups ---
  const obstacles = [];
  const powerUps = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!musicStarted) { startBackgroundMusic(); musicStarted = true; }
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Starfield for background (moving stars)
  const stars = Array.from({ length: 100 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));

  function spawnObstacle() {
    const radius = 10 + Math.random() * 15;
    obstacles.push({
      x: W,
      y: Math.random() * (H - radius * 2),
      r: radius,
      speed: 3 + Math.random() * 2,
    });
  }

  function spawnPowerUp() {
    const size = 15;
    powerUps.push({
      x: W,
      y: Math.random() * (H - size),
      size,
      angle: 0,
      speed: 3,
    });
  }

  function circleCollide(a, b) {
    // treat a as rect, b as circle
    const cx = b.x + b.r;
    const cy = b.y + b.r;
    const nearestX = Math.max(a.x, Math.min(cx, a.x + a.w));
    const nearestY = Math.max(a.y, Math.min(cy, a.y + a.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < b.r * b.r;
  }

  function update() {
    if (gameOver) return;
    // player movement
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    else if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
    else player.dy = 0;
    player.y = Math.max(0, Math.min(H - player.h, player.y + player.dy));

    // move stars
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
      }
    });

    // spawn logic
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 300 === 0) spawnPowerUp();

    // update obstacles & power‑ups
    obstacles.forEach(o => (o.x -= o.speed));
    powerUps.forEach(p => {
      p.x -= p.speed;
      p.angle += 0.05;
    });

    // collision check (player vs obstacles)
    obstacles.forEach((o, i) => {
      if (circleCollide(player, o)) {
        player.health--;
        playCollisionSound();
        obstacles.splice(i, 1);
        if (player.health <= 0) gameOver = true;
      } else if (o.x + o.r * 2 < 0) {
        obstacles.splice(i, 1);
        score += 10;
      }
    });
    // player vs power‑ups
    powerUps.forEach((p, i) => {
      if (rectCollide(player, { x: p.x, y: p.y, w: p.size, h: p.size })) {
        player.health = Math.min(3, player.health + 1);
        powerUps.splice(i, 1);
        score += 5;
      } else if (p.x + p.size < 0) {
        powerUps.splice(i, 1);
      }
    });

    frame++;
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // stars
    ctx.fillStyle = '#0ff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    // player ship (triangle neon)
    ctx.fillStyle = '#0ff';
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h / 2);
    ctx.lineTo(player.x + player.w, player.y);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // obstacles (glowing circles)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(
        o.x + o.r,
        o.y + o.r,
        o.r * 0.2,
        o.x + o.r,
        o.y + o.r,
        o.r
      );
      grad.addColorStop(0, 'rgba(255,85,85,0.8)');
      grad.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.r, o.y + o.r, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // power‑ups (rotating squares with glow)
    powerUps.forEach(p => {
      ctx.save();
      ctx.translate(p.x + p.size / 2, p.y + p.size / 2);
      ctx.rotate(p.angle);
      ctx.fillStyle = 'rgba(85,255,85,0.7)';
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Health: ' + player.health, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
