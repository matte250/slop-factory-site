// Minimal Cosmic Drift game – attaches to <canvas id="game"></canvas>
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playBeep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  // resume audio on first interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 600;

  // ---- State ---------------------------------------------------
  const keys = {};
  const ship = { x: W / 2, y: H - 60, r: 12, shield: 100 };
  let score = 0, lastTime = 0, orbTimer = 0, astTimer = 0;
  const stars = [], orbs = [], asteroids = [];

  // ---- Helpers -------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ---- Input ---------------------------------------------------
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // ---- Entities ------------------------------------------------
  for (let i = 0; i < 120; i++) stars.push({ x: rand(0, W), y: rand(0, H), s: rand(0.5, 1.2), a: rand(0.6, 1) });

  const spawnOrb = () => orbs.push({ x: rand(20, W - 20), y: -10, r: 6 });
  const spawnAst = () => {
    const size = rand(15, 30);
    const points = [];
    const sides = Math.floor(rand(5, 9));
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const radius = size * rand(0.7, 1);
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    asteroids.push({ x: rand(size, W - size), y: -size, r: size, vx: rand(-0.5, 0.5), vy: rand(1, 2), points });
  };

  // ---- Game Loop ------------------------------------------------
  function update(dt) {
    // move ship
    const speed = 200 * dt;
    if (keys.ArrowLeft || keys.a) ship.x -= speed;
    if (keys.ArrowRight || keys.d) ship.x += speed;
    if (keys.ArrowUp || keys.w) ship.y -= speed;
    if (keys.ArrowDown || keys.s) ship.y += speed;
    ship.x = Math.max(0, Math.min(W, ship.x));
    ship.y = Math.max(0, Math.min(H, ship.y));

    // starfield scroll and twinkle
    stars.forEach(st => {
      st.y += 30 * dt;
      if (st.y > H) { st.y = 0; st.x = rand(0, W); }
      // subtle flicker
      st.a += (Math.random() - 0.5) * 0.02;
      st.a = Math.min(1, Math.max(0.3, st.a));
    });

    // spawn orbs/asteroids
    orbTimer += dt; astTimer += dt;
    if (orbTimer > 1.5) { spawnOrb(); orbTimer = 0; }
    if (astTimer > Math.max(2, 5 - score / 1000)) { spawnAst(); astTimer = 0; }

    // update orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      o.y += 100 * dt;
      if (dist(o, ship) < o.r + ship.r) { score += 10; playBeep(600, 0.1); orbs.splice(i, 1); }
      else if (o.y > H) orbs.splice(i, 1);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx; a.y += a.vy;
      if (dist(a, ship) < a.r + ship.r) { ship.shield -= 20; playBeep(200, 0.2); asteroids.splice(i, 1); }
      else if (a.y - a.r > H) asteroids.splice(i, 1);
    }

    // game over
    if (ship.shield <= 0) {
      alert(`Game Over! Score: ${score}`);
      document.location.reload();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#000010');
    bgGrad.addColorStop(1, '#001030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(st => { ctx.globalAlpha = st.a; ctx.beginPath(); ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
    // ship (triangle pointing up)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // orbs (glowing)
    orbs.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 2);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r * 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids (polygonal)
    ctx.fillStyle = '#a52a2a';
    asteroids.forEach(a => {
      ctx.beginPath();
      a.points.forEach((p, i) => {
        const px = a.x + p.x;
        const py = a.y + p.y;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shield: ${ship.shield}%`, 10, 40);
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
