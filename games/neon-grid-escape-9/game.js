// Neon Grid Escape – enhanced neon graphics
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  // Background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgGain.gain.value = 0.015;
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur / 1000);
    osc.start(now);
    osc.stop(now + dur / 1000);
  }
  function playJump(){ playTone(400,150); }
  function playCrash(){ playTone(80,400); }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 600;

  // Player
  const player = {w:20, h:20, x:W/2-10, y:H-40, vy:0, onGround:true};
  const GRAVITY = 0.5, JUMP = -10, MOVE = 5;

  // Obstacles – vertical scrolling
  const obstacles = [];
  let lastSpawn = 0, spawnInterval = 1500; // ms
  let start = null, speed = 2, gameOver = false, gridOffset = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
  keys[e.key]=true;
  if (!audioStarted) { audioCtx.resume(); audioStarted = true; bgGain.gain.setValueAtTime(0.015, audioCtx.currentTime); }
});
  window.addEventListener('keyup', e => {keys[e.key]=false;});

  function spawnObstacle() {
    // Create a row of blocks with a gap
    const gapWidth = 80;
    const gapPos = Math.random() * (W - gapWidth);
    // left block
    if (gapPos>0) obstacles.push({x:0, y:-30, w:gapPos, h:30});
    // right block
    const rightW = W - gapPos - gapWidth;
    if (rightW>0) obstacles.push({x:gapPos+gapWidth, y:-30, w:rightW, h:30});
  }

  function update(ts) {
    if (!start) start = ts;
    const dt = ts - (start||ts);
    if (gameOver) {drawGameOver(); return;}
    // speed ramps up
    speed = 2 + (ts - start) / 5000;
    // Input
    if (keys['ArrowLeft']) player.x -= MOVE;
    if (keys['ArrowRight']) player.x += MOVE;
    if ((keys[' '] || keys['ArrowUp']) && player.onGround) {player.vy = JUMP; player.onGround=false; playJump();}
    // Keep player inside canvas
    if (player.x < 0) player.x = 0;
    if (player.x + player.w > W) player.x = W - player.w;
    // Physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if (player.y + player.h >= H) {player.y = H - player.h; player.vy=0; player.onGround=true;}
    // Obstacles movement
    for (let i=0;i<obstacles.length;i++) obstacles[i].y += speed;
    // Remove off‑screen
    while (obstacles.length && obstacles[0].y > H) obstacles.shift();
    // Spawn
    if (ts - lastSpawn > spawnInterval) {spawnObstacle(); lastSpawn = ts;}
    // Collision
    for (const o of obstacles) {
      if (player.x < o.x+o.w && player.x+player.w > o.x &&
          player.y < o.y+o.h && player.y+player.h > o.y) {
        playCrash();
        gameOver = true; break;
      }
    }
    // Render
    // Background
    ctx.fillStyle = '#001';
    ctx.fillRect(0,0,W,H);
    // Neon grid lines
    gridOffset = (gridOffset + speed) % 30;
    ctx.strokeStyle = 'rgba(0,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, -gridOffset);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    // Draw obstacles with neon glow
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f00';
    for (const o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);
    // Draw player with neon glow and gradient
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    const grad = ctx.createRadialGradient(
      player.x + player.w/2, player.y + player.h/2, 5,
      player.x + player.w/2, player.y + player.h/2, player.w/2);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Reset shadow for UI
    ctx.shadowBlur = 0;
    // Score (time survived) with neon text
    ctx.fillStyle = '#0ff';
    ctx.font = '16px monospace';
    const seconds = ((ts-start)/1000).toFixed(1);
    ctx.fillText(`Time: ${seconds}s`,10,20);
    requestAnimationFrame(update);
  }

  function drawGameOver(){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '30px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2);
    ctx.font = '16px monospace';
    const total = ((performance.now()-start)/1000).toFixed(1);
    ctx.fillText(`Survived ${total}s`, W/2, H/2+30);
  }

  requestAnimationFrame(update);
})();
