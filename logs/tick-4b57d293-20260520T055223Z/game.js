// Minimal Pixel Escape implementation
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // soft attack
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  const tileSize = 32;
  const cols = Math.floor(canvas.width / tileSize);
  const rows = Math.floor(canvas.height / tileSize);

  // Simple random maze generation (binary tree algorithm)
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0)); // 0 empty, 1 wall
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        grid[y][x] = 1; // border walls
      } else if (Math.random() < 0.2) {
        grid[y][x] = 1; // random interior walls
      }
    }
  }

  const player = { x: 1, y: 1, color: '#0f0' };
  const exit = { x: cols - 2, y: rows - 2, color: '#ff0' };
  const trap = { x: Math.floor(cols / 2), y: Math.floor(rows / 2), dir: 1, range: 3, color: '#f00' };

  // timer (seconds)
  let timeLeft = 30;
  const timerEl = document.createElement('div');
  timerEl.style.position = 'absolute';
  timerEl.style.top = '10px';
  timerEl.style.left = '10px';
  timerEl.style.color = 'white';
  timerEl.style.font = '16px monospace';
  document.body.appendChild(timerEl);

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    audioCtx.resume(); // unlock audio on first interaction
    keys[e.key] = true;
    // play a short move cue
    beep(300, 0.07);
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // move player
    const speed = 5 * dt; // tiles per second
    let nx = player.x, ny = player.y;
    if (keys.ArrowUp) ny -= speed;
    if (keys.ArrowDown) ny += speed;
    if (keys.ArrowLeft) nx -= speed;
    if (keys.ArrowRight) nx += speed;
    // snap to nearest tile if not colliding
    const tx = Math.round(nx), ty = Math.round(ny);
    if (grid[ty] && grid[ty][tx] === 0) {
      player.x = tx; player.y = ty;
    }

    // move trap back‑and‑forth horizontally
    trap.x += trap.dir * speed;
    if (trap.x < trap.range || trap.x > cols - trap.range - 1) trap.dir *= -1;
    trap.x = Math.round(trap.x);

    // check collisions
    if (player.x === trap.x && player.y === trap.y) gameOver('Hit trap');
    if (player.x === exit.x && player.y === exit.y) gameWin();
  }

  function draw(elapsed) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw grid walls with a subtle pattern
    const wallPatternCanvas = document.createElement('canvas');
    wallPatternCanvas.width = wallPatternCanvas.height = 8;
    const wpCtx = wallPatternCanvas.getContext('2d');
    wpCtx.fillStyle = '#555';
    wpCtx.fillRect(0, 0, 8, 8);
    wpCtx.strokeStyle = '#333';
    wpCtx.beginPath();
    wpCtx.moveTo(0, 0);
    wpCtx.lineTo(8, 8);
    wpCtx.moveTo(8, 0);
    wpCtx.lineTo(0, 8);
    wpCtx.stroke();
    const wallPattern = ctx.createPattern(wallPatternCanvas, 'repeat');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === 1) {
          ctx.fillStyle = wallPattern;
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // draw exit with a pulsing glow
    const gradient = ctx.createRadialGradient(
      (exit.x + 0.5) * tileSize,
      (exit.y + 0.5) * tileSize,
      tileSize * 0.2,
      (exit.x + 0.5) * tileSize,
      (exit.y + 0.5) * tileSize,
      tileSize * 0.6
    );
    gradient.addColorStop(0, '#fff700');
    gradient.addColorStop(1, '#ff8c00');
    ctx.fillStyle = gradient;
    ctx.fillRect(exit.x * tileSize, exit.y * tileSize, tileSize, tileSize);

    // draw trap as a red spike triangle
    ctx.fillStyle = trap.color;
    ctx.beginPath();
    ctx.moveTo(trap.x * tileSize + tileSize / 2, trap.y * tileSize);
    ctx.lineTo(trap.x * tileSize, trap.y * tileSize + tileSize);
    ctx.lineTo(trap.x * tileSize + tileSize, trap.y * tileSize + tileSize);
    ctx.closePath();
    ctx.fill();

    // draw player as a glowing circle
    ctx.save();
    ctx.shadowColor = player.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(
      player.x * tileSize + tileSize / 2,
      player.y * tileSize + tileSize / 2,
      tileSize * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  let last = 0;
  let elapsed = 0;
  function loop(timestamp) {
    const dt = (timestamp - last) / 1000;
    last = timestamp;
    elapsed += dt;
    update(dt);
    draw(elapsed);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // countdown timer
  const timerId = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}`;
    if (timeLeft <= 0) gameOver('Time up');
  }, 1000);

  function gameOver(msg) {
    clearInterval(timerId);
    // Play different beep depending on cause
    if (msg === 'Hit trap') {
      beep(150, 0.2);
    } else {
      beep(100, 0.3);
    }
    alert(`Game Over: ${msg}`);
    reset();
  }
  function gameWin() {
    clearInterval(timerId);
    alert('You escaped!');
    reset();
  }
  function reset() {
    // reload page to restart simple implementation
    location.reload();
  }
})();
