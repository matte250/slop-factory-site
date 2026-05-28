// Game: Avoid the Expanding Orbs
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player
  const player = { x: width / 2, y: height / 2, r: 8, speed: 2, dx: 0, dy: 0 };
  const keys = {};
  document.addEventListener('keydown', e => { keys[e.key] = true; });
  document.addEventListener('keyup', e => { keys[e.key] = false; });

  // Expanding circles
  const circles = [];
  const circleSpawnInterval = 2000; // ms
  const circleGrowth = 0.3; // radius per frame

  // Stars (shrink power‑up)
  const stars = [];
  const starSpawnInterval = 8000;
  const shrinkDuration = 4000; // ms
  let shrinkActive = false;
  let shrinkTimer = 0;

  // Scoring and audio
  let startTime = performance.now();
  let starsCollected = 0;
  let gameOver = false;
  // Audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction (required by browsers)
  const resumeAudio = () => { audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, { once: true });
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let gameOverSoundPlayed = false;

  function spawnCircle() {
    // Choose a random edge
    const edges = ['top', 'bottom', 'left', 'right'];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const radius = 5;
    let x, y, vx, vy;
    const speed = 0.5 + Math.random() * 0.5; // slow drift outward
    switch (edge) {
      case 'top':
        x = Math.random() * width; y = -radius; vx = 0; vy = speed; break;
      case 'bottom':
        x = Math.random() * width; y = height + radius; vx = 0; vy = -speed; break;
      case 'left':
        x = -radius; y = Math.random() * height; vx = speed; vy = 0; break;
      case 'right':
        x = width + radius; y = Math.random() * height; vx = -speed; vy = 0; break;
    }
    circles.push({ x, y, r: radius, vx, vy });
  }

  function spawnStar() {
    const radius = 6;
    const x = radius + Math.random() * (width - 2 * radius);
    const y = radius + Math.random() * (height - 2 * radius);
    stars.push({ x, y, r: radius, collected: false });
  }

  function updatePlayer() {
    if (keys['ArrowUp'] || keys['w']) player.dy = -player.speed;
    else if (keys['ArrowDown'] || keys['s']) player.dy = player.speed;
    else player.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) player.dx = -player.speed;
    else if (keys['ArrowRight'] || keys['d']) player.dx = player.speed;
    else player.dx = 0;
    player.x = Math.max(player.r, Math.min(width - player.r, player.x + player.dx));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y + player.dy));
  }

  function updateCircles(dt) {
    for (const c of circles) {
      c.x += c.vx;
      c.y += c.vy;
      c.r += circleGrowth;
    }
    // Remove circles that are far outside canvas to keep array small
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      if (c.x < -100 || c.x > width + 100 || c.y < -100 || c.y > height + 100) {
        circles.splice(i, 1);
      }
    }
  }

  function updateStars(dt) {
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      const dist = Math.hypot(dx, dy);
      if (!s.collected && dist < player.r + s.r) {
        s.collected = true;
        starsCollected++;
        // Play star collection sound
        playBeep(800, 0.15);
        shrinkActive = true;
        shrinkTimer = shrinkDuration;
        stars.splice(i, 1);
      }
    }
  }

  function checkCollisions() {
    for (const c of circles) {
      const dx = player.x - c.x;
      const dy = player.y - c.y;
      const dist = Math.hypot(dx, dy);
      const effectiveRadius = shrinkActive ? c.r * 0.5 : c.r;
      if (dist < player.r + effectiveRadius) {
        gameOver = true;
        if (!gameOverSoundPlayed) {
          playBeep(200, 0.4);
          gameOverSoundPlayed = true;
        }
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#111');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Player with glow
    ctx.save();
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Expanding circles with radial gradient
    for (const c of circles) {
      const rad = shrinkActive ? c.r * 0.5 : c.r;
      const grad = ctx.createRadialGradient(c.x, c.y, rad * 0.3, c.x, c.y, rad);
      const base = shrinkActive ? '255,0,0' : '255,80,0';
      grad.addColorStop(0, `rgba(${base},0.6)`);
      grad.addColorStop(1, `rgba(${base},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Stars with twinkle (simple pulse)
    const starTime = performance.now() / 500;
    ctx.fillStyle = 'gold';
    for (const s of stars) {
      const pulse = 0.5 + 0.5 * Math.abs(Math.sin(starTime + s.x + s.y));
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Score text with shadow
    ctx.save();
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s Stars: ${starsCollected}`, 10, 20);
    ctx.restore();
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      return;
    }
    updatePlayer();
    updateCircles(dt);
    updateStars(dt);
    if (shrinkActive) {
      shrinkTimer -= dt;
      if (shrinkTimer <= 0) shrinkActive = false;
    }
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  // Spawn timers
  setInterval(spawnCircle, circleSpawnInterval);
  setInterval(spawnStar, starSpawnInterval);

  // Initial spawn
  spawnCircle();
  spawnStar();

  requestAnimationFrame(loop);
})();
