// Canvas Dodger game implementation
// Assumes an existing <canvas id="game"></canvas> in the HTML.

(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSpawnSound() { playTone(800, 0.04); }
  function playCollisionSound() { playTone(200, 0.2); }

  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player settings
  const player = {
    radius: 15,
    x: width / 2,
    y: height - 30,
    speed: 5,
    color: '#00f',
  };

  // Block settings
  const blocks = [];
  const blockSize = 30;
  let blockSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let blockSpeed = 2;

  // Score
  let startTime = performance.now();
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBlock() {
    playSpawnSound();
    const x = Math.random() * (width - blockSize);
    blocks.push({ x, y: -blockSize, size: blockSize, speed: blockSpeed });
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // keep within bounds
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));

    // spawn blocks
    if (performance.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      if (b.y > height) {
        blocks.splice(i, 1);
        // increase difficulty
        blockSpeed += 0.05;
        blockSpawnInterval = Math.max(300, blockSpawnInterval - 20);
      }
    }

    // collision detection
    for (const b of blocks) {
      const dx = Math.abs(b.x + b.size / 2 - player.x);
      const dy = Math.abs(b.y + b.size / 2 - player.y);
      const distance = Math.hypot(dx, dy);
      if (dx < b.size / 2 && dy < b.size / 2 && distance < player.radius + b.size / 2) { // collision
          playCollisionSound();
        // Game over
        alert('Game Over! Score: ' + Math.floor(score));
        // reset
        blocks.length = 0;
        player.x = width / 2;
        startTime = performance.now();
        score = 0;
        blockSpeed = 2;
        blockSpawnInterval = 1500;
        return;
      }
    }

    // update score
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // player with radial gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,255,0.5)';
    ctx.shadowBlur = 10;
    const pGrad = ctx.createRadialGradient(player.x, player.y, player.radius * 0.3, player.x, player.y, player.radius);
    pGrad.addColorStop(0, '#66f');
    pGrad.addColorStop(1, '#00f');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // blocks with rounded corners and gradient
    for (const b of blocks) {
      const blkGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.size);
      blkGrad.addColorStop(0, '#ff6666');
      blkGrad.addColorStop(1, '#ff0000');
      ctx.fillStyle = blkGrad;
      // draw rounded rectangle
      const r = 5; // corner radius
      ctx.beginPath();
      ctx.moveTo(b.x + r, b.y);
      ctx.lineTo(b.x + b.size - r, b.y);
      ctx.quadraticCurveTo(b.x + b.size, b.y, b.x + b.size, b.y + r);
      ctx.lineTo(b.x + b.size, b.y + b.size - r);
      ctx.quadraticCurveTo(b.x + b.size, b.y + b.size, b.x + b.size - r, b.y + b.size);
      ctx.lineTo(b.x + r, b.y + b.size);
      ctx.quadraticCurveTo(b.x, b.y + b.size, b.x, b.y + b.size - r);
      ctx.lineTo(b.x, b.y + r);
      ctx.quadraticCurveTo(b.x, b.y, b.x + r, b.y);
      ctx.closePath();
      ctx.fill();
    }

    // score with nice font
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
