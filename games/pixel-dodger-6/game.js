// Minimal Pixel Dodger game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const player = {w:20, h:20, x: width/2-10, y: height-30, speed:0, maxSpeed:4};
  const blocks = [];
// simple particle system for visual flair
const particles = [];
  let score = 0;
  let lastSpawn = 0;
  const spawnInterval = 800; // ms
  const blockSpeed = 2;
  const keys = {};
  // Input handling
  window.addEventListener('keydown', e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.left=true; if(e.key==='ArrowRight'||e.key==='d') keys.right=true; });
  window.addEventListener('keyup', e=>{ if(e.key==='ArrowLeft'||e.key==='a') keys.left=false; if(e.key==='ArrowRight'||e.key==='d') keys.right=false; });
  function update(dt){
    // player movement
    if(keys.left) player.speed = -player.maxSpeed;
    else if(keys.right) player.speed = player.maxSpeed;
    else player.speed = 0;
    player.x += player.speed;
    if(player.x<0) player.x=0;
    if(player.x+player.w>width) player.x=width-player.w;
    // spawn blocks
    if(Date.now()-lastSpawn>spawnInterval){
      const blockX = Math.random()*(width-20);
      const newBlock = {x:blockX, y:-20, w:20, h:20};
      blocks.push(newBlock);
      // particle burst at spawn
      particles.push({x:blockX+10, y:-20, size:4, alpha:1, vy:0.8});
      // play spawn sound
      playTone(300, 80);
      lastSpawn=Date.now();
    }
    // move blocks
    for(let i=blocks.length-1;i>=0;i--){
      const b=blocks[i];
      b.y+=blockSpeed;
      // collision
        if(b.x < player.x+player.w && b.x+b.w > player.x && b.y < player.y+player.h && b.y+b.h > player.y){
          // Game over - play sound
          playTone(100, 300);
          alert('Game Over! Score: '+Math.floor(score/1000));
          document.location.reload();
          return;
        }
      // remove off-screen
      if(b.y>height) blocks.splice(i,1);
    }
    score+=dt;
  }
function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,width,height);
  bgGrad.addColorStop(0,"#e0f7fa");
  bgGrad.addColorStop(1,"#80deea");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,width,height);

  // player (rounded rectangle)
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  const radius = 4;
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.w - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
  ctx.lineTo(player.x + player.w, player.y + player.h - radius);
  ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
  ctx.lineTo(player.x + radius, player.y + player.h);
  ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();

  // blocks (with shadow)
  ctx.fillStyle = '#d32f2f';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  blocks.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));
  ctx.shadowColor = 'transparent';

  // particles
  particles.forEach(p=>{
    ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });

  // score
  ctx.fillStyle='black';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+Math.floor(score/1000),10,20);
}
  let lastTime=performance.now();
  function loop(now){
    const dt=now-lastTime;
    lastTime=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
