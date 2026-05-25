// Enhanced canvas game with improved graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after user interaction
  const unlockAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const TILE = 20;
  const COLS = 20;
  const ROWS = 20;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  // Generate a basic maze: borders + random interior walls.
  const maze = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) {
    maze[y][0] = maze[y][COLS - 1] = 1; // left/right walls
  }
  for (let x = 0; x < COLS; x++) {
    maze[0][x] = maze[ROWS - 1][x] = 1; // top/bottom walls
  }
  // Random interior walls (simple density)
  for (let i = 0; i < COLS * ROWS * 0.2; i++) {
    const x = 1 + Math.floor(Math.random() * (COLS - 2));
    const y = 1 + Math.floor(Math.random() * (ROWS - 2));
    if ((x === 1 && y === 1) || (x === COLS - 2 && y === ROWS - 2)) continue; // keep start/exit clear
    maze[y][x] = 1;
  }

  const player = { x: 1, y: 1 };
  const exit = { x: COLS - 2, y: ROWS - 2 };

  // Simple horizontal moving trap.
  const trap = { x: 2, y: Math.floor(ROWS / 2), dir: 1 };

  let timer = 60; // seconds
  let lastTick = performance.now();
  let gameOver = false;
  let win = false;
  // track previous grid position for step sound
  let prevPos = { x: player.x, y: player.y };

  const keyState = {};
  window.addEventListener('keydown', e => (keyState[e.key] = true));
  window.addEventListener('keyup', e => (keyState[e.key] = false));

  function update(dt) {
    if (gameOver) return;
    // move player
    const speed = 5 * dt; // tiles per second
    if (keyState['ArrowUp']) player.y -= speed;
    if (keyState['ArrowDown']) player.y += speed;
    if (keyState['ArrowLeft']) player.x -= speed;
    if (keyState['ArrowRight']) player.x += speed;
    // snap to grid & collision
    const nx = Math.round(player.x);
    const ny = Math.round(player.y);
    if (maze[ny][nx] === 0) {
      player.x = nx; player.y = ny;
    } else {
      player.x = Math.round(player.x);
      player.y = Math.round(player.y);
    }
    // play step sound if moved to new tile
    if (nx !== prevPos.x || ny !== prevPos.y) {
      playTone(400, 0.08);
      prevPos.x = nx; prevPos.y = ny;
    }
    // trap movement
    trap.x += trap.dir * speed;
    if (trap.x < 2 || trap.x > COLS - 3) trap.dir *= -1;
    // collision with trap
    if (Math.round(player.x) === Math.round(trap.x) && player.y === trap.y) {
      playTone(200, 0.3); // low beep on loss
      gameOver = true;
    }
    // reach exit
    if (player.x === exit.x && player.y === exit.y) {
      playTone(800, 0.3); // high beep on win
      win = true; gameOver = true;
    }
    // timer
    timer -= dt;
    if (timer <= 0) {
      timer = 0; gameOver = true;
    }
  }

  function draw() {
    // Clear and draw background gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze walls with subtle shading
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (maze[y][x]) {
          ctx.fillStyle = '#555';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.strokeRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    // Draw exit with green gradient
    const exitGrad = ctx.createRadialGradient(
      (exit.x + 0.5) * TILE,
      (exit.y + 0.5) * TILE,
      TILE / 4,
      (exit.x + 0.5) * TILE,
      (exit.y + 0.5) * TILE,
      TILE / 2
    );
    exitGrad.addColorStop(0, '#6fdd6f');
    exitGrad.addColorStop(1, '#2a8b2a');
    ctx.fillStyle = exitGrad;
    ctx.fillRect(exit.x * TILE, exit.y * TILE, TILE, TILE);
    // Draw trap as a pulsing red triangle
    ctx.save();
    ctx.translate(trap.x * TILE + TILE / 2, trap.y * TILE + TILE / 2);
    const pulse = Math.abs(Math.sin(performance.now() / 200)) * 0.3 + 0.7;
    ctx.scale(pulse, pulse);
    ctx.fillStyle = '#ff4d4d';
    ctx.beginPath();
    ctx.moveTo(-TILE / 2, -TILE / 2);
    ctx.lineTo(TILE / 2, -TILE / 2);
    ctx.lineTo(0, TILE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw player with blue gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,255,0.5)';
    ctx.shadowBlur = 8;
    const playerGrad = ctx.createRadialGradient(
      (player.x + 0.5) * TILE,
      (player.y + 0.5) * TILE,
      TILE / 6,
      (player.x + 0.5) * TILE,
      (player.y + 0.5) * TILE,
      TILE / 2
    );
    playerGrad.addColorStop(0, '#5fa8ff');
    playerGrad.addColorStop(1, '#0033aa');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc((player.x + 0.5) * TILE, (player.y + 0.5) * TILE, TILE / 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // timer overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: ' + Math.ceil(timer), 5, 16);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffd700';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      const msg = win ? 'You escaped!' : 'Game Over';
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(now) {
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
