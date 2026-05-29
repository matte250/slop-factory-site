// Canvas Storm – simple arcade dodge game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  canvas.width = (canvas.clientWidth || 400) * dpr;
  canvas.height = (canvas.clientHeight || 600) * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // logical (CSS) dimensions for drawing calculations
  let logicalWidth = canvas.clientWidth || 400;
  let logicalHeight = canvas.clientHeight || 600;
  // audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  };
  // ensure audio context resumes on user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);
  // handle window resize
  const resize = () => {
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 600;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    logicalWidth = w;
    logicalHeight = h;
    // recreate starfield for new size
    initStars();
  };
  window.addEventListener('resize', resize);

  const player = { x: canvas.width / 2, y: canvas.height - 30, r: 15, speed: 4, dashSpeed: 12, dashCooldown: 0 };
  const particles = []; // dash sparkle particles
  const stars = []; // background starfield
  let obstacles = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let score = 0;
  const startTime = Date.now();
  let gameOver = false;
  const keys = {};

  // Initialize starfield
  const initStars = () => {
    stars.length = 0;
    const count = Math.min(200, Math.floor((canvas.width * canvas.height) / 8000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: 0.2 + Math.random() * 0.4,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  };
  initStars();
  const spawn = () => {
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (canvas.width - size);
    const shape = Math.random() < 0.5 ? 'circle' : 'rect';
    const v = 2 + 0.001 * (score / 1000); // speed rises with score
    const color = `hsl(${Math.random() * 360},80%,60%)`;
    const angle = shape === 'rect' ? Math.random() * Math.PI * 2 : 0;
    obstacles.push({ x, y: -size, size, shape, v, color, angle });
  };

  const update = (dt) => {
    if (gameOver) return;
    // movement
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    if (keys['Space'] && player.dashCooldown <= 0) {
      player.y -= player.dashSpeed;
      player.dashCooldown = 500; // ms
      // dash sound
      playTone(600, 120);
      // create dash particles
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: player.x,
          y: player.y,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 2,
          life: 300,
          maxLife: 300,
          size: 4 + Math.random() * 2,
          hue: Math.random() * 360,
        });
      }
    }
    player.dashCooldown -= dt;
    // keep inside canvas
    player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
    // spawn obstacles
    if (Date.now() - lastSpawn > spawnInterval) {
      spawn();
      lastSpawn = Date.now();
      spawnInterval = Math.max(400, spawnInterval * 0.98); // accelerate spawns
    }
    // update obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.v;
      // simple circle‑vs‑circle collision (treat rect as its bounding circle)
      const dx = (o.x + o.size / 2) - player.x;
      const dy = (o.y + o.size / 2) - player.y;
      const dist = Math.hypot(dx, dy);
      const rad = player.r + o.size / 2;
      if (dist < rad) { gameOver = true; playTone(200, 200); }
      // remove off‑screen
      if (o.y - o.size > canvas.height) obstacles.splice(i, 1);
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // update starfield
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed * dt * 0.05; // slower movement
      if (s.y > canvas.height) {
        s.y = -s.size;
        s.x = Math.random() * canvas.width;
      }
    }
    // score based on survival time
    score = Date.now() - startTime;
  };

  const draw = () => {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#003566');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // starfield
    ctx.fillStyle = 'white';
    stars.forEach((s) => {
      ctx.globalAlpha = s.alpha;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.globalAlpha = 1;

    // player with radial gradient and glow
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    pGrad.addColorStop(0, '#00ffff');
    pGrad.addColorStop(1, '#0044ff');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,255,255,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    // reset shadow for subsequent drawings
    ctx.shadowColor = 'transparent';

    // obstacles with individual colors and optional rotation for rectangles
    obstacles.forEach((o) => {
      ctx.fillStyle = o.color || 'red';
      if (o.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // draw rotated rectangle
        ctx.save();
        ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
        ctx.rotate(o.angle);
        ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
        ctx.restore();
      }
    });

    // particles (dash sparkles)
    particles.forEach((p) => {
      const a = p.life / p.maxLife;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, `hsla(${p.hue},80%,60%,${a})`);
      grad.addColorStop(1, `hsla(${p.hue},80%,30%,0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = (now) => {
    const dt = now - (window._last || now);
    window._last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };

  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));
  requestAnimationFrame(loop);
})();
