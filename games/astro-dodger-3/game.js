// Astro Dodger – minimal canvas game
// Assumes a <canvas id="game"></canvas> exists in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });
  window.addEventListener('click', resumeAudio, { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playExplosionSound() {
    // rapid descending tones
    for (let i = 0; i < 5; i++) {
      playTone(200 + i * 100, 80);
    }
  }
  function playScoreSound() {
    playTone(800, 100);
  }
  const width = canvas.width;
  const height = canvas.height;
  // Starfield background
  const stars = Array.from({length: 100}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.5,
  }));

  // ===== Game state =====
  const player = {
    x: width / 2,
    y: height - 40,
    size: 20,
    speed: 4,
  };
  const keys = {};
  const obstacles = [];
  const explosionParticles = [];
  let score = 0;
  let startTime = null;
  let elapsed = 0;
  const duration = 60; // seconds
  let gameOver = false;

  // ===== Input handling =====
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // ===== Helper functions =====
  function spawnObstacle() {
    const size = Math.random() * 30 + 10;
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: Math.random() * 2 + 1,
    });
  }

  function rectCircleCollision(rect, circle) {
    // Find closest point to circle within the rectangle
    const distX = Math.abs(circle.x - rect.x);
    const distY = Math.abs(circle.y - rect.y);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update(dt) {
    if (gameOver) return;
    // Move player
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // Keep within bounds
    player.x = Math.max(player.size, Math.min(width - player.size, player.x));
    player.y = Math.max(player.size, Math.min(height - player.size, player.y));

    // Update starfield (move downwards)
    stars.forEach(star => {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
    });

    // Spawn obstacles periodically
    if (Math.random() < 0.02) spawnObstacle();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.size > height) {
        obstacles.splice(i, 1);
        score += 1; // survived an obstacle
          playScoreSound();
      } else {
        // Collision detection (player as circle for simplicity)
        const playerRect = { x: player.x, y: player.y, w: player.size, h: player.size };
        const circle = { x: o.x + o.size / 2, y: o.y + o.size / 2, r: o.size / 2 };
        if (rectCircleCollision(playerRect, circle)) {
          gameOver = true;
          // Create explosion particles
          for (let p = 0; p < 30; p++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            explosionParticles.push({
              x: player.x,
              y: player.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: Math.random() * 3 + 2,
              life: Math.random() * 30 + 30,
            });
          }
        }
      }
    }

    // Update explosion particles
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
      const p = explosionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) explosionParticles.splice(i, 1);
    }

    // Timer
    elapsed = (Date.now() - startTime) / 1000;
    if (elapsed >= duration) gameOver = true;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw obstacles (red circles with slight glow)
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(
        o.x + o.size / 2,
        o.y + o.size / 2,
        o.size * 0.2,
        o.x + o.size / 2,
        o.y + o.size / 2,
        o.size / 2
      );
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#aa0000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.size / 2, o.y + o.size / 2, o.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw explosion particles
    explosionParticles.forEach(p => {
      ctx.fillStyle = `rgba(255,200,0,${p.life / 60})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player (triangle with cyan glow)
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.size);
    ctx.lineTo(player.x - player.size, player.y + player.size);
    ctx.lineTo(player.x + player.size, player.y + player.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, Math.ceil(duration - elapsed))}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const dt = timestamp - (window.lastTimestamp || timestamp);
    window.lastTimestamp = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
