// Minimal endless‑runner with enhanced graphics for canvas "game"
// Player: small square controlled by arrow keys
// Walls: vertical bars moving left, maze shrinks over time
// Power‑ups: glowing circles that increase speed briefly

(() => {
  const canvas = document.getElementById('game');
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
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 600;

  // ------- Game state -------
  const player = { x: 50, y: height / 2, size: 20, speed: 3 };
  let walls = []; // each wall: {x, gapY, gapHeight, speed}
  let particles = []; // each particle: {x, y, radius, alpha, life}
  const stars = [];
  // generate background stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.3,
    });
  }
  let powerUps = []; // each pu: {x, y, radius, ttl}
  let time = 0; // seconds elapsed
  let timer = 30; // seconds left
  let gameOver = false;
  const shrinkRate = 0.015; // maze vertical shrink per second

  // ------- Input -------
  const keys = {};
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ------- Helpers -------
  function rand(min, max) { return Math.random() * (max - min) + min; }
  function spawnWall() {
    const gapHeight = Math.max(80, height * 0.3 - time * 2);
    const gapY = rand(0, height - gapHeight);
    walls.push({ x: width, gapY, gapHeight, speed: 2 + time * 0.05 });
  }
  function spawnPowerUp() {
    const radius = 8;
    const x = width + rand(0, 200);
    const y = rand(radius, height - radius);
    powerUps.push({ x, y, radius, ttl: 10 }); // lasts 10 sec if not collected
  }

  // initial walls/power‑ups
  spawnWall();
  let wallTimer = 0;
  let puTimer = 0;

  // ------- Game loop -------
  function update(dt) {
    if (gameOver) return;
    // timer countdown
    timer -= dt;
    if (timer <= 0) gameOver = true;

    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep within canvas
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // spawn walls
    wallTimer += dt;
    if (wallTimer > 1.5) { spawnWall(); wallTimer = 0; }
    // spawn power‑ups occasionally
    puTimer += dt;
    if (puTimer > 5) { spawnPowerUp(); puTimer = 0; }

    // move walls and check collision
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.6);
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = walls.length - 1; i >= 0; i--) {
      const w = walls[i];
      w.x -= w.speed * dt * 60; // speed per frame
      // collision with player (outside gap)
if (player.x < w.x + 20 && player.x + player.size > w.x) {
          if (player.y < w.gapY || player.y + player.size > w.gapY + w.gapHeight) {
            playTone(200, 0.3); // collision sound
            gameOver = true;
          }
        }
      // remove off‑screen
      if (w.x + 20 < 0) walls.splice(i, 1);
    }

    // move power‑ups and check collection
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const pu = powerUps[i];
      pu.x -= 2 * dt * 60;
      pu.ttl -= dt;
      const dx = (player.x + player.size/2) - pu.x;
      const dy = (player.y + player.size/2) - pu.y;
      if (Math.hypot(dx, dy) < pu.radius + player.size/2) {
        // grant speed boost for 3 sec and emit particles
        player.speed = 6;
        setTimeout(() => { player.speed = 3; }, 3000);
        // create burst particles
        for (let p = 0; p < 12; p++) {
          particles.push({
            x: pu.x,
            y: pu.y,
            radius: 2 + Math.random() * 2,
            alpha: 1,
            life: 0.6,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 100,
          });
        }
        // play power‑up sound
        playTone(600, 0.15);
        powerUps.splice(i, 1);
        continue;
      }
      if (pu.ttl <= 0) powerUps.splice(i, 1);
    }

    // gradually shrink visible area (optional visual effect)
    // not implemented: could adjust gap heights over time
    time += dt;
  }

  function draw() {
  // background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#1a1a2e');
  bgGrad.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    // walls with gradient and subtle glow
    const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
    wallGrad.addColorStop(0, '#2e2e3a');
    wallGrad.addColorStop(1, '#1f1f2b');
    ctx.fillStyle = wallGrad;
    walls.forEach(w => {
      // top part
      ctx.fillRect(w.x, 0, 20, w.gapY);
      // bottom part
      ctx.fillRect(w.x, w.gapY + w.gapHeight, 20, height - (w.gapY + w.gapHeight));
    });
    // power‑ups
    ctx.fillStyle = '#ff0';
    powerUps.forEach(pu => {
      ctx.beginPath();
      ctx.arc(pu.x, pu.y, pu.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // particles (glow effect)
    ctx.save();
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    // player
    ctx.fillStyle = '#0f0';
    ctx.fillRect(player.x, player.y, player.size, player.size);
    // UI timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.max(0, timer).toFixed(1)}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
ctx.fillRect(0, 0, width, height);
    // draw background stars
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
