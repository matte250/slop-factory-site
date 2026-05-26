// Neon Grid Escape – minimal implementation
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = 400);
  const H = (canvas.height = 600);
  // ----- Audio setup -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };

  // ----- Game state -----
  const player = { x: 80, y: H - 30, r: 12, vy: 0, gravity: 0.6, jump: -12 };
  const obstacles = [];
  const particles = [];
  let gridOffset = 0;
  let score = 0;
  let gameOver = false;
  let frames = 0;

  // ----- Input -----
  const jump = () => {
    if (!gameOver) {
      player.vy = player.jump;
      playTone(300, 0.1); // jump sound
    }
  };
  window.addEventListener('mousedown', jump);
  window.addEventListener('touchstart', jump);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') jump(); });

  // ----- Helpers -----
  const rectCircleCollide = (rx, ry, rw, rh, cx, cy, cr) => {
    const distX = Math.abs(cx - rx - rw / 2);
    const distY = Math.abs(cy - ry - rh / 2);
    if (distX > rw / 2 + cr) return false;
    if (distY > rh / 2 + cr) return false;
    if (distX <= rw / 2) return true;
    if (distY <= rh / 2) return true;
    const dx = distX - rw / 2;
    const dy = distY - rh / 2;
    return dx * dx + dy * dy <= cr * cr;
  };

  // ----- Game loop -----
  const loop = () => {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0ff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 30);
      return;
    }
    frames++;
    // --- Update ---
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y + player.r > H) { gameOver = true; }

    // spawn obstacles every 120 frames
    if (frames % 120 === 0) {
      const blockHeight = 30 + Math.random() * 40;
      const gap = 80 + Math.random() * 40;
      const blockY = H - blockHeight - Math.random() * 20;
      obstacles.push({ x: W, y: blockY, w: 30, h: blockHeight });
      // gap is empty space for player to pass; handled by not spawning there
    }
    // move obstacles
    obstacles.forEach(o => o.x -= 3);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // spawn particles (score items) randomly
    if (Math.random() < 0.02) {
      particles.push({ x: W, y: Math.random() * (H - 20) + 10, r: 4, vy: 0 });
    }
    particles.forEach(p => {
      p.x -= 3;
      p.vy += 0.2;
      p.y += p.vy;
    });
    while (particles.length && particles[0].x < -10) particles.shift();

    // collision detection
    for (const o of obstacles) {
      if (rectCircleCollide(o.x, o.y, o.w, o.h, player.x, player.y, player.r)) {
        gameOver = true;
        break;
      }
    }
    // collect particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const dx = p.x - player.x,
        dy = p.y - player.y;
      if (dx * dx + dy * dy < (p.r + player.r) ** 2) {
        score++;
        particles.splice(i, 1);
      }
    }

    // --- Render ---
    // background gradient (dark to deep blue)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#00102a');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // neon grid (moving vertical lines) with glow
    ctx.save();
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    const gridSpacing = 30;
    gridOffset = (gridOffset + 2) % gridSpacing;
    for (let x = -gridOffset; x < W; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.restore();

    // obstacles with neon glow
    ctx.save();
    ctx.fillStyle = '#ff00ff'; // bright magenta
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 6;
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });
    ctx.restore();

    // particles (score items)
    ctx.fillStyle = '#ff0';
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // player with neon glow
    ctx.save();
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.r*0.2, player.x, player.y, player.r);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#003');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // score display
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 8, 20);

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
