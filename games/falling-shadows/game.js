// Simple Falling Shadows game targeting canvas with id="game"
// Player: circle controlled by arrow keys (and mouse movement)
// Blocks: falling rectangles, speed increases over time
// Score: survival time in seconds

(function () {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player configuration
  const player = {
    // audio context for game sounds
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    // helper to play a beep
    playSound(freq, type = 'sine', duration = 0.1) {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = type;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      gain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.01);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    },
    radius: 15,
    x: width / 2,
    y: height - 30,
    speed: 4,
    color: '#00f',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // keep player inside canvas
    player.x = Math.min(Math.max(mx, player.radius), width - player.radius);
    player.y = Math.min(Math.max(my, player.radius), height - player.radius);
  });

  // Block configuration
  const blocks = [];
  let blockSpawnTimer = 0;
  let blockSpawnInterval = 1000; // ms
  let lastTimestamp = 0;
  let speedFactor = 1; // increases over time
  let score = 0;
  let gameOver = false;

  function spawnBlock() {
    const blockWidth = 50 + Math.random() * 50; // 50-100px
    const blockX = Math.random() * (width - blockWidth);
    const block = {
      x: blockX,
      y: -20,
      w: blockWidth,
      h: 20,
      speed: 2 * speedFactor,
      color: '#555',
    };
    blocks.push(block);
    // play a subtle spawn sound
    player.playSound(150, 'triangle', 0.05);
  }

  function update(dt) {
    // player movement via arrow keys
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    // keep inside bounds
    player.x = Math.min(Math.max(player.x, player.radius), width - player.radius);
    player.y = Math.min(Math.max(player.y, player.radius), height - player.radius);

    // spawn blocks
    blockSpawnTimer += dt;
    if (blockSpawnTimer >= blockSpawnInterval) {
      spawnBlock();
      blockSpawnTimer = 0;
      // gradually increase difficulty
      if (blockSpawnInterval > 300) blockSpawnInterval -= 20;
      speedFactor += 0.02;
    }

    // update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // remove off‑screen blocks
      if (b.y > height) blocks.splice(i, 1);
    }

    // collision detection (circle‑rect)
    for (const b of blocks) {
      const closestX = Math.max(b.x, Math.min(player.x, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(player.y, b.y + b.h));
      const dx = player.x - closestX;
      const dy = player.y - closestY;
      if (dx * dx + dy * dy < player.radius * player.radius) {
        gameOver = true;
        // play collision sound
        player.playSound(300, 'sawtooth', 0.2);
        break;
      }
    }

    if (!gameOver) score += dt / 1000; // seconds
  }

  // helper to draw rounded rectangle
  function drawRoundedRect(x, y, w, h, radius, fillStyle) {
    ctx.fillStyle = fillStyle;
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
    ctx.fill();
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#333');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw player with radial gradient and shadow
    const playerGrad = ctx.createRadialGradient(
      player.x,
      player.y,
      player.radius * 0.2,
      player.x,
      player.y,
      player.radius
    );
    playerGrad.addColorStop(0, '#4af');
    playerGrad.addColorStop(1, '#00f');
    ctx.fillStyle = playerGrad;
    ctx.shadowColor = 'rgba(0,0,255,0.5)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // draw blocks
    for (const b of blocks) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }

    // draw score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score.toFixed(2), 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Final Score: ' + score.toFixed(2), width / 2, height / 2 + 20);
    }
  }

  function loop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the animation loop
  requestAnimationFrame(loop);
})();
