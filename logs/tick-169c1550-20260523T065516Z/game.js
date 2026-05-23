// Canvas Escape game implementation
// Target canvas element with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur / 1000);
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  // background hum (low frequency)
  const humOsc = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  humOsc.frequency.value = 40;
  humOsc.type = 'sine';
  humOsc.connect(humGain);
  humGain.connect(audioCtx.destination);
  humGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  humOsc.start();
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 400;
  const HEIGHT = canvas.height = 400;
  const COLS = 20;
  const ROWS = 20;
  const CELL = WIDTH / COLS;
  const PLAYER_R = 5;
  const SPEED = 2;
  // starfield settings
  const STAR_COUNT = 100;
  const stars = [];
  // initialize starfield
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  // Maze generation (recursive backtracker)
  const cells = [];
  for (let y = 0; y < ROWS; y++) {
    cells[y] = [];
    for (let x = 0; x < COLS; x++) {
      cells[y][x] = { visited: false, walls: [true, true, true, true] }; // top,right,bottom,left
    }
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function carve(x, y) {
    cells[y][x].visited = true;
    const dirs = shuffle([0, 1, 2, 3]); // 0:top 1:right 2:bottom 3:left
    for (const d of dirs) {
      const nx = x + (d === 1 ? 1 : d === 3 ? -1 : 0);
      const ny = y + (d === 2 ? 1 : d === 0 ? -1 : 0);
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if (cells[ny][nx].visited) continue;
      // remove walls between (x,y) and (nx,ny)
      cells[y][x].walls[d] = false;
      cells[ny][nx].walls[(d + 2) % 4] = false;
      carve(nx, ny);
    }
  }
  carve(0, 0);

  // Player & exit
  const player = { x: CELL / 2, y: CELL / 2 };
  const exit = { x: (COLS - 0.5) * CELL, y: (ROWS - 0.5) * CELL };
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  let audioStarted = false;
window.addEventListener('keydown', e => {
  if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
  if (keys.hasOwnProperty(e.key)) keys[e.key] = true;
});
  window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key)) keys[e.key] = false; });

  let timeLeft = 30; // seconds
  const timerId = setInterval(() => { timeLeft--; if (timeLeft <= 0) endGame(false); }, 1000);

  function endGame(win) {
    clearInterval(timerId);
    // stop background hum
    humOsc.stop();
    // play result tone
    playTone(win ? 440 : 150, 400);
    alert(win ? 'You win!' : 'Game over');
    // stop animation loop
    cancelAnimationFrame(animId);
  }

  function movePlayer() {
    let dx = 0, dy = 0;
    if (keys.ArrowUp) dy -= SPEED;
    if (keys.ArrowDown) dy += SPEED;
    if (keys.ArrowLeft) dx -= SPEED;
    if (keys.ArrowRight) dx += SPEED;
    if (dx === 0 && dy === 0) return;
    const newX = player.x + dx;
    const newY = player.y + dy;
    // Determine current cell
    const cellX = Math.floor(player.x / CELL);
    const cellY = Math.floor(player.y / CELL);
    // Check wall collisions per direction
    if (dx < 0 && cells[cellY][cellX].walls[3]) { // left wall
      if (newX - PLAYER_R < cellX * CELL) { playTone(200,150); return; }
    }
    if (dx > 0 && cells[cellY][cellX].walls[1]) { // right wall
      if (newX + PLAYER_R > (cellX + 1) * CELL) return;
    }
    if (dy < 0 && cells[cellY][cellX].walls[0]) { // top wall
      if (newY - PLAYER_R < cellY * CELL) return;
    }
    if (dy > 0 && cells[cellY][cellX].walls[2]) { // bottom wall
      if (newY + PLAYER_R > (cellY + 1) * CELL) return;
    }
    player.x = newX;
    player.y = newY;
  }

  let frameCount = 0;
  function draw() {
    // starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      // slight twinkle
      s.r += (Math.random() - 0.5) * 0.05;
      if (s.r < 0.5) s.r = 0.5;
      if (s.r > 2) s.r = 2;
    }
    // background gradient overlay for depth
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    // draw maze walls with crisp color
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = cells[y][x];
        const px = x * CELL;
        const py = y * CELL;
        ctx.beginPath();
        if (c.walls[0]) ctx.moveTo(px, py), ctx.lineTo(px + CELL, py);
        if (c.walls[1]) ctx.moveTo(px + CELL, py), ctx.lineTo(px + CELL, py + CELL);
        if (c.walls[2]) ctx.moveTo(px + CELL, py + CELL), ctx.lineTo(px, py + CELL);
        if (c.walls[3]) ctx.moveTo(px, py + CELL), ctx.lineTo(px, py);
        ctx.stroke();
      }
    }
    // draw exit portal with pulsing glow
    const pulse = (Math.sin(frameCount * 0.1) + 1) / 2; // 0..1
    const exitGrad = ctx.createRadialGradient(exit.x, exit.y, CELL / 4, exit.x, exit.y, CELL / 2);
    exitGrad.addColorStop(0, `rgba(0,255,0,${0.6 + 0.4 * pulse})`);
    exitGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = exitGrad;
    ctx.beginPath();
    ctx.arc(exit.x, exit.y, CELL / 2, 0, Math.PI * 2);
    ctx.fill();
    // draw player with glow
    const pGrad = ctx.createRadialGradient(player.x, player.y, PLAYER_R, player.x, player.y, PLAYER_R * 4);
    pGrad.addColorStop(0, 'rgba(255,0,0,0.8)');
    pGrad.addColorStop(1, 'rgba(255,0,0,0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    // timer text
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`, 10, HEIGHT - 10);
    frameCount++;
  }
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // draw maze walls
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = cells[y][x];
        const px = x * CELL;
        const py = y * CELL;
        ctx.beginPath();
        if (c.walls[0]) ctx.moveTo(px, py), ctx.lineTo(px + CELL, py); // top
        if (c.walls[1]) ctx.moveTo(px + CELL, py), ctx.lineTo(px + CELL, py + CELL); // right
        if (c.walls[2]) ctx.moveTo(px + CELL, py + CELL), ctx.lineTo(px, py + CELL); // bottom
        if (c.walls[3]) ctx.moveTo(px, py + CELL), ctx.lineTo(px, py); // left
        ctx.stroke();
      }
    }
    // draw exit portal
    ctx.fillStyle = 'green';
    ctx.fillRect(exit.x - CELL / 2, exit.y - CELL / 2, CELL, CELL);
    // draw player
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_R, 0, Math.PI * 2);
    ctx.fill();
    // draw timer
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`, 10, HEIGHT - 10);
  }

  let animId;
  function loop() {
    movePlayer();
    // win check
    if (Math.hypot(player.x - exit.x, player.y - exit.y) < CELL / 2) {
      endGame(true);
      return;
    }
    draw();
    animId = requestAnimationFrame(loop);
  }
  loop();
})();
