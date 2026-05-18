// Canvas Dodge Game
// Player (white circle) moves with arrow keys. Red squares spawn at canvas edges and move toward the player.
// Press Space to dash (become invincible) for a short duration.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Resize canvas to fill window
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Player state
  const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 15,
    speed: 4,
    color: '#fff',
    dashTime: 0,
    dashDuration: 200, // ms
    dashSpeed: 12,
    invincible: false,
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure AudioContext runs after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  const playSound = (freq, duration) => {
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
  };


  window.addEventListener('keydown', e => {
    if (e.key in keys) keys[e.key] = true;
    // Prevent scrolling with arrow keys / space
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Enemy squares
  const enemies = [];
  const enemySize = 20;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  const spawnEnemy = () => {
    // Choose random edge
    const edge = Math.floor(Math.random() * 4); // 0 top,1 right,2 bottom,3 left
    let x, y, dx, dy;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width; y = -enemySize; break;
      case 1: // right
        x = canvas.width + enemySize; y = Math.random() * canvas.height; break;
      case 2: // bottom
        x = Math.random() * canvas.width; y = canvas.height + enemySize; break;
      case 3: // left
        x = -enemySize; y = Math.random() * canvas.height; break;
    }
    // Direction toward player
    const angle = Math.atan2(player.y - y, player.x - x);
    const speed = 2;
    dx = Math.cos(angle) * speed;
    dy = Math.sin(angle) * speed;
    enemies.push({ x, y, dx, dy, size: enemySize });
  };

  const update = (delta) => {
    // Player movement
    let vx = 0, vy = 0;
    if (keys.ArrowUp) vy -= 1;
    if (keys.ArrowDown) vy += 1;
    if (keys.ArrowLeft) vx -= 1;
    if (keys.ArrowRight) vx += 1;
    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx = (vx / len) * (player.invincible ? player.dashSpeed : player.speed);
      vy = (vy / len) * (player.invincible ? player.dashSpeed : player.speed);
      player.x += vx;
      player.y += vy;
      // Clamp to canvas
      player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
      player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));
    }

    // Dash handling
    if (keys.Space && !player.invincible) {
      player.invincible = true;
      player.dashTime = performance.now();
      playSound(660, 120); // dash sound
    }
    if (player.invincible && performance.now() - player.dashTime > player.dashDuration) {
      player.invincible = false;
    }

    // Spawn enemies
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnEnemy();
      lastSpawn = performance.now();
    }

    // Update enemies
    enemies.forEach(e => {
      e.x += e.dx;
      e.y += e.dy;
    });

    // Collision detection (if not invincible)
    if (!player.invincible) {
      for (const e of enemies) {
        const closestX = Math.max(e.x, Math.min(player.x, e.x + e.size));
        const closestY = Math.max(e.y, Math.min(player.y, e.y + e.size));
        const dist = Math.hypot(player.x - closestX, player.y - closestY);
        if (dist < player.r) {
          // Game over – stop animation loop
          // Play collision sound before ending
          playSound(220, 200);
          cancelAnimationFrame(animationId);
          alert('Game Over!');
          return;
        }
      }
    }
  };

  // Helper to draw rounded rectangle
  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Player (with aura when invincible)
    if (player.invincible) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,255,0,0.6)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.r + 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0f0';
      ctx.fill();
      ctx.restore();
    }
    const playerGrad = ctx.createRadialGradient(
      player.x, player.y, player.r * 0.3,
      player.x, player.y, player.r
    );
    playerGrad.addColorStop(0, '#fff');
    playerGrad.addColorStop(1, '#888');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();

    // Enemies – rounded red squares with slight rotation effect
    ctx.fillStyle = '#f44';
    enemies.forEach(e => {
      ctx.save();
      ctx.translate(e.x + e.size / 2, e.y + e.size / 2);
      const angle = Math.atan2(e.dy, e.dx);
      ctx.rotate(angle);
      roundRect(-e.size / 2, -e.size / 2, e.size, e.size, 4);
      ctx.restore();
    });
  };

  let lastTime = performance.now();
  let animationId;
  const loop = (time) => {
    const delta = time - lastTime;
    lastTime = time;
    update(delta);
    draw();
    animationId = requestAnimationFrame(loop);
  };
  animationId = requestAnimationFrame(loop);
})();
