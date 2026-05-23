// Simple endless‑runner based on IDEA.md
// Canvas must have id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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

  const player = { x: 80, y: H / 2, r: 15, speed: 3, shield: false, shieldTimer: 0 };
  const obstacles = [];
  const shields = [];
  let gameOver = false;
  let frame = 0;

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted && audioCtx.state !== 'running') {
      audioCtx.resume();
      audioStarted = true;
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const h = 30 + Math.random() * 40;
    const w = 20 + Math.random() * 30;
    const y = Math.random() * (H - h);
    obstacles.push({ x: W, y, w, h, speed: 4 + Math.random() * 2 });
  }

  function spawnShield() {
    const radius = 10;
    const y = Math.random() * (H - radius * 2) + radius;
    shields.push({ x: W, y, r: radius, speed: 3 });
  }

  function update() {
    if (gameOver) return;
    frame++;
    // player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // keep inside vertical bounds
    player.y = Math.max(player.r, Math.min(H - player.r, player.y));
    // off‑screen left check
    if (player.x + player.r < 0) gameOver = true;

    // spawn obstacles/shields
    if (frame % 90 === 0) spawnObstacle();
    if (frame % 300 === 0) spawnShield();

    // move obstacles
    obstacles.forEach(o => o.x -= o.speed);
    shields.forEach(s => s.x -= s.speed);
    // remove off‑screen
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while (shields.length && shields[0].x + shields[0].r < 0) shields.shift();

    // collision detection
    for (const o of obstacles) {
      const distX = Math.abs(player.x - (o.x + o.w / 2));
      const distY = Math.abs(player.y - (o.y + o.h / 2));
      if (distX > (o.w / 2 + player.r) || distY > (o.h / 2 + player.r)) continue;
      if (player.shield) continue; // shield protects
      playTone(200, 0.3); // crash sound
      gameOver = true;
    }

    for (let i = shields.length - 1; i >= 0; i--) {
      const s = shields[i];
      const dx = player.x - s.x;
      const dy = player.y - s.y;
if (dx * dx + dy * dy < (player.r + s.r) ** 2) {
          player.shield = true;
          player.shieldTimer = 300; // frames (~5 sec)
          playTone(600, 0.2); // shield pickup
          shields.splice(i, 1);
        }
    }
    if (player.shield) {
      player.shieldTimer--;
      if (player.shieldTimer <= 0) player.shield = false;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // player with glow
    const playerGradient = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    playerGradient.addColorStop(0, player.shield ? 'lime' : 'deepskyblue');
    playerGradient.addColorStop(1, player.shield ? '#006400' : '#00008b');
    ctx.fillStyle = playerGradient;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    // obstacles with rounded corners
    ctx.fillStyle = 'rgba(200,0,0,0.9)';
    obstacles.forEach(o => {
      const path = new Path2D();
      const radius = 5;
      path.moveTo(o.x + radius, o.y);
      path.lineTo(o.x + o.w - radius, o.y);
      path.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + radius);
      path.lineTo(o.x + o.w, o.y + o.h - radius);
      path.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - radius, o.y + o.h);
      path.lineTo(o.x + radius, o.y + o.h);
      path.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - radius);
      path.lineTo(o.x, o.y + radius);
      path.quadraticCurveTo(o.x, o.y, o.x + radius, o.y);
      ctx.fill(path);
    });
    // shields with pulsating effect
    shields.forEach(s => {
      const pulse = 1 + 0.3 * Math.sin(Date.now() / 200);
      ctx.fillStyle = 'rgba(0,255,0,0.7)';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
      ctx.fill();
    });
    // game over message
    if (gameOver) {
      ctx.fillStyle = 'black';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
