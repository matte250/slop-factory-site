// Simple Canvas Escape game
// Player: square at bottom, moves left/right (←/→)
// Blocks: fall from top, speed increases over time
// Game ends on collision or when block passes bottom

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume on first user interaction (required by browsers)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('keydown', resumeAudio, {once:true});
  window.addEventListener('click', resumeAudio, {once:true});

  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };

  // Game settings
  const playerSize = 20;
  const blockSize = 20;
  let playerX = (width - playerSize) / 2;
  const playerY = height - playerSize - 5;
  const playerSpeed = 5;
  let blocks = [];
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let speedMultiplier = 1;
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnBlock() {
    const x = Math.random() * (width - blockSize);
    blocks.push({ x, y: -blockSize, speed: 2 * speedMultiplier });
    // Play a short tone when a block appears
    playTone(220, 0.08);
  }

  function update(dt) {
    // player movement
    if (keys['ArrowLeft']) playerX = Math.max(0, playerX - playerSpeed);
    if (keys['ArrowRight']) playerX = Math.min(width - playerSize, playerX + playerSpeed);

    // blocks movement
    blocks.forEach(b => b.y += b.speed * dt / 16);
    // remove off-screen blocks
    blocks = blocks.filter(b => b.y < height);

    // collision detection
    for (const b of blocks) {
      if (
        b.x < playerX + playerSize &&
        b.x + blockSize > playerX &&
        b.y < playerY + playerSize &&
        b.y + blockSize > playerY
      ) {
        // Collision sound
        playTone(440, 0.15);
        gameOver = true;
        break;
      }
    }

    // increase difficulty over time
    if (lastTime % 5000 < dt) {
      speedMultiplier += 0.2;
      spawnInterval = Math.max(500, spawnInterval - 100);
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#0a0a13');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Helper for rounded rectangles
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Player (rounded, blue gradient)
    const playerGrad = ctx.createLinearGradient(playerX, playerY, playerX, playerY + playerSize);
    playerGrad.addColorStop(0, '#4a90e2');
    playerGrad.addColorStop(1, '#357ab8');
    ctx.fillStyle = playerGrad;
    roundRect(playerX, playerY, playerSize, playerSize, 4);
    ctx.fill();

    // Blocks (rounded, red gradient)
    blocks.forEach(b => {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + blockSize);
      blockGrad.addColorStop(0, '#e94e4e');
      blockGrad.addColorStop(1, '#c0392b');
      ctx.fillStyle = blockGrad;
      roundRect(b.x, b.y, blockSize, blockSize, 3);
      ctx.fill();
    });

    if (gameOver) {
      // Dark overlay
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) {
      if (timestamp - lastSpawn > spawnInterval) {
        spawnBlock();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
