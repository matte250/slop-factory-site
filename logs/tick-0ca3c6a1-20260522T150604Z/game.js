// Simple Shrink Maze game targeting <canvas id="game">.
// Enhanced graphics: gradients, shadows, twinkling stars, and triangular enemies.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');

  const CONFIG = {
  cols: 20,
  rows: 20,
  cellSize: 30,
  shrinkRate: 0.02, // pixels per frame
  starCount: 5,
  enemyCount: 3,
  playerSpeed: 2,
  enemySpeed: 1,
};

// Load sound effects (tiny base64 wavs)
const sounds = {
  star: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
  lose: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='),
  win: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
};

  let scale = 1;
  let frame = 0;
  const keys = {};

  // generate simple maze: random walls on grid edges
  const maze = [];
  for (let y = 0; y < CONFIG.rows; y++) {
    const row = [];
    for (let x = 0; x < CONFIG.cols; x++) {
      // each cell may have walls on right/bottom
      row.push({
        right: Math.random() < 0.3 && x < CONFIG.cols - 1,
        bottom: Math.random() < 0.3 && y < CONFIG.rows - 1,
      });
    }
    maze.push(row);
  }

  // place player at top‑left open cell
  const player = { x: 0, y: 0, radius: 5 };

  // generate stars in random empty cells
  const stars = [];
  while (stars.length < CONFIG.starCount) {
    const sx = Math.floor(Math.random() * CONFIG.cols);
    const sy = Math.floor(Math.random() * CONFIG.rows);
    if (sx === 0 && sy === 0) continue;
    if (!stars.some(s => s.x === sx && s.y === sy)) {
      stars.push({ x: sx, y: sy, radius: 4, collected: false });
    }
  }

  // generate enemies with simple random walk
  const enemies = [];
  for (let i = 0; i < CONFIG.enemyCount; i++) {
    const ex = Math.floor(Math.random() * CONFIG.cols);
    const ey = Math.floor(Math.random() * CONFIG.rows);
    enemies.push({ x: ex, y: ey, dir: Math.random() * Math.PI * 2 });
  }

  // input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update() {
    // move player
    if (keys['ArrowUp']) player.y -= CONFIG.playerSpeed;
    if (keys['ArrowDown']) player.y += CONFIG.playerSpeed;
    if (keys['ArrowLeft']) player.x -= CONFIG.playerSpeed;
    if (keys['ArrowRight']) player.x += CONFIG.playerSpeed;

    // keep player inside canvas
    const maxX = canvas.width / scale - CONFIG.cellSize;
    const maxY = canvas.height / scale - CONFIG.cellSize;
    player.x = Math.max(0, Math.min(player.x, maxX));
    player.y = Math.max(0, Math.min(player.y, maxY));

    // check star collection
    stars.forEach(s => {
      if (!s.collected && Math.hypot(player.x - s.x * CONFIG.cellSize, player.y - s.y * CONFIG.cellSize) < 10) {
        s.collected = true;
        sounds.star.play();
      }
    });

    // move enemies (simple random direction change)
    enemies.forEach(e => {
      if (Math.random() < 0.02) e.dir = Math.random() * Math.PI * 2;
      e.x += Math.cos(e.dir) * CONFIG.enemySpeed;
      e.y += Math.sin(e.dir) * CONFIG.enemySpeed;
      // bounce off walls
      if (e.x < 0 || e.x > maxX) e.dir = Math.PI - e.dir;
      if (e.y < 0 || e.y > maxY) e.dir = -e.dir;
    });

    // collision with enemies
    for (const e of enemies) {
      if (Math.hypot(player.x - e.x, player.y - e.y) < 10) {
        sounds.lose.play();
        alert('Game Over');
        reset();
        return;
      }
    }

    // shrink maze
    scale = Math.max(0.3, scale - CONFIG.shrinkRate / 100);
    if (scale <= 0.3) {
      sounds.win.play();
      alert('Too small – you survived!');
      reset();
    }

    // increment animation frame counter for twinkling stars
    frame++;
  }

  function draw() {
    ctx.save();
    // clear with background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e3a8a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);

    // shadow settings for all objects
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;

    // draw maze walls with gradient stroke
    const wallGrad = ctx.createLinearGradient(0, 0, CONFIG.cols * CONFIG.cellSize, CONFIG.rows * CONFIG.cellSize);
    wallGrad.addColorStop(0, '#555');
    wallGrad.addColorStop(1, '#111');
    ctx.strokeStyle = wallGrad;
    ctx.lineWidth = 2;
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        const cell = maze[y][x];
        const px = x * CONFIG.cellSize;
        const py = y * CONFIG.cellSize;
        if (cell.right) {
          ctx.beginPath();
          ctx.moveTo(px + CONFIG.cellSize, py);
          ctx.lineTo(px + CONFIG.cellSize, py + CONFIG.cellSize);
          ctx.stroke();
        }
        if (cell.bottom) {
          ctx.beginPath();
          ctx.moveTo(px, py + CONFIG.cellSize);
          ctx.lineTo(px + CONFIG.cellSize, py + CONFIG.cellSize);
          ctx.stroke();
        }
      }
    }

    // draw twinkling stars
    stars.forEach((s, i) => {
      if (s.collected) return;
      const alpha = 0.6 + 0.4 * Math.sin(frame * 0.1 + i);
      ctx.globalAlpha = alpha;
      const starGrad = ctx.createRadialGradient(
        s.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        s.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        0,
        s.x * CONFIG.cellSize + CONFIG.cellSize / 2,
        s.y * CONFIG.cellSize + CONFIG.cellSize / 2,
        s.radius
      );
      starGrad.addColorStop(0, '#ffec8b');
      starGrad.addColorStop(1, '#b8860b');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x * CONFIG.cellSize + CONFIG.cellSize / 2, s.y * CONFIG.cellSize + CONFIG.cellSize / 2, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset

    // draw enemies as rotating triangles
    enemies.forEach(e => {
      ctx.fillStyle = 'red';
      ctx.beginPath();
      const cx = e.x + CONFIG.cellSize / 4;
      const cy = e.y + CONFIG.cellSize / 4;
      const size = CONFIG.cellSize / 3;
      ctx.moveTo(
        cx + size * Math.cos(e.dir),
        cy + size * Math.sin(e.dir)
      );
      ctx.lineTo(
        cx + size * Math.cos(e.dir + Math.PI * 0.8),
        cy + size * Math.sin(e.dir + Math.PI * 0.8)
      );
      ctx.lineTo(
        cx + size * Math.cos(e.dir - Math.PI * 0.8),
        cy + size * Math.sin(e.dir - Math.PI * 0.8)
      );
      ctx.closePath();
      ctx.fill();
    });

    // draw player with radial gradient
    const playerGrad = ctx.createRadialGradient(
      player.x + CONFIG.cellSize / 2,
      player.y + CONFIG.cellSize / 2,
      0,
      player.x + CONFIG.cellSize / 2,
      player.y + CONFIG.cellSize / 2,
      player.radius * 2
    );
    playerGrad.addColorStop(0, '#4f46e5');
    playerGrad.addColorStop(1, '#1e40af');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + CONFIG.cellSize / 2, player.y + CONFIG.cellSize / 2, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function reset() {
    // simple reset: reload page
    location.reload();
  }

  // set canvas size if not defined
  if (!canvas.width) canvas.width = CONFIG.cols * CONFIG.cellSize;
  if (!canvas.height) canvas.height = CONFIG.rows * CONFIG.cellSize;

  requestAnimationFrame(loop);
})();
