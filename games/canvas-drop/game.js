// Simple canvas game: paddle catches falling gems
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.width || 400;
  const height = canvas.height = canvas.height || 600;

  // Audio context and simple tone function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // Game config
  const paddle = { w: 80, h: 10, x: width / 2 - 40, y: height - 20, speed: 6 };
  const gemRadius = 8;
  let gems = [];
  let spawnTimer = 0;
  let spawnInterval = 1500; // ms
  let lastTime = 0;
  let missed = 0;
  let gameOver = false;

  // Input handling (mouse move)
  canvas.addEventListener('mousemove', e => {
    // Resume audio on first interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    paddle.x = Math.max(0, Math.min(mx - paddle.w / 2, width - paddle.w));
  });

  function spawnGem() {
    const x = Math.random() * (width - gemRadius * 2) + gemRadius;
    const speed = 1 + gems.length * 0.05; // gradually faster
    gems.push({ x, y: -gemRadius, vy: speed });
  }

  function update(dt) {
    if (gameOver) return;
    spawnTimer += dt;
    if (spawnTimer > spawnInterval) {
      spawnGem();
      spawnTimer = 0;
      // increase difficulty
      if (spawnInterval > 400) spawnInterval -= 20;
    }
    // move gems
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      g.y += g.vy * dt * 0.06; // scale speed
      // check catch
      if (
        g.y + gemRadius >= paddle.y &&
        g.x > paddle.x &&
        g.x < paddle.x + paddle.w
      ) {
        // Play catch sound
        playTone(800, 0.08);
        gems.splice(i, 1); // caught
        continue;
      }
      // miss
      if (g.y - gemRadius > height) {
        // Play miss sound
        playTone(300, 0.15);
        gems.splice(i, 1);
        missed++;
        if (missed >= 3) gameOver = true;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#00112e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Helper for rounded rectangles
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
      if (fill) ctx.fill(); else ctx.stroke();
    };

    // Paddle with rounded edges and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#777';
    drawRoundedRect(paddle.x, paddle.y, paddle.w, paddle.h, 4, true);
    ctx.restore();

    // Gems with glowing effect
    gems.forEach(g => {
      ctx.save();
      const grad = ctx.createRadialGradient(g.x, g.y, gemRadius * 0.3, g.x, g.y, gemRadius);
      grad.addColorStop(0, '#fffd91');
      grad.addColorStop(1, '#ff6a00');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff6a00';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(g.x, g.y, gemRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Status text
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Missed: ${missed}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fffa';
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
