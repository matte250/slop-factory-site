// Neon Grid Runner – minimal endless runner
// Canvas with id="game" must exist in the page.

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for simple sounds
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const logicalW = canvas.offsetWidth || 800;
  const logicalH = canvas.offsetHeight || 400;
  canvas.width = logicalW * dpr;
  canvas.height = logicalH * dpr;
  ctx.scale(dpr, dpr);
  const W = logicalW;
  const H = logicalH;

  // Player
  const player = {
    w: 30,
    h: 30,
    x: W / 2 - 15,
    y: H - 60,
    vy: 0,
    onGround: true,
    color: '#0ff',
  };

  // Grid lines
  const grid = { spacing: 40, offsetY: 0, speed: 2 };

  // Spikes
  const spikes = [];
  const spikeInterval = 1200; // ms
  let lastSpike = 0;

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // Resume AudioContext on first user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  function spawnSpike() {
    const size = 20;
    const x = Math.random() * (W - size);
    spikes.push({ x, y: -size, size, speed: grid.speed });
  }

  function update(dt) {
    // Player horizontal movement
    if (keys['ArrowLeft']) player.x -= 5;
    if (keys['ArrowRight']) player.x += 5;
    player.x = Math.max(0, Math.min(W - player.w, player.x));

    // Jump
    if (keys[' '] && player.onGround) {
      player.vy = -12;
      player.onGround = false;
      // play jump tone
      playSound(440, 0.1);
    }
    // Gravity
    player.vy += 0.5;
    player.y += player.vy;
    // Floor
    if (player.y + player.h >= H) {
      player.y = H - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Grid scroll
    grid.offsetY += grid.speed;
    if (grid.offsetY >= grid.spacing) grid.offsetY = 0;

    // Spikes movement & cleanup
    for (let i = spikes.length - 1; i >= 0; i--) {
      const s = spikes[i];
      s.y += s.speed;
      if (s.y > H) spikes.splice(i, 1);
    }

    // Spawn spikes
    if (performance.now() - lastSpike > spikeInterval) {
      spawnSpike();
      lastSpike = performance.now();
    }

    // Collision detection
    for (const s of spikes) {
      if (
        player.x < s.x + s.size &&
        player.x + player.w > s.x &&
        player.y < s.y + s.size &&
        player.y + player.h > s.y
      ) {
        gameOver();
        return;
      }
    }
  }

  function draw() {
    // Dark background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a0a');
    bgGrad.addColorStop(1, '#111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Neon grid with glow effect
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 8;
    for (let y = -grid.spacing + grid.offsetY; y < H; y += grid.spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset
    // Player neon square with glow
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();
    // Neon spikes with glow
    for (const s of spikes) {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff0'; // bright yellow neon
      ctx.beginPath();
      ctx.moveTo(s.x, s.y + s.size);
      ctx.lineTo(s.x + s.size / 2, s.y);
      ctx.lineTo(s.x + s.size, s.y + s.size);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  let last = performance.now();
  let running = true;
  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    // play collision / game over sound
    playSound(150, 0.4);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  // Start
  requestAnimationFrame(loop);
})();
