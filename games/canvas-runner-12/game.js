// Minimal endless runner for canvas with id "game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;
  const GRAVITY = 0.6, JUMP = -12, SPEED = 4;
  let score = 0;
  const player = {x:50, y:H-30, w:20, h:20, vy:0, onGround:true};
  const groundY = H-10;
  const obstacles = [];
  let frame = 0;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump(){ audioCtx.resume().then(()=>beep(440,0.1)); }
  function playGameOver(){ audioCtx.resume().then(()=>beep(200,0.3)); }
  // end audio setup

  function spawnObstacle(){
    const size = 20 + Math.random()*20;
    obstacles.push({x:W, y:groundY-size, w:size, h:size, passed:false});
  }
  function update(){
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y + player.h >= groundY){
      player.y = groundY - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= SPEED;
      // collision
      if(o.x < player.x+player.w && o.x+o.w > player.x &&
         o.y < player.y+player.h && o.y+o.h > player.y){
        gameOver();
        return;
      }
      if(!o.passed && o.x+o.w < player.x){
        o.passed = true; score++;
      }
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
    // spawn new obstacles
    if(frame % 120 === 0) spawnObstacle();
    frame++;
  }
  function draw(){
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#87CEEB');
    skyGrad.addColorStop(1, '#fff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H);
    // ground with simple texture
    ctx.fillStyle = '#654321';
    ctx.fillRect(0,groundY,W,10);
    // player – draw as a circle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.arc(player.x+player.w/2, player.y+player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    // obstacles – draw as triangles (spikes)
    ctx.fillStyle = '#f00';
    obstacles.forEach(o=>{
      ctx.beginPath();
      ctx.moveTo(o.x, groundY);
      ctx.lineTo(o.x+o.w/2, o.y);
      ctx.lineTo(o.x+o.w, groundY);
      ctx.closePath();
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
  }
  let running = true;
  function loop(){
    if(!running) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }
  function gameOver(){
    running = false;
    playGameOver();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over',W/2-60,H/2);
    ctx.fillText('Score: '+score,W/2-60,H/2+30);
  }
  // input
  function jump(){
    if(player.onGround){ player.vy = JUMP; player.onGround = false; playJump(); }
  }
  window.addEventListener('keydown',e=>{ if(e.code==='Space') jump(); });
  canvas.addEventListener('pointerdown',jump);
  // start
  loop();
})();
