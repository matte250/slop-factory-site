// Simple Canvas Dodge game based on IDEA.md
// Assumes a <canvas id="game"></canvas> is present in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Full‑size canvas
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Helper to play a tone
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
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }

  const player = { x: canvas.width / 2, y: canvas.height - 40, w: 20, h: 30, speed: 4 };
  const keys = {};
  const obstacles = [];
  const orbs = [];
  let score = 0;
  let timeLeft = 120; // seconds
  let lastSpawn = 0;
  let lastOrb = 0;
  let lastTimeUpdate = performance.now();
  let gameOver = false;
  // starfield background
  const stars = [];
  const STAR_COUNT = 120;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      brightness: Math.random() * 0.5 + 0.5,
    });
  }

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    const angle = Math.random() * Math.PI * 2;
    const av = (Math.random() - 0.5) * 0.04; // angular velocity
    obstacles.push({ x, y: -size, w: size, h: size, v: Math.random() * 2 + 1, angle, av });
  }
  function spawnOrb() {
    const r = 8;
    const x = Math.random() * (canvas.width - r * 2) + r;
    orbs.push({ x, y: -r, r, v: 2 });
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function circleRectIntersect(c, r) {
    const distX = Math.abs(c.x - r.x - r.w / 2);
    const distY = Math.abs(c.y - r.y - r.h / 2);
    if (distX > (r.w / 2 + c.r)) return false;
    if (distY > (r.h / 2 + c.r)) return false;
    if (distX <= (r.w / 2)) return true;
    if (distY <= (r.h / 2)) return true;
    const dx = distX - r.w / 2;
    const dy = distY - r.h / 2;
    return dx * dx + dy * dy <= (c.r * c.r);
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // Spawn obstacles/orbs
    if (performance.now() - lastSpawn > 1000) { spawnObstacle(); lastSpawn = performance.now(); }
    if (performance.now() - lastOrb > 1500) { spawnOrb(); lastOrb = performance.now(); }

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.v;
      // rotate obstacle
      if (o.angle !== undefined) {
        o.angle += o.av;
      }
      if (o.y > canvas.height) obstacles.splice(i, 1);
      else if (rectIntersect(player, o)) { playTone(220, 0.3); gameOver = true; }
    }
    // Move orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const orb = orbs[i];
      orb.y += orb.v;
      if (orb.y - orb.r > canvas.height) { orbs.splice(i, 1); continue; }
      if (circleRectIntersect(orb, player)) { score += 10; orbs.splice(i, 1); playTone(440, 0.1); }
    }

    // Timer and score over time
    const now = performance.now();
    if (now - lastTimeUpdate >= 1000) {
      timeLeft--;
      score++;
      lastTimeUpdate = now;
      if (timeLeft <= 0) gameOver = true;
    }
  }

  function draw() {
    // background: dark space with twinkling stars
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars (pre‑generated small white dots)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    ctx.globalAlpha = 1;

    // Player (triangle ship) with gradient and glow
    ctx.save();
    const grad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles – rotating squares with stroke outline
    ctx.fillStyle = '#800';
    ctx.strokeStyle = '#c33';
    ctx.lineWidth = 2;
    obstacles.forEach(o => {
      ctx.save();
      const cx = o.x + o.w / 2;
      const cy = o.y + o.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate(o.angle);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.strokeRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    });

    // Orbs – glowing radial gradient
    orbs.forEach(o => {
      const gradient = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      gradient.addColorStop(0, 'rgba(255,255,0,0.9)');
      gradient.addColorStop(1, 'rgba(255,255,0,0.1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${timeLeft}s`, canvas.width - 100, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop() {
    if (!gameOver) {
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
