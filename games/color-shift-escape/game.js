// Game: Color Shift Escape
// Canvas with id="game" is assumed to exist.
// Player is a square that cycles through red, green, blue.
// Obstacles fall from the top; mismatched color causes loss.
// Occasional power‑ups increase score.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions to match CSS size or fallback
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;
  // Enable crisp rendering on high‑DPI displays
  const ratio = window.devicePixelRatio || 1;
  canvas.width = W * ratio;
  canvas.height = H * ratio;
  ctx.scale(ratio, ratio);

  const colors = ['red', 'green', 'blue'];
  let player = { x: W / 2 - 15, y: H - 40, size: 30, colorIdx: 0 };
  let obstacles = [];
  let powerUps = [];
  let particles = [];
  let score = 0;
  let gameOver = false;
  let spawnTimer = 0;
  let powerTimer = 0;
  // helper to draw rounded rectangles
  const drawRoundedRect = (x, y, w, h, r, fill) => {
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
    ctx.fillStyle = fill;
    ctx.fill();
  };


  const toggleColor = () => {
    player.colorIdx = (player.colorIdx + 1) % colors.length;
    // sound for color change
    playTone(300, 100);
  };
  document.addEventListener('keydown', e => {
    if (e.key === 'c' || e.key === ' ') {
      audioCtx.resume();
      toggleColor();
    }
  });

  const rectCollision = (a, b) => a.x < b.x + b.w && a.x + a.size > b.x && a.y < b.y + b.h && a.y + a.size > b.y;

  function spawnObstacle() {
    const size = 30;
    const x = Math.random() * (W - size);
    const color = colors[Math.floor(Math.random() * colors.length)];
    obstacles.push({ x, y: -size, w: size, h: size, color, speed: 2 + Math.random() * 2 });
  }
  // create particles for visual feedback
  const spawnParticle = (x, y, color) => {
    const life = 600;
    particles.push({ x, y, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2, size: 4 + Math.random() * 3, color, life });
  };

  function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (W - size);
    powerUps.push({ x, y: -size, w: size, h: size, speed: 2 });
  }

  function update(dt) {
    if (gameOver) return;
    spawnTimer += dt;
    powerTimer += dt;
    if (spawnTimer > 800) { spawnObstacle(); spawnTimer = 0; }
    if (powerTimer > 4000) { spawnPowerUp(); powerTimer = 0; }

    // move obstacles
    obstacles.forEach(o => o.y += o.speed);
    obstacles = obstacles.filter(o => o.y < H);
    // move power‑ups
    powerUps.forEach(p => p.y += p.speed);
    powerUps = powerUps.filter(p => p.y < H);

    // update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    // check collisions with obstacles
    for (const o of obstacles) {
      if (rectCollision(player, o)) {
        if (colors[player.colorIdx] !== o.color) {
          // loss sound
          playTone(100, 300);
          gameOver = true;
        } else {
          // matched color – reward
          score += 5;
          // remove obstacle
          o.y = H + 1;
          // reward sound
          playTone(600, 100);
          // spawn sparkle particles
          for (let i = 0; i < 8; i++) spawnParticle(o.x + o.w / 2, o.y + o.h / 2, o.color);
        }
      }
    }
    // power‑up collection
    for (const p of powerUps) {
      if (rectCollision(player, p)) {
        score += 10;
        p.y = H + 1;
        // power‑up sound
        playTone(800, 150);
        // spawn particles on collect
        for (let i = 0; i < 12; i++) spawnParticle(p.x + p.w / 2, p.y + p.h / 2, 'yellow');
      }
    }
    // score rises over time
    score += dt * 0.01;
  }

  function draw() {
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // particles (glow effect)
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 600, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // player (rounded)
    drawRoundedRect(player.x, player.y, player.size, player.size, 6, colors[player.colorIdx]);

    // obstacles (rounded with slight shading)
    obstacles.forEach(o => {
      drawRoundedRect(o.x, o.y, o.w, o.h, 4, o.color);
    });

    // power‑ups (yellow rounded)
    powerUps.forEach(p => {
      drawRoundedRect(p.x, p.y, p.w, p.h, 4, 'yellow');
    });

    // score text
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
      ctx.textAlign = 'start';
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
