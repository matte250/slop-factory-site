// Minimal Pixel Escape game targeting canvas with id="game"
(() => {
  // Helper to draw rounded rectangles
  const drawRoundedRect = (x, y, w, h, r, fillStyle) => {
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
    ctx.fillStyle = fillStyle;
    ctx.fill();
  };
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  };
  const TILE = 20; // size of player & blocks
  const COLLISION_FREQ = 150;
  const WIN_FREQ = 300;
  const PLAYER_COLOR = '#00f';
  const BLOCK_COLOR = '#f00';
  const EXIT_COLOR = '#0f0';
  const SPEED = 2; // player move speed (pixels per frame)
  const BLOCK_SPEED = 1; // horizontal block speed
  const SPAWN_INTERVAL = 1500; // ms between new blocks
  const GAME_TIME = 60; // seconds

  // Resize canvas to its displayed size (optional)
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const player = { x: 0, y: canvas.height / 2 - TILE / 2, w: TILE, h: TILE };
  const blocks = [];
  let timeLeft = GAME_TIME;
  let gameOver = false;
  let win = false;

  // Arrow key handling
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const spawnBlock = () => {
    const y = Math.random() * (canvas.height - TILE);
    blocks.push({ x: canvas.width, y, w: TILE, h: TILE, vx: -BLOCK_SPEED });
  };
  const blockTimer = setInterval(spawnBlock, SPAWN_INTERVAL);

  const timerId = setInterval(() => {
    if (gameOver) return;
    timeLeft--;
    if (timeLeft <= 0) endGame(false, 'Time ran out');
  }, 1000);

  const endGame = (won, reason) => {
    gameOver = true;
    win = won;
    clearInterval(blockTimer);
    clearInterval(timerId);
    // play appropriate sound
    if (won) {
      playTone(WIN_FREQ, 300);
    } else {
      playTone(COLLISION_FREQ, 200);
    }
    console.log(won ? 'You win!' : 'Game over', reason);
  };

  const update = () => {
    if (gameOver) return;
    // player movement
    if (keys.ArrowUp) player.y -= SPEED;
    if (keys.ArrowDown) player.y += SPEED;
    if (keys.ArrowLeft) player.x -= SPEED;
    if (keys.ArrowRight) player.x += SPEED;
    // keep inside bounds
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // move blocks
    for (let i = blocks.length - 1; i >= 0; i--) {
      const b = blocks[i];
      b.x += b.vx;
      // remove off‑screen blocks
      if (b.x + b.w < 0) blocks.splice(i, 1);
    }

    // collision detection
    for (const b of blocks) {
      if (player.x < b.x + b.w && player.x + player.w > b.x &&
          player.y < b.y + b.h && player.y + player.h > b.y) {
        endGame(false, 'Collided with block');
        return;
      }
    }

    // win condition – reaching right edge
    if (player.x + player.w >= canvas.width) {
      endGame(true, 'Reached the exit');
    }
  };

  const draw = () => {
    // background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // draw exit as a glowing column
    const exitGrad = ctx.createLinearGradient(canvas.width - TILE, 0, canvas.width, 0);
    exitGrad.addColorStop(0, '#0f0');
    exitGrad.addColorStop(1, '#060');
    drawRoundedRect(canvas.width - TILE, 0, TILE, canvas.height, 4, exitGrad);
    // draw player with rounded corners
    drawRoundedRect(player.x, player.y, player.w, player.h, 4, PLAYER_COLOR);
    // draw blocks with rounded corners
    for (const b of blocks) {
      drawRoundedRect(b.x, b.y, b.w, b.h, 4, BLOCK_COLOR);
    }
    // draw timer
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`, 10, 20);
  };

  const loop = () => {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
