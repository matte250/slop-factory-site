// Simple Pixel Dodger game (canvas id="game")
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first interaction (required by some browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once: true});
  window.addEventListener('keydown', resumeAudio, {once: true});
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
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playCollisionSound() { playTone(200, 200); }
  function playSpawnSound() { playTone(400, 80); }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 300;

  // Player
  const player = { x: width / 2, y: height / 2, r: 8, speed: 2 };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Obstacles
  const obstacles = [];
  let spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let lastTime = 0;
  let speedIncrease = 0.001; // per ms

  function spawnObstacle() {
    // Add rotation state for visual effect
    const angle = Math.random() * Math.PI * 2; // initial rotation
    const angularVel = (Math.random() - 0.5) * 0.02; // rotation speed
    // Add rotation state for visual effect
    const size = 12 + Math.random() * 8;
    const x = Math.random() * (width - size);
    const y = Math.random() * (height - size);
    const vx = (Math.random() - 0.5) * 2;
    const vy = (Math.random() - 0.5) * 2;
    obstacles.push({ x, y, size, vx, vy, angle, angularVel });
    // sound effect for new obstacle
    playSpawnSound();
  }

  function update(dt) {
    // Move player
    if (keys['ArrowUp'] || keys['w']) player.y -= player.speed;
    if (keys['ArrowDown'] || keys['s']) player.y += player.speed;
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Clamp to canvas
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));

    // Obstacles move
    for (const o of obstacles) {
      // move
      o.x += o.vx * (1 + speedIncrease * dt);
      o.y += o.vy * (1 + speedIncrease * dt);
      // bounce off walls
      if (o.x <= 0 || o.x + o.size >= width) o.vx *= -1;
      if (o.y <= 0 || o.y + o.size >= height) o.vy *= -1;
      // rotate each frame
      o.angle += o.angularVel;
    }

    // Collision detection
    for (const o of obstacles) {
      const dx = Math.abs(player.x - (o.x + o.size / 2));
      const dy = Math.abs(player.y - (o.y + o.size / 2));
      if (dx < player.r + o.size / 2 && dy < player.r + o.size / 2) {
        // Simple AABB-circle collision
        endGame();
        return;
      }
    }

    // Spawn new obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
      // gradually make it harder
      spawnInterval = Math.max(300, spawnInterval * 0.98);
    }
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // ctx.clearRect removed; background gradient already fills canvas
    // Player
    // Player with radial gradient
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    pGrad.addColorStop(0, '#0ff');
    pGrad.addColorStop(1, '#006');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // Obstacles
    ctx.fillStyle = '#f44';
    for (const o of obstacles) {
      // draw rotated square with subtle shadow
      ctx.save();
      ctx.translate(o.x + o.size / 2, o.y + o.size / 2);
      ctx.rotate(o.angle);
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      ctx.fillRect(-o.size / 2, -o.size / 2, o.size, o.size);
      ctx.restore();
    }
  }

  let running = true;
  function endGame() {
    running = false;
    // play collision sound
    playCollisionSound();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '20px sans-serif';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
