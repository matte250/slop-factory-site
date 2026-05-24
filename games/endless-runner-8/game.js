// Minimal endless runner targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playJumpSound() { playTone(440, 100); }
  function playGameOverSound() { playTone(150, 500); }

  // Game state
  const player = { x: 50, y: height - 30, w: 20, h: 30, vy: 0, jumpStrength: -12, onGround: true };
  const gravity = 0.6;
  const speed = 4; // forward scroll speed
  const platforms = [{ x: 0, y: height - 10, w: width * 2, h: 10 }]; // initial ground
  let gameOver = false;
  let lastTime = 0;

  // Input
  const onJump = () => {
    if (player.onGround) {
      player.vy = player.jumpStrength;
      player.onGround = false;
      playJumpSound();
    }
  };
  window.addEventListener('keydown', e => { if (e.code === 'Space') onJump(); });
  window.addEventListener('pointerdown', onJump);

  function addPlatform() {
    const last = platforms[platforms.length - 1];
    const gap = 50 + Math.random() * 100; // distance before next platform
    const platWidth = 80 + Math.random() * 120;
    const platHeight = 10;
    const platX = last.x + last.w + gap;
    const platY = height - 10 - Math.random() * 80; // vary height a bit
    platforms.push({ x: platX, y: platY, w: platWidth, h: platHeight });
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

  function update(dt) {
    if (gameOver) return;

    // Move player forward
    player.x += speed;

    // Apply gravity
    player.vy += gravity;
    player.y += player.vy;

    // Platform collision detection (simple AABB)
    player.onGround = false;
    for (const p of platforms) {
      // Check if player is landing on top of platform
      if (
        player.vy >= 0 &&
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        player.y + player.h >= p.y &&
        player.y + player.h <= p.y + p.h
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        break;
      }
    }

    // Remove off‑screen platforms
    while (platforms.length && platforms[0].x + platforms[0].w < player.x - 200) {
      platforms.shift();
    }

    // Generate new platforms ahead of player
    const furthest = platforms[platforms.length - 1];
    if (furthest.x + furthest.w < player.x + width * 2) {
      addPlatform();
    }

    // Lose condition: fall below canvas or off the bottom
    if (player.y > height) {
      gameOver = true;
      playGameOverSound();
    }
  }

  function draw() {
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEFA'); // light sky blue
    skyGrad.addColorStop(1, '#4682B4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw platforms with rounded edges
    const platColor = '#555';
    for (const p of platforms) {
      drawRoundedRect(p.x - player.x + 50, p.y, p.w, p.h, 3, platColor);
    }

    // Draw player as gradient circle
    const playerGrad = ctx.createRadialGradient(60, player.y + player.h / 2, 5, 60, player.y + player.h / 2, 15);
    playerGrad.addColorStop(0, '#FFD700'); // gold center
    playerGrad.addColorStop(1, '#FF8C00'); // orange edge
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(60, player.y + player.h / 2, Math.max(player.w, player.h) / 2, 0, Math.PI * 2);
    ctx.fill();

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
