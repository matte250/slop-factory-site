// Neon Runner – simple endless runner
/*
  Canvas with id="game" must exist in the HTML.
  Player: a glowing vertical line that can tilt left/right.
  Obstacles: neon blocks scrolling downwards.
*/

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
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
  function playCollision() { beep(150, 0.3); }
  function playScoreTick() { beep(800, 0.05); }

  // Player definition
  const player = {
    x: W / 2,
    y: H - 30,
    width: 5,
    height: 20,
    speed: 4,
    tilt: 0,
    maxTilt: 2,
  };

  // Obstacles array
  const obstacles = [];
  // Particle system for player trail
  const particles = [];
  let lastSpawn = 0;
  const spawnInterval = 1200; // ms

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { left: false, right: false };
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') keys.left = true;
    else if (e.key === 'ArrowRight') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    else if (e.key === 'ArrowRight') keys.right = false;
  });

  function update(dt) {
    if (gameOver) return;
    // Move player based on input
    if (keys.left) player.tilt = Math.max(-player.maxTilt, player.tilt - 0.1);
    else if (keys.right) player.tilt = Math.min(player.maxTilt, player.tilt + 0.1);
    else player.tilt *= 0.9; // recenter gradually
    player.x += player.tilt * player.speed;
    // constrain
    player.x = Math.max(0, Math.min(W - player.width, player.x));

    // spawn trail particles
    particles.push({
      x: player.x + player.width / 2,
      y: player.y,
      size: 2,
      life: 30,
      maxLife: 30,
    });

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life--;
      p.y -= 0.5; // rise
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      const blockW = 30 + Math.random() * 40;
      const blockX = Math.random() * (W - blockW);
      obstacles.push({ x: blockX, y: -30, w: blockW, h: 20, speed: 2 + Math.random() * 2 });
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // collision check (simple AABB)
      if (
        o.x < player.x + player.width &&
        o.x + o.w > player.x &&
        o.y < player.y + player.height &&
        o.y + o.h > player.y
      ) {
        gameOver = true;
        playCollision();
      }
      // remove off‑screen and score tick
      if (o.y > H) {
        obstacles.splice(i, 1);
        playScoreTick();
      }
    }

    score += dt * 0.01;
  }

  function draw() {
    // background - dark gradient with subtle stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // tiny stars
    for (let i = 0; i < 30; i++) {
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(sx, sy, 1, 1);
    }

    // glow settings for neon elements
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 14;

    // draw player trail particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // draw player (glowing line)
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // draw obstacles (neon blocks) with gradient
    obstacles.forEach(o => {
      const grad = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
      grad.addColorStop(0, '#f0f');
      grad.addColorStop(1, '#90f');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // UI overlay (no glow)
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
