// Neon Grid Escape – enhanced graphics
// Canvas with id="game" must exist in the HTML page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const cols = 20, rows = 20;
  const cellSize = Math.min(canvas.width, canvas.height) / Math.max(cols, rows);
  // Grid walls: true = wall, false = empty
  let walls = Array.from({ length: rows }, () => Array(cols).fill(false));
  // Randomly fill initial walls (20% density)
  walls.forEach(row => row.forEach((_, i) => { if (Math.random() < 0.2) row[i] = true; }));
  // Player state
  let player = { x: Math.floor(cols/2), y: Math.floor(rows/2) };
  // Ensure starting cell is free
  walls[player.y][player.x] = false;
  // Energy node
  let node = spawnNode();
  // Timer (seconds)
  let time = 30;
  let lastTick = performance.now();
  let wallShiftInterval = 2000; // ms
  let lastShift = performance.now();
  // Input handling
  const dir = { ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0] };
  let audioUnlocked = false;
  window.addEventListener('keydown', e => {
    if (!dir[e.key]) return;
    // Unlock audio on first interaction
    if (!audioUnlocked && audioCtx.state === 'suspended') { audioCtx.resume(); audioUnlocked = true; }
    const [dx,dy] = dir[e.key];
    const nx = player.x + dx, ny = player.y + dy;
    if (nx<0||nx>=cols||ny<0||ny>=rows) return;
    if (walls[ny][nx]) { playTone(150, 0.3); gameOver(); return; }
    player.x = nx; player.y = ny;
    // collect node
    if (player.x===node.x && player.y===node.y) {
        time += 5; // extend timer
        playTone(600, 0.2); // node collection sound
        node = spawnNode();
      }
  });
  function spawnNode(){
    let empty = [];
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(!walls[y][x] && !(x===player.x && y===player.y)) empty.push({x,y});
    return empty[Math.floor(Math.random()*empty.length)];
  }
  function shiftWalls(){
    // shift each row left and insert new random column on right
    for(let y=0;y<rows;y++){
      walls[y].shift();
      walls[y].push(Math.random()<0.2);
    }
    // if player now inside wall -> game over
    if(walls[player.y][player.x]) gameOver();
  }
  function gameOver(){
    cancelAnimationFrame(rAF);
    playTone(120,0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff5555';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
  function draw(){
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // subtle grid lines
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    for(let i=0;i<=cols;i++){
      ctx.beginPath();
      ctx.moveTo(i*cellSize,0);
      ctx.lineTo(i*cellSize,canvas.height);
      ctx.stroke();
    }
    for(let i=0;i<=rows;i++){
      ctx.beginPath();
      ctx.moveTo(0,i*cellSize);
      ctx.lineTo(canvas.width,i*cellSize);
      ctx.stroke();
    }
    // draw walls with neon glow
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++) if(walls[y][x]){
      ctx.fillRect(x*cellSize, y*cellSize, cellSize, cellSize);
    }
    ctx.shadowBlur = 0;
    // draw pulsating energy node
    const pulse = 0.8 + 0.2*Math.sin(performance.now()/200);
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.arc(node.x*cellSize+cellSize/2, node.y*cellSize+cellSize/2, cellSize*0.3*pulse,0,2*Math.PI);
    ctx.fill();
    // draw player with stronger glow
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(player.x*cellSize+cellSize/2, player.y*cellSize+cellSize/2, cellSize*0.35,0,2*Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
    // draw timer in neon cyan
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    ctx.fillText(`Time: ${Math.ceil(time)}`, 10, 20);
  }
  let rAF;
  function loop(now){
    const dt = (now - lastTick)/1000; // seconds
    lastTick = now;
    time -= dt;
    if(time<=0){ gameOver(); return; }
    if(now - lastShift >= wallShiftInterval){ shiftWalls(); lastShift = now; }
    draw();
    rAF = requestAnimationFrame(loop);
  }
  rAF = requestAnimationFrame(loop);
})();
