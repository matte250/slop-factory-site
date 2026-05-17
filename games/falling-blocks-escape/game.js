// Simple falling blocks game targeting canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 300;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio starts after user interaction
  const unlockAudio = () => {
    if (audioCtx.state !== 'running') audioCtx.resume();
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  const playBeep = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Player avatar
  const player = { x: width / 2, y: height - 20, w: 30, h: 10, speed: 4 };

  // Falling blocks array
  const blocks = [];
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnBlock() {
    const w = 20 + Math.random() * 30;
    const h = 20 + Math.random() * 30;
    const x = Math.random() * (width - w);
    const speed = 1 + Math.random() * 2;
    blocks.push({ x, y: -h, w, h, speed });
    // Play spawn sound
    playBeep(300);
  }

  function update() {
    if (gameOver) return;
    // Move player
    if (keys['ArrowLeft']) player.x -= player.speed;
    if (keys['ArrowRight']) player.x += player.speed;
    player.x = Math.max(0, Math.min(width - player.w, player.x));

    // Spawn blocks periodically
    spawnTimer -= 1;
    if (spawnTimer <= 0) {
      spawnBlock();
      spawnTimer = 60; // approx 1 sec at 60fps
    }

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // Remove off-screen
if (b.y > height) {
          blocks.splice(i, 1);
          score++;
          // Play score beep
          playBeep(600);
          continue;
        }
        // Collision detection
        if (
          b.x < player.x + player.w &&
          b.x + b.w > player.x &&
          b.y < player.y + player.h &&
          b.y + b.h > player.y
        ) {
          gameOver = true;
          // Play collision beep
          playBeep(100);
        }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#555');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Enable shadow for shapes
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 6;

    // Draw player as rounded rectangle
    ctx.fillStyle = '#0a84ff';
    const r = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + r, player.y);
    ctx.lineTo(player.x + player.w - r, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + r);
    ctx.lineTo(player.x + player.w, player.y + player.h - r);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - r, player.y + player.h);
    ctx.lineTo(player.x + r, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - r);
    ctx.lineTo(player.x, player.y + r);
    ctx.quadraticCurveTo(player.x, player.y, player.x + r, player.y);
    ctx.closePath();
    ctx.fill();

    // Draw blocks with hue based on speed
    blocks.forEach(b => {
      const hue = Math.floor(200 + b.speed * 40);
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    // Disable shadow for UI text
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);

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

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game
  requestAnimationFrame(loop);
})();
