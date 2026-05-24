// Minimal endless‑runner with enhanced graphics and sound
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  // Adjust for high‑DPI screens
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 300;
  const H = canvas.clientHeight || 150;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type='sine', duration=0.1){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playMove(){ playTone(400, 'triangle', 0.08); }
  function playCollision(){ playTone(100, 'sawtooth', 0.3); }
  function playBackground(){
    // simple continuous low drone
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 60;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 1);
    osc.start();
    // store for later stop
    return {osc, gain};
  }
  const bg = playBackground();

  // lanes (three equally spaced)
  const laneCount = 3;
  const laneWidth = W / laneCount;
  const playerSize = 20;
  let playerLane = 1; // 0:left,1:center,2:right
  const playerY = H - playerSize - 10;

  // blocks
  const blocks = [];
  const blockSize = 20;
  const blockSpeed = 2; // pixels per frame
  const spawnInterval = 800; // ms
  let lastSpawn = 0;

  let startTime = null;
  const maxTime = 120000; // 2 minutes
  let score = 0;
  let running = true;

  function spawnBlock(){
    const lane = Math.floor(Math.random()*laneCount);
    blocks.push({lane, y: -blockSize});
  }

  function update(dt){
    if(!running) return;
    const now = performance.now();
    if(!startTime) startTime = now;
    const elapsed = now - startTime;
    if(elapsed >= maxTime){ running = false; playCollision(); alert('Time up! Score: '+Math.floor(score)); return; }
    // spawn
    if(now - lastSpawn > spawnInterval){
      spawnBlock();
      lastSpawn = now;
    }
    // move blocks
    for(let i=blocks.length-1;i>=0;i--){
      const b = blocks[i];
      b.y += blockSpeed;
      // collision
      const px = laneWidth*playerLane + laneWidth/2 - playerSize/2;
      const py = playerY;
      if(b.lane===playerLane && b.y+blockSize>py && b.y<py+playerSize){
        running = false;
        playCollision();
        alert('Game Over! Score: '+Math.floor(score));
        return;
      }
      // remove off‑screen
      if(b.y>H) blocks.splice(i,1);
    }
    // score based on distance (time)
    score = elapsed/10; // arbitrary scaling
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,W,H);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // neon glow settings
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 8;
    // draw grid lines
    ctx.strokeStyle = 'rgba(0,255,255,0.3)';
    ctx.lineWidth = 2;
    for(let i=1;i<laneCount;i++){
      ctx.beginPath();
      ctx.moveTo(i*laneWidth,0);
      ctx.lineTo(i*laneWidth,H);
      ctx.stroke();
    }
    // draw player with glow
    ctx.fillStyle = '#0ff';
    const px = laneWidth*playerLane + laneWidth/2 - playerSize/2;
    ctx.fillRect(px, playerY, playerSize, playerSize);
    // draw blocks with glow
    ctx.fillStyle = '#f0f';
    blocks.forEach(b=>{
      const x = laneWidth*b.lane + laneWidth/2 - blockSize/2;
      ctx.fillRect(x, b.y, blockSize, blockSize);
    });
    // draw score
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Score: '+Math.floor(score),10,20);
  }

  function loop(timestamp){
    if(running){
      const dt = timestamp - (lastRender||timestamp);
      update(dt);
      draw();
      lastRender = timestamp;
      requestAnimationFrame(loop);
    }
  }
  // lane change on click/tap
  canvas.addEventListener('click',()=>{
    if(!running) return;
    // resume audio context if needed
    if(audioCtx.state === 'suspended') audioCtx.resume();
    playerLane = (playerLane + 1) % laneCount;
    playMove();
  });
  // start loop
  requestAnimationFrame(loop);
})();
