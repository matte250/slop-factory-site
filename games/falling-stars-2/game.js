// Simple canvas game: move a square with arrow keys
// The HTML contains a <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Set canvas size (you may adjust via CSS in HTML)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = { x: 50, y: 50, size: 40, speed: 200 }; // pixels per second
  const keys = {};

  // Simple particle system for trail effect
  const particles = [];
  const particleConfig = {
    maxLife: 0.5, // seconds
    sizeRange: [2, 4],
    speed: 30, // pixels per second
  };

  // Set up audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!keys[e.key]) {
      // Play a short tone on first press of movement keys
      if (['ArrowUp','w','ArrowDown','s','ArrowLeft','a','ArrowRight','d'].includes(e.key)) {
        // Different pitch for direction
        const freqMap = {
          'ArrowUp': 440,
          'w': 440,
          'ArrowDown': 220,
          's': 220,
          'ArrowLeft': 330,
          'a': 330,
          'ArrowRight': 550,
          'd': 550,
        };
        playTone(freqMap[e.key] || 400, 0.08);
      }
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  let lastTime = performance.now();
  function update(dt) {
    // Move player based on input
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed * dt;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed * dt;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed * dt;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed * dt;
    // Keep inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    // Emit a particle at player's center each frame
    particles.push({
      x: player.x + player.size / 2,
      y: player.y + player.size / 2,
      vx: (Math.random() - 0.5) * particleConfig.speed,
      vy: (Math.random() - 0.5) * particleConfig.speed,
      size: Math.random() * (particleConfig.sizeRange[1] - particleConfig.sizeRange[0]) + particleConfig.sizeRange[0],
      life: particleConfig.maxLife,
      alpha: 1,
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / particleConfig.maxLife);
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw particles (simple trail)
    particles.forEach((p, i) => {
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // draw player as a circle with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,120,255,0.6)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#00aaff';
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
