// Endless runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id="game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 200;
  // helper to draw rounded rectangles
  function drawRoundedRect(x,y,w,h,r,style){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fillStyle = style;
    ctx.fill();
  }
  // simple sky gradient
  const skyGrad = ctx.createLinearGradient(0,0,0,H);
  skyGrad.addColorStop(0,'#87CEEB');
  skyGrad.addColorStop(1,'#E0F6FF');
  // cloud data
  const clouds = [];
  for(let i=0;i<5;i++){
    clouds.push({x:Math.random()*W, y:20+Math.random()*30, r:20+Math.random()*15, speed:0.5+Math.random()*0.5});
  }
  const GRAVITY = 0.6;
  const JUMP = -12;
  const PLAYER_SIZE = 30;
  const OBSTACLE_HEIGHT = 40;
  const OBSTACLE_MIN_W = 20;
  const OBSTACLE_MAX_W = 60;
  const SPAWN_INTERVAL = 1500; // ms
  let lastSpawn = 0;
  let score = 0;
  let gameOver = false;
  const player = {x:50, y:H-PLAYER_SIZE, w:PLAYER_SIZE, h:PLAYER_SIZE, vy:0, onGround:true};
  const obstacles = [];
  function reset(){
    player.y = H-PLAYER_SIZE; player.vy=0; player.onGround=true;
    obstacles.length = 0; score=0; gameOver=false; lastSpawn=0;
    requestAnimationFrame(loop);
  }
  function spawn(){
    const w = OBSTACLE_MIN_W + Math.random()*(OBSTACLE_MAX_W-OBSTACLE_MIN_W);
    obstacles.push({x:W, y:H-OBSTACLE_HEIGHT, w, h:OBSTACLE_HEIGHT, speed:6});
  }
  function update(dt){
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= H-PLAYER_SIZE){ player.y = H-PLAYER_SIZE; player.vy=0; player.onGround=true; }
    // obstacles movement & collision
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= o.speed;
      if(o.x + o.w < 0) obstacles.splice(i,1);
      // collision
        if(!(player.x+player.w < o.x || player.x > o.x+o.w || player.y+player.h < o.y || player.y > o.y+o.h)){
          if(!gameOver){
            gameOver = true;
            playGameOverSound();
          }
        }
    }
    // clouds movement (parallax)
    clouds.forEach(c=>{
      c.x -= c.speed;
      if(c.x + c.r < 0) c.x = W + c.r;
    });
    // spawn timing
    if(Date.now()-lastSpawn > SPAWN_INTERVAL){ spawn(); lastSpawn = Date.now(); }
    score = Math.floor((Date.now()-startTime)/100);
  }
  function draw(){
    // sky background
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H);
    // clouds
    ctx.fillStyle = '#fff';
    clouds.forEach(c=>{
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      ctx.fill();
    });
    // ground line
    ctx.fillStyle='#654321';
    ctx.fillRect(0,H-5,W,5);
    // player (rounded green square)
    drawRoundedRect(player.x, player.y, player.w, player.h, 5, '#4CAF50');
    // obstacles (rounded red rectangles)
    obstacles.forEach(o=>drawRoundedRect(o.x, o.y, o.w, o.h, 3, '#D32F2F'));
    // score
    ctx.fillStyle='#000';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';
      ctx.font='30px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }
  let startTime = 0;
  function loop(timestamp){
    if(!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame||timestamp);
    lastFrame = timestamp;
    if(!gameOver){
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  // sound setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(()=>{
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
      osc.stop(audioCtx.currentTime + 0.06);
    }, duration);
  }
  function playJumpSound(){ playTone(440, 100); }
  function playGameOverSound(){ playTone(150, 300); }
  // input
  function jump(){ if(player.onGround){ player.vy = JUMP; player.onGround = false; playJumpSound(); } }
  document.addEventListener('keydown',e=>{ if(e.code==='Space') jump(); });
  document.addEventListener('touchstart',e=>{ e.preventDefault(); jump(); },{passive:false});
  // start
  reset();
})();
