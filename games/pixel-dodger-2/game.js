// Simple Pixel Dodger game with enhanced graphics
// Canvas with id='game' must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element "#game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player setup
  const player = { w: 30, h: 30, x: width / 2 - 15, y: height - 40, speed: 5 };

  // Blocks storage
  const blocks = [];
  const blockSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Game state
  let startTime = null;
  let gameOver = false;
  let score = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume AudioContext on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Play movement sound
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') beep(400, 80);
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnBlock() {
    const w = 20 + Math.random() * 50;
    const h = 20 + Math.random() * 50;
    const x = Math.random() * (width - w);
    const speed = 2 + Math.random() * 3;
    blocks.push({ x, y: -h, w, h, speed });
  }

  function update(delta) {
    // Move player
    if (keys['ArrowLeft']) player.x = Math.max(0, player.x - player.speed);
    if (keys['ArrowRight']) player.x = Math.min(width - player.w, player.x + player.speed);

    // Spawn blocks
    if (Date.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = Date.now();
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // Remove off‑screen
      if (b.y > height) blocks.splice(i, 1);
    }

    // Collision detection
    for (const b of blocks) {
      if (player.x < b.x + b.w &&
          player.x + player.w > b.x &&
          player.y < b.y + b.h &&
          player.y + player.h > b.y) {
        beep(200, 300);
        gameOver = true;
        break;
      }
    }

    // Update score
    if (!gameOver && startTime !== null) {
      score = Math.floor((Date.now() - startTime) / 1000);
    }
  }

  function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
    ctx.clearRect(0, 0, width, height);
    // Player with rounded corners and gradient
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#3f3');
    playerGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = playerGrad;
    // Rounded rectangle
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();
    // Blocks with gradient and slight shadow
    ctx.save();
    for (const b of blocks) {
      const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      blockGrad.addColorStop(0, '#ff4');
      blockGrad.addColorStop(1, '#c00');
      ctx.fillStyle = blockGrad;
      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 4;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (startTime === null) startTime = Date.now();
    if (!gameOver) {
      const delta = timestamp - (lastRender || timestamp);
      update(delta);
    }
    draw();
    if (!gameOver) {
      lastRender = timestamp;
      requestAnimationFrame(loop);
    }
  }

  let lastRender = null;
  requestAnimationFrame(loop);
})();
