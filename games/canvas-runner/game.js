// Minimal endless runner for canvas with id "game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Player
  const player = {x:50, y:height-30, w:20, h:20, vy:0, jumpStrength:-12, grounded:false};
  const gravity = 0.6;

  // Obstacles
  const obstacles = [];
  const obstacleSpeed = 4;
  let spawnTimer = 0;
  const spawnInterval = 90; // frames

  function reset(){
    player.y = height-30; player.vy=0; obstacles.length=0; spawnTimer=0; running=true; score=0;
  }

  function spawn(){
    const gap = 80 + Math.random()*40;
    const w = 20 + Math.random()*10;
    obstacles.push({x:width, y:height-30, w, h:30});
  }

  function update(){
    // Input
    if(keyPressed['Space']||keyPressed['Enter']){ if(player.grounded){ player.vy = player.jumpStrength; player.grounded=false; playJump(); } }
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y + player.h >= height){ player.y = height - player.h; player.vy=0; player.grounded=true; }
    // Obstacles
    spawnTimer--; if(spawnTimer<=0){ spawn(); spawnTimer=spawnInterval; }
    obstacles.forEach(o=> o.x -= obstacleSpeed);
    // Remove off-screen
    while(obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    // Collision
    for(let o of obstacles){
      if(player.x < o.x+o.w && player.x+player.w > o.x &&
         player.y < o.y+o.h && player.y+player.h > o.y){
        running=false;
        playHit();
      }
    }
    // Score
    if(running) score++;
  }

function draw(){
  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,width,0);
  sky.addColorStop(0,'#87CEEB');
  sky.addColorStop(1,'#b3e5fc');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,width,height);
  // Ground
  const groundHeight = 30;
  ctx.fillStyle = '#654321';
  ctx.fillRect(0,height-groundHeight,width,groundHeight);
  // Player (circle with gradient)
  const playerGradient = ctx.createRadialGradient(player.x+player.w/2, player.y+player.h/2, 5, player.x+player.w/2, player.y+player.h/2, player.w);
  playerGradient.addColorStop(0,'#fff');
  playerGradient.addColorStop(1,'#0a84ff');
  ctx.fillStyle = playerGradient;
  ctx.beginPath();
  ctx.arc(player.x+player.w/2, player.y+player.h/2, player.w/2, 0, Math.PI*2);
  ctx.fill();
  // Obstacles with gradient
  obstacles.forEach(o=>{
    const grad = ctx.createLinearGradient(o.x,0,o.x+o.w,0);
    grad.addColorStop(0,'#ff8a80');
    grad.addColorStop(1,'#ff3b30');
    ctx.fillStyle = grad;
    ctx.fillRect(o.x,o.y,o.w,o.h);
  });
  // Score
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score,10,20);
  if(!running){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width/2, height/2);
    ctx.textAlign = 'left';
  }
}

  let running=true, score=0;
  const keyPressed = {};
  // Audio setup
  let audioCtx = null;
  function initAudio(){
    if(!audioCtx){
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  function playTone(freq, duration){
    if(!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  }
  function playJump(){ playTone(440, 0.1); }
  function playHit(){ playTone(100, 0.3); }
  window.addEventListener('keydown',e=>{keyPressed[e.key]=true; initAudio();});
  window.addEventListener('keyup',e=>{keyPressed[e.key]=false;});
  // Touch / click for jump
  canvas.addEventListener('pointerdown',()=>{ initAudio(); if(player.grounded){ player.vy = player.jumpStrength; player.grounded=false; playJump(); } });

  function loop(){
    if(running){ update(); }
    draw();
    requestAnimationFrame(loop);
  }
  reset();
  loop();
})();
