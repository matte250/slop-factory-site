// Simple Neon Runner game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;
  // Star field background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // Player
  const player = { x: width / 2, y: height - 30, size: 20, speed: 5 };
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Start audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    // Play movement tone
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      playTone(300, 50);
    }
  });
  document.addEventListener('keyup', e => (keys[e.code] = false));

  // Blocks
  const blocks = [];
  let blockInterval = 1500; // ms
  let lastBlock = 0;
  let speed = 2; // falling speed
  let startTime = performance.now();
  let gameOver = false;

  function spawnBlock() {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (width - size);
    blocks.push({ x, y: -size, size, speed });
  }

  // Draw rounded rectangle with neon glow
  function drawRoundedRect(x, y, w, h, radius) {
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
    ctx.fill();
  }

  function update(dt) {
    if (gameOver) return;
    // Player movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.size, player.x));

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      if (b.y > height) blocks.splice(i, 1);
      // Collision
      if (
        b.x < player.x + player.size &&
        b.x + b.size > player.x &&
        b.y < player.y + player.size &&
        b.y + b.size > player.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(100, 300);
        alert('Game Over!');
        break;
      }
    }

    // Spawn new blocks
    if (performance.now() - lastBlock > blockInterval) {
      spawnBlock();
      lastBlock = performance.now();
    }

    // Increase difficulty over time
    const elapsed = (performance.now() - startTime) / 1000;
    speed = 2 + elapsed * 0.02; // gradual speed up
    blockInterval = Math.max(300, 1500 - elapsed * 10);
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw stars (cached)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Neon glow settings
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    // Player neon shape (rounded square)
    ctx.fillStyle = '#0ff';
    drawRoundedRect(player.x, player.y, player.size, player.size, 4);

    // Blocks neon magenta with glow
    ctx.shadowColor = '#f0f';
    ctx.fillStyle = '#f0f';
    for (const b of blocks) {
      drawRoundedRect(b.x, b.y, b.size, b.size, 4);
    }
    // Reset shadow
    ctx.shadowBlur = 0;
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
