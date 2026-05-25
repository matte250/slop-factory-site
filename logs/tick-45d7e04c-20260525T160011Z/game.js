// Falling Blocks Dodge game
// Canvas element with id="game" is assumed to exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Audio context and beep helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }


  // Set canvas size (you can adjust as needed)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  const PLAYER_WIDTH = 40;
  const PLAYER_HEIGHT = 40;
  const PLAYER_SPEED = 5;
  const BLOCK_SIZE = 30;
  const BLOCK_MIN_SPEED = 2;
  const BLOCK_MAX_SPEED = 5;
  const BLOCK_SPAWN_INTERVAL = 1000; // ms

  let player = {
    x: canvas.width / 2 - PLAYER_WIDTH / 2,
    y: canvas.height - PLAYER_HEIGHT - 10,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    dx: 0,
  };

  let blocks = [];
  let lastSpawn = 0;
  let lastScoreTime = 0;
  let score = 0;
  let gameOver = false;

  // Helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r) {
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
    ctx.fill();
  }

  // Input handling
  const keys = {};
  // Ensure audio context is resumed on first user interaction
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = true;
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') keys.right = false;
  });

  function spawnBlock() {
    // Play a short puff sound when a block appears
    playBeep(200, 0.05);
    const x = Math.random() * (canvas.width - BLOCK_SIZE);
    const speed = BLOCK_MIN_SPEED + Math.random() * (BLOCK_MAX_SPEED - BLOCK_MIN_SPEED);
    const hue = Math.floor(Math.random() * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    blocks.push({ x, y: -BLOCK_SIZE, size: BLOCK_SIZE, speed, color });
  }

  function update(delta) {
    // Update player position
    if (keys.left) player.x -= PLAYER_SPEED;
    if (keys.right) player.x += PLAYER_SPEED;
    // Keep player within bounds
    player.x = Math.max(0, Math.min(canvas.width - PLAYER_WIDTH, player.x));

    // Update blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.y += b.speed;
      // Remove off-screen blocks
      if (b.y > canvas.height) blocks.splice(i, 1);
    }

    // Collision detection
    for (const b of blocks) {
      if (
        player.x < b.x + b.size &&
        player.x + PLAYER_WIDTH > b.x &&
        player.y < b.y + b.size &&
        player.y + PLAYER_HEIGHT > b.y
      ) {
        gameOver = true;
        playBeep(100, 0.3); // collision / game over sound
        break;
      }
    }

    // Score – increment each second survived
    if (!gameOver) {
      const now = Date.now();
      if (now - lastScoreTime >= 1000) {
        score++;
        playBeep(440, 0.08); // score increment sound
        lastScoreTime = now;
      }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#c2e0ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player with rounded shape and shadow
    ctx.fillStyle = '#0a84ff';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    drawRoundedRect(player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT, 6);
    ctx.shadowColor = 'transparent';

    // Draw blocks with rounded corners and individual colors
    for (const b of blocks) {
      ctx.fillStyle = b.color || 'red';
      drawRoundedRect(b.x, b.y, b.size, b.size, 4);
    }

    // Draw score with stylized font
    ctx.fillStyle = '#333';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '30px sans-serif';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

    // Draw score
    ctx.fillStyle = 'blue';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '30px Arial';
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!lastSpawn) lastSpawn = timestamp;
    const delta = timestamp - lastSpawn;
    if (delta >= BLOCK_SPAWN_INTERVAL) {
      spawnBlock();
      lastSpawn = timestamp;
    }
    if (!gameOver) update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
