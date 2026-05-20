// Simple Canvas Escape game based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + dur / 1000);
  };
  const playSound = (type) => {
    switch(type) {
      case 'move': playTone(200, 50); break;
      case 'key': playTone(500, 200); break;
      case 'win': playTone(800, 500); break;
      case 'lose': playTone(150, 500); break;
    }
  };
  const TILE = 32;
  const COLS = 15, ROWS = 10;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  // 0=empty,1=wall,2=key,3=exit,4=spike
  const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,1,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1,0,0,1,0,1],
    [1,0,1,0,1,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,1,2,1,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,4,0,0,0,0,3,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
  ];

  let player = {x:1, y:1};
  let hasKey = false;
  let timeLeft = 60; // seconds
  let gameOver = false;

  const draw = () => {
    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Grid cells
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = map[y][x];
        const cx = x * TILE;
        const cy = y * TILE;
        // Wall with subtle shading
        if (cell === 1) {
          ctx.fillStyle = '#444';
          ctx.fillRect(cx, cy, TILE, TILE);
          ctx.strokeStyle = '#888';
          ctx.strokeRect(cx, cy, TILE, TILE);
        }
        // Key as a small star
        else if (cell === 2) {
          ctx.fillStyle = 'gold';
          ctx.beginPath();
          const r = TILE / 6;
          const cxMid = cx + TILE / 2;
          const cyMid = cy + TILE / 2;
          // Move to first point of star
          const startAngle = -Math.PI / 2;
          ctx.moveTo(
            cxMid + r * Math.cos(startAngle),
            cyMid + r * Math.sin(startAngle)
          );
          for (let i = 1; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            const xPos = cxMid + r * Math.cos(angle);
            const yPos = cyMid + r * Math.sin(angle);
            ctx.lineTo(xPos, yPos);
          }
          ctx.closePath();
          ctx.fill();
        }
        // Exit as a cyan gradient portal
        else if (cell === 3) {
          const grad = ctx.createRadialGradient(cx + TILE / 2, cy + TILE / 2, TILE / 4, cx + TILE / 2, cy + TILE / 2, TILE / 2);
          grad.addColorStop(0, '#00f');
          grad.addColorStop(1, '#005');
          ctx.fillStyle = grad;
          ctx.fillRect(cx, cy, TILE, TILE);
        }
        // Spike as a red triangle
        else if (cell === 4) {
          ctx.fillStyle = 'red';
          ctx.beginPath();
          ctx.moveTo(cx + TILE / 2, cy + 8);
          ctx.lineTo(cx + 8, cy + TILE - 8);
          ctx.lineTo(cx + TILE - 8, cy + TILE - 8);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
    // Player with glow
    ctx.save();
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.arc(player.x * TILE + TILE / 2, player.y * TILE + TILE / 2, TILE / 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    // Timer text
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${timeLeft}s`, 10, canvas.height - 10);
    if (hasKey) {
      ctx.fillText('Key', canvas.width - 60, canvas.height - 10);
    }
  };

  const move = (dx,dy)=>{ playSound('move');
    if (gameOver) return;
    const nx = player.x+dx, ny = player.y+dy;
    if (nx<0||ny<0||nx>=COLS||ny>=ROWS) return;
    const cell = map[ny][nx];
    if (cell===1) return; // wall
    player.x = nx; player.y = ny;
    if (cell===2) {hasKey=true; map[ny][nx]=0; playSound('key');}
    if (cell===4) { playSound('lose'); endGame('Lost: hit a spike'); }
    if (cell===3) {
      if (hasKey) { playSound('win'); endGame('Won!'); }
      else { playSound('lose'); endGame('Lost: need key'); }
    }
  };

  const endGame = (msg)=>{gameOver=true; alert(msg);};

  document.addEventListener('keydown', e=>{
    switch(e.key){
      case 'ArrowUp': case 'w': move(0,-1); break;
      case 'ArrowDown': case 's': move(0,1); break;
      case 'ArrowLeft': case 'a': move(-1,0); break;
      case 'ArrowRight': case 'd': move(1,0); break;
    }
  });

  const tick = () => {
    if (!gameOver) {
      draw();
      requestAnimationFrame(tick);
    }
  };
  tick();

  // countdown timer
  const timer = setInterval(()=>{
    if (gameOver) {clearInterval(timer); return;}
    timeLeft--;
    if (timeLeft<=0) {endGame('Lost: time ran out'); clearInterval(timer);}
  },1000);
})();
