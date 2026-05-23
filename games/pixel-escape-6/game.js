// Minimalist "Pixel Escape" game
// Targets canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }

  // Player definition
  const player = { x: width / 2 - 5, y: height - 30, size: 10, speed: 4 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles and visual effects
  const obstacles = [];
  const trail = [];
  const stars = [];
  const starSpawnInterval = 100; // ms
  let lastStarSpawn = 0;
  const obstacleSpeed = 2; // pixels per frame
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Game state
  let startTime = null;
  let animationId = null;
  let gameOver = false;

  function update(dt) {
    // Spawn stars
    if (performance.now() - lastStarSpawn > starSpawnInterval) {
      const star = {
        x: Math.random() * width,
        y: -5,
        r: Math.random() * 1.5 + 0.5,
        speed: 0.5 + Math.random() * 0.5,
        alpha: Math.random() * 0.5 + 0.5
      };
      stars.push(star);
      lastStarSpawn = performance.now();
    }
    // Move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) stars.splice(i, 1);
    }

    // Move player based on arrow keys
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // Keep within bounds
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      const obsWidth = 20 + Math.random() * 60; // 20‑80
      const obsX = Math.random() * (width - obsWidth);
      obstacles.push({ x: obsX, y: -20, w: obsWidth, h: 20 });
      lastSpawn = performance.now();
    }

    // Move obstacles down (simulating forward scroll)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      // Remove off‑screen obstacles
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection (AABB)
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(150, 300);
        break;
      }
    }
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars background
    ctx.save();
    ctx.globalAlpha = 1;
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // Player trail (fade effect)
    trail.push({ x: player.x, y: player.y });
    if (trail.length > 10) trail.shift();
    trail.forEach((p, i) => {
      const alpha = (i + 1) / trail.length * 0.3;
      ctx.fillStyle = `rgba(0,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x + player.size / 2, p.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Player (glowing circle with blur)
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#0f0';
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Obstacles with dynamic colors
    for (const o of obstacles) {
      const hue = 200 + (o.w / 80) * 160; // vary hue by width
      ctx.fillStyle = `hsl(${hue}, 80%, 50%)`;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
    // Score overlay
    const score = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (animationId ?? timestamp);
    if (!gameOver) {
      update(dt);
      draw();
      animationId = requestAnimationFrame(loop);
    } else {
      // Final draw with game‑over state
      draw();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  // Start the loop
  animationId = requestAnimationFrame(loop);
})();
