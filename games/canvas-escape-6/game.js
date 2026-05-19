// Game: Canvas Escape
// Assumes a <canvas id="game"></canvas> exists in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Player state
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: 0, // radians
    vx: 0,
    vy: 0,
    size: 15,
  };

  // Obstacles array
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    }
  }
  initStars();
  const obstacles = [];
  const obstacleSize = 20; // radius approximation
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Timing / scoring
  const startTime = performance.now();
  const maxTime = 60_000; // 60 seconds
  let distance = 0;

  // Input handling
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function update(dt) {
    // Player rotation
    if (keys.ArrowLeft) player.angle -= 3 * dt; // 3 rad/s left
    if (keys.ArrowRight) player.angle += 3 * dt; // right
    // Thrust
    if (keys.ArrowUp) {
      const thrust = 200; // pixels per second²
      player.vx += Math.cos(player.angle) * thrust * dt;
      player.vy += Math.sin(player.angle) * thrust * dt;
      // Play thrust sound
      playTone(660, 0.05);
    }
    // Apply velocity (drift) and simple damping
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.vx *= 0.99;
    player.vy *= 0.99;
    // Wrap around edges
    if (player.x < 0) player.x += canvas.width;
    if (player.x > canvas.width) player.x -= canvas.width;
    if (player.y < 0) player.y += canvas.height;
    if (player.y > canvas.height) player.y -= canvas.height;

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      lastSpawn = performance.now();
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(canvas.width, canvas.height) / 2 + obstacleSize;
      obstacles.push({
        x: canvas.width / 2 + Math.cos(angle) * radius,
        y: canvas.height / 2 + Math.sin(angle) * radius,
        vx: -Math.cos(angle) * 80, // move toward center
        vy: -Math.sin(angle) * 80,
        angle: Math.random() * Math.PI * 2,
      });
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      // remove if passed center
      const dx = o.x - canvas.width / 2;
      const dy = o.y - canvas.height / 2;
      if (dx * dx + dy * dy < obstacleSize * obstacleSize) obstacles.splice(i, 1);
    }

    // Collision detection (approximate player as circle)
    const playerRadius = player.size / Math.SQRT2;
    for (const o of obstacles) {
      const dx = o.x - player.x;
      const dy = o.y - player.y;
      const distSq = dx * dx + dy * dy;
if (distSq < (playerRadius + obstacleSize) ** 2) {
          // Collision sound
          playTone(220, 0.3);
          endGame();
          return;
        }
    }

    // Update score (distance travelled)
    distance += Math.hypot(player.vx, player.vy) * dt;
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (tiny white dots)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Obstacles (triangles) with subtle shadow
    ctx.fillStyle = '#f55';
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 8;
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      ctx.beginPath();
      ctx.moveTo(0, -obstacleSize);
      ctx.lineTo(obstacleSize * Math.cos(Math.PI / 6), obstacleSize * Math.sin(Math.PI / 6));
      ctx.lineTo(-obstacleSize * Math.cos(Math.PI / 6), obstacleSize * Math.sin(Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.shadowBlur = 0; // reset shadow

    // Player (square) with glow
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = '#0af';
    ctx.shadowColor = 'rgba(0,170,255,0.7)';
    ctx.shadowBlur = 12;
    ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
    ctx.restore();
    ctx.shadowBlur = 0; // reset

    // UI: timer & score overlay
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, (maxTime - elapsed) / 1000).toFixed(1);
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Time: ${remaining}s`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 40);
  }

  let lastTime = performance.now();
  let running = true;
  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;
    update(dt);
    draw();
    if (now - startTime >= maxTime) endGame();
    else requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Score: ${Math.floor(distance)}` , canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(loop);
})();
