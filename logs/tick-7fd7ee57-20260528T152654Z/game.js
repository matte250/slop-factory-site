// Simple endless runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth || 800;
  const h = canvas.height = canvas.offsetHeight || 200;
  // Player
  const player = {x:50, y:h-30, w:20, h:20, vy:0, jumpStrength:-8};
  const gravity = 0.4;
  // Obstacles
  const obstacles = [];
  let spawnTimer = 0;
  const spawnInterval = 90; // frames
  let speed = 3;
  let running = true;
  function reset(){
    player.y = h-30; player.vy=0; obstacles.length=0; spawnTimer=0; speed=3; running=true;
  }
  function gameOver(){
    running=false;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle='white';
    ctx.font='24px sans-serif';
    ctx.fillText('Game Over - Press Space to Restart', w/2-180, h/2);
  }
  function spawnObstacle(){
    const type = Math.random()<0.5?'bar':'spike';
    const o = {x:w, w:20, type};
    if(type==='bar'){
      o.h = 30; o.y = h - o.h;
    } else {
      o.h = 20; o.y = h - o.h;
    }
    obstacles.push(o);
  }
  function update(){
    if(!running) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y > h - player.h){player.y = h - player.h; player.vy=0;}
    // obstacles
    spawnTimer++;
    if(spawnTimer > spawnInterval){spawnObstacle(); spawnTimer=0;}
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= speed;
      // collision
      if(o.x < player.x+player.w && o.x+o.w > player.x &&
         o.y < player.y+player.h && o.y+o.h > player.y){
        gameOver();
        return;
      }
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
    // increase speed gradually
    speed += 0.001;
  }
  function draw(){
    // sky gradient background
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,'#87CEEB'); // sky blue
    grad.addColorStop(1,'#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    // ground
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, h-20, w, 20);
    // player (rounded square)
    ctx.fillStyle = '#00FF00';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.h/2);
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    // obstacles
    obstacles.forEach(o=>{
      if(o.type==='spike'){
        ctx.fillStyle = '#FF4500'; // orange red
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w/2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#8B0000'; // dark red bar
        ctx.fillRect(o.x,o.y,o.w,o.h);
      }
    });
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // audio setup
  const AudioCtx = window.AudioContext||window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playBeep(freq,dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1,audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // input
  window.addEventListener('keydown',e=>{
    if(e.code==='Space'){
      if(!running) reset();
      if(player.vy===0){
        player.vy=player.jumpStrength;
        playBeep(440,0.1); // jump sound
      }
    }
  });
  canvas.addEventListener('click',()=>{if(player.vy===0){player.vy=player.jumpStrength;playBeep(440,0.1);}});
  // modify gameOver to play sound
  const originalGameOver = gameOver;
  function gameOver(){
    playBeep(150,0.3); // game over sound
    originalGameOver();
  }
  loop();
})();
