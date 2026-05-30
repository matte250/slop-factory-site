// Minimal infinite runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  };
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 300;
  const laneCount = 3;
  const laneHeight = H / laneCount;
  const playerSize = 20;
  const player = { lane: 1, x: 50, y: 0, w: playerSize, h: playerSize };
  const obstacles = [];
  const orbs = [];
  let speed = 3;
  let slowdown = 0;
  let score = 0;
  let frames = 0;

  // input
  document.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by browsers)
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if(e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
    else if(e.key === 'ArrowRight' && player.lane < laneCount-1) player.lane++;
  });

  function spawnObstacle(){
    const lane = Math.floor(Math.random()*laneCount);
    const size = 30;
    obstacles.push({x:W, y: lane*laneHeight + (laneHeight-size)/2, w:size, h:size});
  }
  function spawnOrb(){
    const lane = Math.floor(Math.random()*laneCount);
    const size = 12;
    orbs.push({x:W, y: lane*laneHeight + (laneHeight-size)/2, w:size, h:size, collected:false});
  }

  function update(){
    frames++;
    // player position
    player.y = player.lane*laneHeight + (laneHeight-player.h)/2;
    // spawn patterns
    if(frames % 90 === 0) spawnObstacle();
    if(frames % 300 === 0) spawnOrb();
    // move objects
    const curSpeed = slowdown>0 ? speed/2 : speed;
    obstacles.forEach(o=> o.x -= curSpeed);
    orbs.forEach(o=> o.x -= curSpeed);
    // remove off‑screen
    while(obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while(orbs.length && orbs[0].x + orbs[0].w < 0) orbs.shift();
    // collisions
    for(let i=0;i<obstacles.length;i++){
      const o = obstacles[i];
        if(o.x < player.x+player.w && o.x+o.w > player.x && o.y < player.y+player.h && o.y+o.h > player.y){
        // game over sound
        playTone(80, 300); // low tone
        setTimeout(()=>{ alert('Game Over! Score: '+score); document.location.reload(); }, 300);
        return;
        }
    }
    for(let i=0;i<orbs.length;i++){
      const orb = orbs[i];
        if(!orb.collected && orb.x < player.x+player.w && orb.x+orb.w > player.x && orb.y < player.y+player.h && orb.y+orb.h > player.y){
          // collect sound
          playTone(440, 150); // higher tone
          orb.collected = true;
          score += 10;
          slowdown = 180; // frames of slowdown (~3s at 60fps)
          orbs.splice(i,1);
          i--;
        }
    }
    if(slowdown>0) slowdown--;
    // render
    ctx.clearRect(0,0,W,H);
    // Draw neon‑styled background
    // Gradient background
    const bgGrad = ctx.createLinearGradient(0,0,W, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // Lane lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 2;
    for(let i=1;i<laneCount;i++){
      const y = i*laneHeight;
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(W,y);
      ctx.stroke();
    }
    // player – neon glow
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.restore();
    // obstacles
    ctx.fillStyle = '#f00';
    obstacles.forEach(o=> ctx.fillRect(o.x, o.y, o.w, o.h));
    // orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(o=> ctx.fillRect(o.x, o.y, o.w, o.h));
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    requestAnimationFrame(update);
  }
  update();
})();
