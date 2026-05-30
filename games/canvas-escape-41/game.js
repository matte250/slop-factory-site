// Simple infinite runner based on IDEA.md
// Canvas id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');

  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  // background hum (optional)
  setInterval(() => playTone(80, 0.3), 4000);

  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Player (glowing sphere) with neon glow
  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 15,
    vx: 0,
    vy: 0,
    speed: 0.4,
    friction: 0.95,
    boost: -6,
  };

  const keys = { left: false, right: false, boost: false };
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
    else if (e.key === ' ' || e.key === 'ArrowUp') {
      keys.boost = true;
      // Play boost sound
      playTone(800, 0.08);
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    else if (e.key === 'ArrowRight') keys.right = false;
    else if (e.key === ' ' || e.key === 'ArrowUp') keys.boost = false;
  });

  // Obstacles: simple rectangles
  const obstacles = [];
  const obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;

  // Starfield for background
  const stars = [];
  const starCount = 80;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 0.5,
      size: Math.random() * 2 + 0.5,
    });
  }

  // Trail for player glow
  const trail = [];
  const trailMax = 15;
  function spawnObstacle() {
    const width = 40 + Math.random() * 80;
    const x = Math.random() * (canvas.width - width);
    const speed = 2 + Math.random() * 2;
    obstacles.push({ x, y: -30, width, height: 30, speed });
  }

  function update(dt) {
    if (gameOver) return;
    // Player control
    if (keys.left) player.vx -= player.speed;
    if (keys.right) player.vx += player.speed;
    if (keys.boost) player.vy = player.boost;
    // Apply friction & gravity
    player.vx *= player.friction;
    player.vy += 0.2; // gravity
    // Update position
    player.x += player.vx;
    player.y += player.vy;
    // Keep within canvas horizontally
    if (player.x < player.radius) player.x = player.radius;
    if (player.x > canvas.width - player.radius) player.x = canvas.width - player.radius;
    // Trail handling (glowing afterimage)
    trail.push({x: player.x, y: player.y, life: trailMax});
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].life--;
      if (trail[i].life <= 0) trail.splice(i, 1);
    }
    // Move starfield for depth effect
    for (let s of stars) {
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }
    // Spawn obstacles
    if (Date.now() - lastSpawn > obstacleSpawnInterval) {
      spawnObstacle();
      lastSpawn = Date.now();
    }
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove if off screen
      if (o.y > canvas.height) { obstacles.splice(i, 1); score++; }
      // Collision detection (circle-rect)
      const cx = player.x, cy = player.y, r = player.radius;
      const nearestX = Math.max(o.x, Math.min(cx, o.x + o.width));
      const nearestY = Math.max(o.y, Math.min(cy, o.y + o.height));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < r * r) {
        gameOver = true;
        // Play collision sound
        playTone(200, 0.3);
      }
    }
    // Lose if falls off bottom
    if (player.y - player.radius > canvas.height) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Neon style background with subtle gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0a0a1a');
    bgGrad.addColorStop(1, '#03030f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw moving starfield
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let s of stars) {
      const size = s.size;
      ctx.fillRect(s.x, s.y, size, size);
    }
    // Draw player trail (glow afterimage)
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const alpha = (t.life / trailMax) * 0.4;
      const trailGrad = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, player.radius);
      trailGrad.addColorStop(0, `rgba(0,255,255,${alpha})`);
      trailGrad.addColorStop(1, 'rgba(0,255,255,0)');
      ctx.fillStyle = trailGrad;
      ctx.beginPath();
      ctx.arc(t.x, t.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw player
    const grad = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.radius);
    grad.addColorStop(0, 'rgba(0,255,255,0.9)');
    grad.addColorStop(1, 'rgba(0,255,255,0.1)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Draw obstacles
    ctx.fillStyle = '#ff00ff';
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.width, o.height);
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(255,0,0,0.7)';
      ctx.font = '48px monospace';
      ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
