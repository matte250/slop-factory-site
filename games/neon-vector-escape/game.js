// Minimal “Neon Vector Escape” – endless runner on a canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

    // Resize canvas to fill its container
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // ----- Starfield -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Player Trail -----
  const trail = [];
  const maxTrail = 12;

  // ----- Player -----
  const player = {
    radius: 12,
    x: canvas.width / 2,
    y: canvas.height - 40,
    speed: 4,
    color: '#0ff',
  };

  // ----- Obstacles -----
  const obstacles = [];
  const obstacleFreq = 90; // frames between spawns
  const obstacleSpeed = 2;
  const obstacleMinSize = 20;
  const obstacleMaxSize = 60;

  let frame = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup',   e => { if (e.key in keys) keys[e.key] = false; });

  // Simple circle‑rectangle collision (treat obstacle as rect)
  const collides = (px, py, pr, ox, oy, ow, oh) => {
    const dx = Math.max(ox - px, Math.max(px - (ox + ow), 0));
    const dy = Math.max(oy - py, Math.max(py - (oy + oh), 0));
    return dx * dx + dy * dy < pr * pr;
  };

  // Main loop
  function loop() {
    if (gameOver) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      return;
    }

    // ---- Update ----
    // Player movement
    if (keys.ArrowLeft)  player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    // Update trail
    trail.push({x: player.x, y: player.y, r: player.radius});
    if (trail.length > maxTrail) trail.shift();

    // Spawn obstacles
    if (frame % obstacleFreq === 0) {
      const w = obstacleMinSize + Math.random() * (obstacleMaxSize - obstacleMinSize);
      const h = obstacleMinSize + Math.random() * (obstacleMaxSize - obstacleMinSize);
      const x = Math.random() * (canvas.width - w);
      obstacles.push({ x, y: -h, w, h });
    }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obstacleSpeed;
      if (obs.y > canvas.height) obstacles.splice(i, 1); // off‑screen cleanup
      // Collision test
      if (collides(player.x, player.y, player.radius, obs.x, obs.y, obs.w, obs.h)) {
        gameOver = true;
      }
    }

    // ---- Draw ----
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // simple twinkle
      if (Math.random() < 0.01) s.r = Math.random() * 1.5 + 0.5;
    });

    // Neon glow helper
    const neon = (color, blur) => {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    };

    // Draw player with radial gradient glow
    neon('#0ff', 12);
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.3, player.x, player.y, player.radius);
    playerGrad.addColorStop(0, '#0ff');
    playerGrad.addColorStop(1, '#003');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Draw player trail (fading)
    ctx.globalCompositeOperation = 'lighter';
    trail.forEach((p, i) => {
      const alpha = (i + 1) / trail.length * 0.4;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(0,255,255,${alpha})`);
      grad.addColorStop(1, `rgba(0,0,51,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';

    // Draw obstacles with gradient and slight rotation
    neon('#f0f', 8);
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(Math.sin(frame * 0.05) * 0.1);
      const obsGrad = ctx.createLinearGradient(-o.w/2, -o.h/2, o.w/2, o.h/2);
      obsGrad.addColorStop(0, '#f0f');
      obsGrad.addColorStop(1, '#500');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
      ctx.restore();
    });
    ctx.shadowBlur = 0;

    frame++;
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
