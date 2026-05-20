// Minimalist Pixel Escape game
// Canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  const initAudio = () => {
    if (audioInitialized) return;
    audioInitialized = true;
    // resume context on user gesture
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playCollision = () => playTone(100, 0.3);
  const playSpawn = () => playTone(400, 0.05);

  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;

  // Player pixel
  const player = { x: width / 2, y: height / 2, size: 5, speed: 2 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; initAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Enemy blocks
  const blocks = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let blockSpeed = 1;
  let startTime = performance.now();
  let gameOver = false;

  function spawnBlock() {
    const size = 10 + Math.random() * 20;
    const side = Math.floor(Math.random() * 4); // 0:top 1:right 2:bottom 3:left
    let x, y, vx, vy;
    const color = `hsl(${Math.random() * 360},80%,60%)`;
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -size;
        vx = (Math.random() - 0.5) * blockSpeed;
        vy = blockSpeed;
        break;
      case 1: // right
        x = width + size;
        y = Math.random() * height;
        vx = -blockSpeed;
        vy = (Math.random() - 0.5) * blockSpeed;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + size;
        vx = (Math.random() - 0.5) * blockSpeed;
        vy = -blockSpeed;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * height;
        vx = blockSpeed;
        vy = (Math.random() - 0.5) * blockSpeed;
        break;
    }
    blocks.push({ x, y, vx, vy, size, color });
    playSpawn();
  }

  function update(dt) {
    // Move player
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(width, player.x));
    player.y = Math.max(0, Math.min(height, player.y));

    // Spawn blocks over time
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // Increase difficulty
    const elapsed = performance.now() - startTime;
    spawnInterval = Math.max(300, 2000 - elapsed * 0.05); // faster spawns
    blockSpeed = 1 + elapsed * 0.001; // faster blocks

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.x += b.vx;
      b.y += b.vy;
      // Remove off‑screen
      if (b.x < -b.size || b.x > width + b.size || b.y < -b.size || b.y > height + b.size) {
        blocks.splice(i, 1);
        continue;
      }
      // Collision with player (simple AABB)
      if (
        player.x < b.x + b.size &&
        player.x + player.size > b.x &&
        player.y < b.y + b.size &&
        player.y + player.size > b.y
      ) {
        playCollision();
        gameOver = true;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#444');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player as a smooth circle
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw blocks with rounded corners and drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    for (const b of blocks) {
      ctx.fillStyle = b.color;
      const r = 3; // corner radius
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
    ctx.shadowBlur = 0;
    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    const seconds = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastFrame;
  requestAnimationFrame(loop);
})();
