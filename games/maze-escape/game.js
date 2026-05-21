// Minimal Maze Escape game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const cols = 20, rows = 15, cellSize = 30;
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  // ---------- Maze generation (simple recursive backtracker) ----------
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const dirs = [
    { dx: 0, dy: -1, bit: 1 }, // N
    { dx: 1, dy: 0, bit: 2 }, // E
    { dx: 0, dy: 1, bit: 4 }, // S
    { dx: -1, dy: 0, bit: 8 } // W
  ];
  const opposite = {1:4,2:8,4:1,8:2};
  function carve(x, y) {
    visited[y][x] = true;
    const shuffled = dirs.sort(() => Math.random() - 0.5);
    for (const {dx, dy, bit} of shuffled) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || visited[ny][nx]) continue;
      grid[y][x] |= bit;
      grid[ny][nx] |= opposite[bit];
      carve(nx, ny);
    }
  }
  carve(0,0);

  // ---------- Game entities ----------
  const player = {x:0, y:0, color:'blue'};
  const stars = [];
  const enemies = [];
  const starCount = 5, enemyCount = 3;
  // Sound assets (embedded as data URIs)
  const collectSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAB//8AAAD//wAAAP//AAD//wAA//8AAP//AAD//wAA');
  const winSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAB//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA');
  const loseSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YYQAAAB//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA');
  function placeEntities() {
    // place stars in random cells not occupied by player
    while (stars.length < starCount) {
      const sx = Math.floor(Math.random()*cols);
      const sy = Math.floor(Math.random()*rows);
      if ((sx===player.x && sy===player.y) || stars.some(s=>s.x===sx && s.y===sy)) continue;
      stars.push({x:sx, y:sy, collected:false});
    }
    // place enemies
    while (enemies.length < enemyCount) {
      const ex = Math.floor(Math.random()*cols);
      const ey = Math.floor(Math.random()*rows);
      if ((ex===player.x && ey===player.y) || stars.some(s=>s.x===ex && s.y===ey) || enemies.some(e=>e.x===ex && e.y===ey)) continue;
      enemies.push({x:ex, y:ey, dir:Math.floor(Math.random()*4)});
    }
  }
  placeEntities();

  // ---------- Input ----------
  const keyMap = { ArrowUp:0, ArrowRight:1, ArrowDown:2, ArrowLeft:3 };
  window.addEventListener('keydown', e=>{
    const d = keyMap[e.key];
    if (d===undefined) return;
    const {dx,dy,bit}=dirs[d];
    const nx=player.x+dx, ny=player.y+dy;
    if (nx<0||nx>=cols||ny<0||ny>=rows) return;
    // check wall in current cell
    if ((grid[player.y][player.x] & bit)===0) return; // wall blocks
    player.x=nx; player.y=ny;
    // star collection
    const star = stars.find(s=>s.x===nx && s.y===ny && !s.collected);
    if (star) {
      star.collected=true;
      collectSound.currentTime=0;
      collectSound.play();
    }
  });

  // ---------- Enemy movement ----------
  function moveEnemies() {
    enemies.forEach(e=>{
      // try to move forward; if blocked, pick random new direction
      const {dx,dy,bit}=dirs[e.dir];
      const nx=e.x+dx, ny=e.y+dy;
      if (nx>=0 && nx<cols && ny>=0 && ny<rows && (grid[e.y][e.x] & bit)) {
        e.x=nx; e.y=ny;
      } else {
        e.dir=Math.floor(Math.random()*4);
      }
    });
  }

  // ---------- Timer ----------
  let timeLeft = 60; // seconds
  const timerInterval = setInterval(()=>{
    timeLeft--;
    if (timeLeft<=0) endGame(false);
  },1000);

  // ---------- Rendering ----------
  function drawMaze() {
    // Fill background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw walls with darker gray and thicker lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = grid[y][x];
        const px = x * cellSize, py = y * cellSize;
        // North wall
        if ((cell & 1) === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + cellSize, py);
          ctx.stroke();
        }
        // West wall
        if ((cell & 8) === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py + cellSize);
          ctx.stroke();
        }
        // South border (last row)
        if (y === rows - 1 && (cell & 4) === 0) {
          ctx.beginPath();
          ctx.moveTo(px, py + cellSize);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }
        // East border (last column)
        if (x === cols - 1 && (cell & 2) === 0) {
          ctx.beginPath();
          ctx.moveTo(px + cellSize, py);
          ctx.lineTo(px + cellSize, py + cellSize);
          ctx.stroke();
        }
      }
    }
  }
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawMaze();
    // stars (sparkle)
    stars.forEach(s=>{
      if (s.collected) return;
      const cx = s.x*cellSize + cellSize/2;
      const cy = s.y*cellSize + cellSize/2;
      const radius = cellSize/6;
      // simple 5‑point star
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    });
    // enemies (glowing circles with eyes)
    enemies.forEach(e=>{
      const ex = e.x * cellSize + cellSize / 2;
      const ey = e.y * cellSize + cellSize / 2;
      const rad = cellSize * 0.3;
      // radial gradient for glow
      const grad = ctx.createRadialGradient(ex, ey, rad * 0.2, ex, ey, rad);
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ex, ey, rad, 0, 2 * Math.PI);
      ctx.fill();
      // eyes
      ctx.fillStyle = 'white';
      const eyeOffset = rad * 0.4;
      const eyeRadius = rad * 0.2;
      ctx.beginPath();
      ctx.arc(ex - eyeOffset, ey - eyeOffset, eyeRadius, 0, 2 * Math.PI);
      ctx.arc(ex + eyeOffset, ey - eyeOffset, eyeRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = 'black';
      const pupilRadius = eyeRadius * 0.5;
      ctx.beginPath();
      ctx.arc(ex - eyeOffset, ey - eyeOffset, pupilRadius, 0, 2 * Math.PI);
      ctx.arc(ex + eyeOffset, ey - eyeOffset, pupilRadius, 0, 2 * Math.PI);
      ctx.fill();
    });
    // player (glowing aura)
    const px = player.x * cellSize + cellSize / 2;
    const py = player.y * cellSize + cellSize / 2;
    const pr = cellSize * 0.35;
    // outer glow
    const glow = ctx.createRadialGradient(px, py, pr * 0.2, px, py, pr);
    glow.addColorStop(0, 'rgba(0, 150, 255, 0.7)');
    glow.addColorStop(1, 'rgba(0, 50, 200, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, 2 * Math.PI);
    ctx.fill();
    // inner core
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    // HUD
    ctx.fillStyle='black';
    ctx.font='16px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`,10,20);
    const score = stars.filter(s=>s.collected).length;
    ctx.fillText(`Score: ${score}/${starCount}`,10,40);
  }
  function checkCollisions(){
    if (enemies.some(e=>e.x===player.x && e.y===player.y)) endGame(false);
    if (stars.every(s=>s.collected)) endGame(true);
  }
  function endGame(win){
    clearInterval(timerInterval);
    cancelAnimationFrame(animId);
    // Play ending sound
    if (win) {
      winSound.play();
    } else {
      loseSound.play();
    }
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='white';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(win? 'You Win!' : 'Game Over', canvas.width/2, canvas.height/2);
  }

  // ---------- Game loop ----------
  let lastEnemyMove=0;
  let animId;
  function loop(timestamp){
    if (!lastEnemyMove) lastEnemyMove=timestamp;
    if (timestamp-lastEnemyMove>800) { // move enemies every 800ms
      moveEnemies();
      lastEnemyMove=timestamp;
    }
    draw();
    checkCollisions();
    animId=requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
