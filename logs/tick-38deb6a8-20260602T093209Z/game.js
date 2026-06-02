// Pixel Dodger game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio context on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  document.addEventListener('keydown', resumeAudio, { once: true });

  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }

  // Player settings (circle)
  const player = {
    radius: 8,
    x: width / 2,
    y: height - 15,
    speed: 4,
    color: '#00ff00',
  };

  // Block settings
  const blocks = [];
  let blockSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let fallingSpeed = 2;

  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = { left: false, right: false };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });

  function spawnBlock() {
    const size = Math.random() * 6 + 8; // random size between 8-14
    const x = Math.random() * (width - size);
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 80%, 60%)`;
    blocks.push({ x, y: -size, w: size, h: size, color });
    // Play spawn sound
    playTone(300, 0.07);
  }

  function update(dt) {
    // Move player
    if (keys.left) player.x -= player.speed;
    if (keys.right) player.x += player.speed;
    // Keep within bounds
    if (player.x - player.radius < 0) player.x = player.radius;
    if (player.x + player.radius > width) player.x = width - player.radius;

    // Spawn blocks based on interval
    if (performance.now() - lastSpawn > blockSpawnInterval) {
      spawnBlock();
      lastSpawn = performance.now();
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += fallingSpeed;
      // Check collision with player
// Circle-rectangle collision detection
{
  const nearestX = Math.max(b.x, Math.min(player.x, b.x + b.w));
  const nearestY = Math.max(b.y, Math.min(player.y, b.y + b.h));
  const dx = player.x - nearestX;
  const dy = player.y - nearestY;
if (dx * dx + dy * dy < player.radius * player.radius) {
      gameOver = true;
      // Play collision/game over sound
      playTone(150, 0.3);
    }
}
      // Remove off-screen blocks and increment score
      if (b.y > height) {
        blocks.splice(i, 1);
        if (!gameOver) {
          score++;
          // Play score sound
          playTone(600, 0.08);
        }
      }
    }

    // Gradually increase difficulty
    if (!gameOver && score % 10 === 0 && score !== 0) {
      fallingSpeed = Math.min(fallingSpeed + 0.2, 8);
      blockSpawnInterval = Math.max(blockSpawnInterval - 50, 400);
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw player as glowing circle
    ctx.shadowColor = 'rgba(0,255,0,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Draw blocks with gradient fill
    blocks.forEach((b) => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
      grad.addColorStop(0, '#ff8080');
      grad.addColorStop(1, b.color);
      ctx.fillStyle = grad;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // Draw score with slight shadow
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff4444';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start loop
  requestAnimationFrame(loop);
})();
