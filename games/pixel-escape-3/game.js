// Pixel Escape – minimal endless‑runner on <canvas id="game">
// Core: auto‑scroll, jump on click/tap, simple obstacles, optional shield power‑up.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 100) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration / 1000);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
  }
  function playJump() { playTone(300, 80); }
  function playPower() { playTone(600, 150); }
  function playCollision() { playTone(100, 200); }

  const WIDTH = canvas.width = 800;
  const HEIGHT = canvas.height = 200;

  // Player definition
  const player = {
    x: 50,
    size: 20,
    y: HEIGHT - 20,
    vy: 0,
    jumpStrength: -8,
    baseColor: '#4CAF50',
    color: '#4CAF50',
    jumpTimer: 0,
    onGround() { return this.y >= HEIGHT - this.size; },
  };

  const GRAVITY = 0.4;
  const SCROLL_SPEED = 3;

  let obstacles = [];
  let powerUps = [];
  let particles = [];
  let lastObstacle = 0;
  let lastPower = 0;
  let shield = { active: false, timer: 0 };
  let startTime = Date.now();
  let score = 0;
  let gameOver = false;

  // Input – click or tap to jump (with particle burst)
  canvas.addEventListener('pointerdown', () => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (player.onGround()) {
      player.vy = player.jumpStrength;
      playJump();
      // create a few jump particles
      for (let i = 0; i < 8; i++) {
        particles.push({
          x: player.x + player.size / 2,
          y: player.y + player.size,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2 - 1,
          alpha: 1,
        });
      }
    }
  });

  function spawnObstacle() {
    const h = 30 + Math.random() * 30; // random height
    obstacles.push({ x: WIDTH, y: HEIGHT - h, w: 20, h, color: '#E91E63' });
  }

  function spawnPower() {
    const size = 12;
    powerUps.push({ x: WIDTH, y: HEIGHT - player.size - 60, r: size, color: '#FFEB3B' });
  }

  // Helper to draw rounded rectangles
  function drawRoundedRect(x, y, w, h, r, fillStyle) {
    ctx.fillStyle = fillStyle;
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
    ctx.fill();
  }

  function update(delta) {
    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y > HEIGHT - player.size) { player.y = HEIGHT - player.size; player.vy = 0; }

    // Move obstacles
    obstacles.forEach(o => o.x -= SCROLL_SPEED);
    obstacles = obstacles.filter(o => o.x + o.w > 0);

    // Move power‑ups
    powerUps.forEach(p => p.x -= SCROLL_SPEED);
    powerUps = powerUps.filter(p => p.x + p.r > 0);

    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity effect
      p.alpha -= 0.02;
    });
    particles = particles.filter(p => p.alpha > 0);

    // Spawn timing
    const now = Date.now();
    if (now - lastObstacle > 1200) { spawnObstacle(); lastObstacle = now; }
    if (now - lastPower > 8000) { spawnPower(); lastPower = now; }

    // Collision detection (AABB for obstacles, circle for power‑up)
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w && player.x + player.size > o.x &&
        player.y < o.y + o.h && player.y + player.size > o.y
      ) {
        if (!shield.active) { playCollision(); gameOver = true; }
        // if shielded, just ignore obstacle
      }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      const dx = (player.x + player.size / 2) - (p.x + p.r);
      const dy = (player.y + player.size / 2) - (p.y + p.r);
      if (Math.hypot(dx, dy) < player.size / 2 + p.r) {
        shield.active = true;
        shield.timer = now + 5000; // 5 s shield
        playPower();
        powerUps.splice(i, 1);
      }
    }
    if (shield.active && now > shield.timer) shield.active = false;

    // Score – based on time survived
    score = Math.floor((now - startTime) / 100);

    // Lose condition: time limit 60 s without shield
    if (now - startTime > 60000 && !shield.active) gameOver = true;
  }

  function draw() {
    // Clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
// Background – dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#303030');
    bgGrad.addColorStop(1, '#111111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Particles – fading circles
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player – rounded rect with base color
    drawRoundedRect(player.x, player.y, player.size, player.size, 4, player.baseColor);

    // Obstacles – rounded rects
    obstacles.forEach(o => {
      drawRoundedRect(o.x, o.y, o.w, o.h, 3, o.color);
    });

    // Power‑ups – glowing circles
    powerUps.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Shield overlay
    if (shield.active) {
      ctx.strokeStyle = '#03A9F4';
      ctx.lineWidth = 4;
      ctx.strokeRect(player.x - 2, player.y - 2, player.size + 4, player.size + 4);
    }

    // UI – score & timer
    ctx.fillStyle = '#FFF';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    const timeLeft = Math.max(0, Math.floor((60000 - (Date.now() - startTime)) / 1000));
    ctx.fillText(`Time: ${timeLeft}s`, 10, 40);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 10);
      ctx.font = '20px sans-serif';
      ctx.fillText(`Final Score: ${score}` , WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});
