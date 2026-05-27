// Simple top‑down maze game
// Canvas with id="game" must exist in the HTML.

window.addEventListener('load', () => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio context for simple sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSound(event) {
    switch (event) {
      case 'lose':
        playTone(200, 0.4);
        break;
      case 'win':
        playTone(600, 0.6);
        break;
      case 'timeup':
        playTone(100, 0.5);
        break;
      default:
        break;
    }
  }
  const width = canvas.width;
  const height = canvas.height;
  const rows = 30;
  const cols = 30;
  const cellW = width / cols;
  const cellH = height / rows;

  // generate simple random maze
  const maze = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() < 0.3 ? 1 : 0))
  );
  maze[0][0] = 0; // start
  maze[rows - 1][cols - 1] = 0; // exit

  const player = { x: cellW / 2, y: cellH / 2, r: Math.min(cellW, cellH) * 0.4 };
  const exit = { col: cols - 1, row: rows - 1 };
  const speed = 150; // pixels per second
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

  let remaining = 60; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  function draw() {
    // background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    // background already filled
    // draw walls with slight shading
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (maze[r][c]) {
          const x = c * cellW, y = r * cellH;
          ctx.fillRect(x, y, cellW, cellH);
          ctx.strokeRect(x, y, cellW, cellH);
        }
      }
    }
    // draw exit with glow
    const exX = exit.col * cellW, exY = exit.row * cellH;
    const exitGrad = ctx.createRadialGradient(exX + cellW/2, exY + cellH/2, cellW*0.1, exX + cellW/2, exY + cellH/2, cellW*0.6);
    exitGrad.addColorStop(0, '#8f8');
    exitGrad.addColorStop(1, '#060');
    ctx.fillStyle = exitGrad;
    ctx.fillRect(exX, exY, cellW, cellH);
    // outline
    ctx.strokeStyle = '#3c3';
    ctx.lineWidth = 2;
    ctx.strokeRect(exX, exY, cellW, cellH);
    // draw player with gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    const grad = ctx.createRadialGradient(player.x, player.y, player.r * 0.2, player.x, player.y, player.r);
    grad.addColorStop(0, '#6cf');
    grad.addColorStop(1, '#036');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // timer
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${Math.ceil(remaining)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(gameOver, width / 2, height / 2);
    }
  }

  function update(dt) {
    if (gameOver) return;
    // move player
    const delta = dt / 1000;
    if (keys.ArrowUp) player.y -= speed * delta;
    if (keys.ArrowDown) player.y += speed * delta;
    if (keys.ArrowLeft) player.x -= speed * delta;
    if (keys.ArrowRight) player.x += speed * delta;
    // keep inside bounds
    player.x = Math.max(player.r, Math.min(width - player.r, player.x));
    player.y = Math.max(player.r, Math.min(height - player.r, player.y));
    // collision with walls
    const col = Math.floor(player.x / cellW);
    const row = Math.floor(player.y / cellH);
    if (maze[row][col]) {
      gameOver = 'Game Over'; playSound('lose');
    }
    // check exit
    if (col === exit.col && row === exit.row) {
      gameOver = 'You Win!'; playSound('win');
    }
    // timer
    remaining -= dt / 1000;
    if (remaining <= 0) {
      remaining = 0;
      gameOver = 'Time Up'; playSound('timeup');
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // key handling
  window.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  requestAnimationFrame(loop);
});
