// Simple Star Catcher game targeting canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size to match its displayed size
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction (required by many browsers)
  document.body.addEventListener('click', () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
  }, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playSound(type) {
    switch (type) {
      case 'catch':
        playTone(800, 100);
        break;
      case 'miss':
        playTone(200, 200);
        break;
      case 'gameover':
        // three low tones
        playTone(150, 150);
        setTimeout(() => playTone(150, 150), 200);
        setTimeout(() => playTone(150, 150), 400);
        break;
    }
  }
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Game state
  const state = {
    score: 0,
    lives: 3,
    bucket: { x: canvas.width / 2, y: canvas.height - 30, w: 80, h: 20, dx: 0 },
    stars: [],
    lastSpawn: 0,
    spawnInterval: 1000, // ms
    starSpeed: 2,
    running: true,
  };

  // Input handlers
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function update(dt) {
    // Move bucket
    if (keys['ArrowLeft'] || keys['a']) state.bucket.dx = -5;
    else if (keys['ArrowRight'] || keys['d']) state.bucket.dx = 5;
    else state.bucket.dx = 0;
    state.bucket.x += state.bucket.dx;
    // Keep within bounds
    if (state.bucket.x < 0) state.bucket.x = 0;
    if (state.bucket.x + state.bucket.w > canvas.width) state.bucket.x = canvas.width - state.bucket.w;

    // Spawn stars
    state.lastSpawn += dt;
    if (state.lastSpawn > state.spawnInterval) {
      state.lastSpawn = 0;
      const radius = 10;
      const x = Math.random() * (canvas.width - radius * 2) + radius;
      state.stars.push({ x, y: -radius, r: radius });
    }

    // Update stars
    for (let i = state.stars.length - 1; i >= 0; i--) {
      const star = state.stars[i];
      star.y += state.starSpeed;
      // Check catch
      if (
        star.y + star.r >= state.bucket.y &&
        star.x > state.bucket.x &&
        star.x < state.bucket.x + state.bucket.w
      ) {
        state.score++;
        state.stars.splice(i, 1);
        playSound('catch');
        continue;
      }
      // Missed
      if (star.y - star.r > canvas.height) {
        state.lives--;
        state.stars.splice(i, 1);
        playSound('miss');
        if (state.lives <= 0) {
          state.running = false;
          playSound('gameover');
        }
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bucket with rounded corners and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#444';
    const r = 6; // corner radius
    const b = state.bucket;
    ctx.beginPath();
    ctx.moveTo(b.x + r, b.y);
    ctx.lineTo(b.x + b.w - r, b.y);
    ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + r);
    ctx.lineTo(b.x + b.w, b.y + b.h - r);
    ctx.quadraticCurveTo(b.x + b.w, b.y + b.h, b.x + b.w - r, b.y + b.h);
    ctx.lineTo(b.x + r, b.y + b.h);
    ctx.quadraticCurveTo(b.x, b.y + b.h, b.x, b.y + b.h - r);
    ctx.lineTo(b.x, b.y + r);
    ctx.quadraticCurveTo(b.x, b.y, b.x + r, b.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw stars with glow effect
    for (const s of state.stars) {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#ff0');
      grad.addColorStop(1, '#ff0');
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(255,255,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${state.score}`, 10, 20);
    ctx.fillText(`Lives: ${state.lives}`, 10, 40);
    if (!state.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (state.running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
