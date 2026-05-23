// Canvas Escape: Falling Blocks game with richer graphics and sound
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Simple beep helper using oscillator
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      osc.stop(audioCtx.currentTime + 0.1);
    }, duration);
  }

  // Play a short explosion burst
  function playExplosionSound() {
    for (let i = 0; i < 5; i++) {
      playTone(200 + Math.random() * 300, 100);
    }
  }

  // --- Player definition ---
  const player = {
    w: 20,
    h: 20,
    x: width / 2 - 10,
    y: height - 30,
    speed: 5,
    dx: 0,
  };

  // --- Falling blocks ---
  const blocks = [];
  let lastSpawn = 0;
  const spawnInterval = 1000; // ms

  // --- Particles for explosion effect ---
  const particles = [];

  let lastTime = 0;
  let startTime = null;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Player movement (left/right arrows)
    player.dx = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    player.x += player.dx;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Spawn new blocks
    if (Date.now() - lastSpawn > spawnInterval) {
      const size = 10 + Math.random() * 20; // 10-30
      const block = {
        w: size,
        h: size,
        x: Math.random() * (width - size),
        y: -size,
        speed: 1 + Math.random() * 2, // 1-3
        // give each block a random pastel color
        color: `hsl(${Math.random() * 360}, 70%, 70%)`,
      };
      blocks.push(block);
      lastSpawn = Date.now();
    }

    // Update blocks position and cull off‑screen
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      if (b.y > height) blocks.splice(i, 1);
    }

    // Collision detection – on hit spawn particles and sound
    for (const b of blocks) {
      if (rectIntersect(player, b)) {
        gameOver = true;
        spawnExplosion(b.x + b.w / 2, b.y + b.h / 2);
        playExplosionSound();
        break;
      }
    }

    // Update particles (fade out)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Update score
    if (!gameOver && startTime !== null) {
      score = ((Date.now() - startTime) / 1000).toFixed(2);
    }
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  // Helper: draw a rounded rectangle
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function spawnExplosion(cx, cy) {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 800 + Math.random() * 400,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
      });
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#b3e5fc');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player with subtle gradient and rounded corners
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    playerGrad.addColorStop(0, '#4285f4');
    playerGrad.addColorStop(1, '#1a73e8');
    drawRoundedRect(player.x, player.y, player.w, player.h, 4, playerGrad);

    // Draw blocks with their own colors and rounded edges
    for (const b of blocks) {
      drawRoundedRect(b.x, b.y, b.w, b.h, 3, b.color);
    }

    // Draw particles (simple circles fading via globalAlpha)
    particles.forEach(p => {
      ctx.globalAlpha = Math.max(p.life / 1200, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Score text with shadow
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`Score: ${score}s`, 10, 20);
    ctx.shadowColor = 'transparent';

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '28px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Kick‑off the animation loop
  requestAnimationFrame(loop);
})();
