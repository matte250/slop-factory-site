// Enhanced "Pixel Escape" game with improved graphics
// Canvas with id="game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Player (a small circle with glow)
  const player = { x: 50, y: H / 2, size: 8, speed: 2 };
  // Audio context for sound effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Obstacles: array of {x, y, w, h}
  const obstacles = [];
  const obstacleSpeed = 2; // moves left
  const obstacleInterval = 1500; // ms
  let lastObstacle = 0;
  // Stars for background effect
  const stars = [];
  const starCount = 60;
  const starSpeed = 0.5;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  let score = 0;
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    // Random height block covering part of the vertical space
    const blockHeight = Math.random() * (H / 2) + 20;
    const gapY = Math.random() * (H - blockHeight - 40) + 20;
    // Top block
    obstacles.push({ x: W, y: 0, w: 30, h: gapY });
    // Bottom block
    obstacles.push({ x: W, y: gapY + blockHeight, w: 30, h: H - (gapY + blockHeight) });
  }

  function update(dt) {
    // Move player based on arrow keys
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep player inside canvas horizontally (optional)
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > W) player.x = W - player.size;
    // Player falling off bottom ends game
    if (player.y > H) { running = false; beep(200, 200); }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Update stars for moving background
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= starSpeed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
        s.r = Math.random() * 1.5 + 0.5;
      }
    }

    // Spawn new obstacles
    if (performance.now() - lastObstacle > obstacleInterval) {
      spawnObstacle();
      lastObstacle = performance.now();
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.size > o.x &&
        player.y < o.y + o.h &&
        player.y + player.size > o.y
      ) {
        running = false;
        beep(300, 200);
        break;
      }
    }

    // Increment score
    score += dt;
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#003973');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Draw stars (small white circles moving left)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player as circle with glow
    const playerGrad = ctx.createRadialGradient(
      player.x + player.size / 2,
      player.y + player.size / 2,
      0,
      player.x + player.size / 2,
      player.y + player.size / 2,
      player.size * 2
    );
    playerGrad.addColorStop(0, '#00ff00');
    playerGrad.addColorStop(1, '#003300');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles with semi‑transparent red
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    for (const o of obstacles) {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
  }

  let lastTime = performance.now();
  function loop() {
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W / 2 - 60, H / 2);
      ctx.fillText('Final Score: ' + Math.floor(score / 1000), W / 2 - 80, H / 2 + 30);
      return;
    }
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  // Start loop
  requestAnimationFrame(loop);
})();
