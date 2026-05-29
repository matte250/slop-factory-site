// Simple Gravity Dodge game targeting <canvas id="game">. Enhanced graphics with gradients, particles, and color effects.
// Controls: ArrowUp – thrust upward; ArrowLeft/Right – horizontal thrust.
// Obstacles: rotating rectangles falling from the top.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Player state
  const player = {
    x: width / 2,
    y: height / 4,
    radius: 12,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    gravity: 0.05,
  };

  // Input handling
  const keys = { ArrowUp: false, ArrowLeft: false, ArrowRight: false };
  // Simple sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.type = 'square';
    oscillator.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(440, 100); }
  function playCollision() { playTone(150, 300); }
  window.addEventListener('keydown', e => { if (e.key in keys) { keys[e.key] = true; if (e.key === 'ArrowUp') playThrust(); } });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Obstacles
  const obstacles = [];
  const particles = []; // {x,y,vx,vy,ttl, size, color}

  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  function spawnObstacle() {
    const w = 30 + Math.random() * 40;
    const h = 10 + Math.random() * 30;
    const x = Math.random() * (width - w);
    const y = -h;
    const rotSpeed = (Math.random() - 0.5) * 0.04; // rad per frame
    obstacles.push({ x, y, w, h, angle: 0, rotSpeed, vy: 1 + Math.random() * 1.5 });
  }

  function update(dt) {
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.ttl--;
      if (p.ttl <= 0) particles.splice(i, 1);
    }
    // Spawn a trailing particle each frame
    particles.push({
      x: player.x,
      y: player.y,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      ttl: 30,
      size: Math.random() * 3 + 1,
      color: 'rgba(255,200,150,0.6)'
    });
    // Player physics
    if (keys.ArrowUp) player.vy -= player.thrust;
    if (keys.ArrowLeft) player.vx -= player.thrust;
    if (keys.ArrowRight) player.vx += player.thrust;
    player.vy += player.gravity;
    player.x += player.vx;
    player.y += player.vy;
    // simple friction
    player.vx *= 0.99;
    player.vy *= 0.99;

    // Keep inside horizontal bounds
    if (player.x - player.radius < 0) { player.x = player.radius; player.vx = 0; }
    if (player.x + player.radius > width) { player.x = width - player.radius; player.vx = 0; }

    // Spawn obstacles over time
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (const o of obstacles) {
      o.y += o.vy;
      o.angle += o.rotSpeed;
    }
    // Remove off‑screen obstacles
    while (obstacles.length && obstacles[0].y - obstacles[0].h > height) obstacles.shift();
  }

  function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1e1e2f');
  bgGrad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    // Player with radial gradient glow
    const playerGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.3, player.x, player.y, player.radius);
    playerGrad.addColorStop(0, '#ffab91');
    playerGrad.addColorStop(1, '#ff5722');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles with gradient
    const obstacleGrad = ctx.createLinearGradient(0, 0, 0, height);
    obstacleGrad.addColorStop(0, '#666');
    obstacleGrad.addColorStop(1, '#222');
    ctx.fillStyle = obstacleGrad;
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }
  }

  function circleRectCollision(cx, cy, r, rect) {
    // axis‑aligned bounding box after rotation accounted via simple approximation
    // Transform circle into rectangle's local space
    const cos = Math.cos(-rect.angle);
    const sin = Math.sin(-rect.angle);
    const dx = cx - (rect.x + rect.w / 2);
    const dy = cy - (rect.y + rect.h / 2);
    const localX = dx * cos - dy * sin + rect.w / 2;
    const localY = dx * sin + dy * cos + rect.h / 2;
    const closestX = Math.max(0, Math.min(rect.w, localX));
    const closestY = Math.max(0, Math.min(rect.h, localY));
    const distX = localX - closestX;
    const distY = localY - closestY;
    return distX * distX + distY * distY <= r * r;
  }

  function checkCollisions() {
    // Bottom of canvas => lose
    if (player.y + player.radius > height) return true;
    // Obstacles
    for (const o of obstacles) {
      if (circleRectCollision(player.x, player.y, player.radius, o)) return true;
    }
    return false;
  }

  let gameOver = false;
  function loop(timestamp) {
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      return;
    }
    update();
    draw();
    if (checkCollisions()) { playCollision(); gameOver = true; }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
