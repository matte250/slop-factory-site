// Game: Pixel Dodge
// Canvas with id "game"
// Player: white 10x10 square, moves with arrow keys.
// Enemies: red squares (10x10) spawning at random edges.
// Lives: 3, score increases with time.
// Game over when lives reach 0.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player state
  const player = { x: width / 2 - 5, y: height / 2 - 5, size: 10, speed: 2 };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

  // Enemy state
  const enemies = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Game stats
  let lives = 3;
  let score = 0;
  let startTime = performance.now();
  let lastTime = startTime;

  // Input handling
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 200, duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function update(dt) {
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep player inside canvas
    player.x = Math.max(0, Math.min(width - player.size, player.x));
    player.y = Math.max(0, Math.min(height - player.size, player.y));

    // Spawn enemies
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnEnemy();
      lastSpawn = performance.now();
    }

    // Update enemies (move towards player)
    enemies.forEach(e => {
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      const step = e.speed * dt / 16; // normalize to ~60fps base
      e.x += (dx / dist) * step;
      e.y += (dy / dist) * step;
    });

    // Collision detection
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (rectIntersect(player, e)) {
        enemies.splice(i, 1);
        lives--;
        playBeep(150, 0.2); // collision sound
        if (lives <= 0) {
          // Game over
          playBeep(100, 0.5);
          alert('Game Over! Score: ' + Math.floor(score));
          resetGame();
          return;
        }
      }
    }

    // Update score based on elapsed time
    const now = performance.now();
    score += (now - lastTime) / 1000; // seconds
    lastTime = now;
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
  }

  function spawnEnemy() {
    // Spawn at random edge
    const size = 10;
    const speed = 1 + Math.random() * 1.5; // 1-2.5
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: // top
        x = Math.random() * (width - size);
        y = -size;
        break;
      case 1: // bottom
        x = Math.random() * (width - size);
        y = height;
        break;
      case 2: // left
        x = -size;
        y = Math.random() * (height - size);
        break;
      default: // right
        x = width;
        y = Math.random() * (height - size);
    }
    enemies.push({ x, y, size, speed });
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001d3a');
    bgGrad.addColorStop(1, '#001122');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Player with radial gradient (glowing effect)
    const playerGrad = ctx.createRadialGradient(
        player.x + player.size / 2,
        player.y + player.size / 2,
        player.size / 4,
        player.x + player.size / 2,
        player.y + player.size / 2,
        player.size
    );
    playerGrad.addColorStop(0, '#ffffff');
    playerGrad.addColorStop(1, '#00bfff');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Enemies – colored squares with slight rotation for visual interest
    enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x + e.size / 2, e.y + e.size / 2);
        ctx.rotate((performance.now() / 1000) % (Math.PI * 2));
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size);
        ctx.restore();
    });

    // HUD – semi‑transparent overlay
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Lives: ' + lives, 8, 20);
    ctx.fillText('Score: ' + Math.floor(score), 8, 40);
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function resetGame() {
    player.x = width / 2 - 5;
    player.y = height / 2 - 5;
    enemies.length = 0;
    lives = 3;
    score = 0;
    startTime = performance.now();
    lastTime = startTime;
  }

  // Start loop
  requestAnimationFrame(loop);
})();
