// Neon Grid Escape – enhanced graphics
// Canvas with id="game" must be present in the page.

(() => {
  const canvas = document.getElementById('game');
  // audio context (initialized on first interaction)
  let audioCtx;
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth);
  const H = (canvas.height = canvas.offsetHeight);

  const player = { x: W / 2, y: H * 0.8, r: 8, speed: 3, shield: false, shieldT: 0 };
  let offsetY = 0; // grid scroll offset
  const obstacles = [];
  const powerUps = [];
  // starfield for background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (W - size);
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 100%, 55%)`;
    obstacles.push({ x, y: -size, w: size, h: size, color });
  }
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (W - size);
    obstacles.push({ x, y: -size, w: size, h: size });
  }

  function spawnPowerUp() {
    const size = 12;
    const x = Math.random() * (W - size);
    powerUps.push({ x, y: -size, r: size / 2, collected: false });
  }

  function update(dt) {
    if (gameOver) return;
    // player movement
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(W - player.r, player.x));
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));

    // scroll grid
    offsetY += 1.5;
    // spawn obstacles/power‑ups
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.005) spawnPowerUp();

    // move obstacles
    obstacles.forEach(o => (o.y += 2));
    // move power‑ups
    powerUps.forEach(p => (p.y += 2));

    // collision detection
    obstacles.forEach((o, i) => {
      if (
        player.x + player.r > o.x &&
        player.x - player.r < o.x + o.w &&
        player.y + player.r > o.y &&
        player.y - player.r < o.y + o.h
      ) {
        if (player.shield) {
          obstacles.splice(i, 1); // destroy while shielded
          score += 10;
          playTone(800, 0.1); // destroy sound
        } else {
          gameOver = true;
          playTone(200, 0.5); // game over sound
        }
      } else if (o.y > H) {
        obstacles.splice(i, 1);
        score += 5;
      }
    });

    powerUps.forEach((p, i) => {
      const dx = player.x - p.x - p.r;
      const dy = player.y - p.y - p.r;
      if (dx * dx + dy * dy < (player.r + p.r) ** 2) {
        player.shield = true;
        player.shieldT = 600; // frames ~10 s at 60 fps
        powerUps.splice(i, 1);
        score += 15;
      } else if (p.y > H) {
        powerUps.splice(i, 1);
      }
    });

    if (player.shield) {
      player.shieldT--;
      if (player.shieldT <= 0) player.shield = false;
    }
    score += dt * 0.01; // distance‑based points
  }

  function drawGrid() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#000020');
  bgGrad.addColorStop(1, '#000010');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // grid glow effect
  ctx.shadowColor = '#0ff8';
  ctx.shadowBlur = 8;
  const spacing = 40;
  ctx.strokeStyle = '#0ff4';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = 0; x <= W; x += spacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = -spacing + (offsetY % spacing); y <= H; y += spacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  // reset shadow for other drawings
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  // grid glow effect applied to lines
  ctx.shadowColor = '#0ff8';
  ctx.shadowBlur = 4;
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#000020');
  bgGrad.addColorStop(1, '#000010');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);
  // grid glow effect
  ctx.shadowColor = '#0ff8';
  ctx.shadowBlur = 8;
    const spacing = 40;
    ctx.strokeStyle = '#0ff4';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
    }
    for (let y = -spacing + (offsetY % spacing); y <= H; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
    }
    ctx.stroke();
  }

  function draw() {
  // background stars
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  stars.forEach(s => {
    const twinkle = 0.7 + Math.random() * 0.3;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
  // draw grid and objects
  ctx.clearRect(0, 0, W, H);
  drawGrid();
  // obstacles – neon blocks with glow
  obstacles.forEach(o => {
    ctx.shadowColor = o.color || '#ff0a';
    ctx.shadowBlur = 12;
    ctx.fillStyle = o.color || '#ff0a';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  });
  // power‑ups (glowing circles)
  powerUps.forEach(p => {
    const grad = ctx.createRadialGradient(p.x + p.r, p.y + p.r, 0, p.x + p.r, p.y + p.r, p.r);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x + p.r, p.y + p.r, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
  // player (glow)
  const glow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 4);
  glow.addColorStop(0, player.shield ? '#ff0' : '#0ff');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r * 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  // score / game over text
  ctx.fillStyle = '#0ff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  if (gameOver) {
    ctx.fillStyle = '#f00';
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }
}

    ctx.clearRect(0, 0, W, H);
    drawGrid();
    // obstacles – neon blocks with glow
    obstacles.forEach(o => {
      // glow effect
      ctx.shadowColor = '#ff0a';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ff0a';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      // reset shadow for other drawing
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
    // power‑ups (glowing circles)
    powerUps.forEach(p => {
      const grad = ctx.createRadialGradient(p.x + p.r, p.y + p.r, 0, p.x + p.r, p.y + p.r, p.r);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x + p.r, p.y + p.r, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // player (glow)
    const glow = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r * 4);
    glow.addColorStop(0, player.shield ? '#ff0' : '#0ff');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // score / game over text
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
