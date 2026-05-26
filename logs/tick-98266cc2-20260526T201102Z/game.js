// Pixel Dodger – simple canvas game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = { w: 40, h: 20, x: width / 2 - 20, y: height - 30, speed: 5 };

  // Blocks
  const blocks = [];
  let blockSpawnTimer = 0;
  let blockSpawnInterval = 1500; // ms
  let blockSpeed = 2;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  // Helper: background gradient
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001d3d');
    grad.addColorStop(1, '#003566');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  function ensureAudioContext() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  window.addEventListener('keydown', ensureAudioContext);

  function playBeep(freq, duration) {
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

  // Input
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBlock() {
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (width - size);
    blocks.push({ x, y: -size, w: size, h: size });
    // Play a short beep when a block appears
    playBeep(300, 100);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // spawn blocks
    blockSpawnTimer += dt;
    if (blockSpawnTimer > blockSpawnInterval) {
      spawnBlock();
      blockSpawnTimer = 0;
    }

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += blockSpeed * (dt / 16.67);
      // collision
        if (
          b.x < player.x + player.w &&
          b.x + b.w > player.x &&
          b.y < player.y + player.h &&
          b.y + b.h > player.y
        ) {
          gameOver = true;
          // Play collision sound
          playBeep(150, 300);
        }
      // remove off‑screen
      if (b.y > height) blocks.splice(i, 1);
    }

    // increase difficulty over time
    blockSpeed += dt * 0.00001; // gradual acceleration
    blockSpawnInterval = Math.max(300, blockSpawnInterval - dt * 0.01);
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // background gradient
    drawBackground();
    // player (rounded green)
    drawRoundedRect(player.x, player.y, player.w, player.h, 5, '#00ff88');
    // blocks (rounded red)
    blocks.forEach(b => drawRoundedRect(b.x, b.y, b.w, b.h, 4, '#ff5555'));
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  const startTime = performance.now();
  requestAnimationFrame(loop);
})();
