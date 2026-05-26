// Simple endless runner based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  const groundY = H - 40;

  // player
  const player = {x:50, w:20, h:30, y:groundY-30, vy:0, jumpForce:-12, color:'#0ff'};
  const gravity = 0.6;

  // simple sound engine using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump(){ playTone(440, 0.1); }
  function playGem(){ playTone(660, 0.1); }
  function playGameOver(){ playTone(200, 0.3); }

  // add simple background clouds for visual depth
  let clouds = [];
  function spawnCloud(){
    const size = 30 + Math.random()*40;
    const y = Math.random()* (groundY - 150);
    const speed = 1 + Math.random()*1.5;
    clouds.push({x:W, y, size, speed, color: 'rgba(255,255,255,0.3)'});
  }

  // game objects
  let obstacles = [];
  let gems = [];
  let score = 0;
  let gameOver = false;
  let frames = 0;

  function spawnObstacle(){
    const w = 20+Math.random()*20;
    const h = 20+Math.random()*30;
    obstacles.push({x:W, y:groundY-h, w, h, color:'#f44'});
  }
  function spawnGem(){
    const size = 12;
    const y = groundY - 80 - Math.random()*120;
    gems.push({x:W, y, w:size, h:size, color:'#ff0'});
  }

  function rectColl(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function update(){
    if(gameOver) return;
    frames++;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y > groundY - player.h){
      player.y = groundY - player.h;
      player.vy = 0;
    }
    // spawn obstacles/gems
    if(frames % 90 === 0) spawnObstacle();
    if(frames % 150 === 0) spawnGem();
    // spawn clouds occasionally
    if(frames % 200 === 0) spawnCloud();
    // move clouds (slow parallax)
    clouds.forEach(c=> c.x -= c.speed);
    clouds = clouds.filter(c=> c.x + c.size > 0);
    // move obstacles
    obstacles.forEach(o=> o.x -= 4);
    obstacles = obstacles.filter(o=> o.x + o.w > 0);
    // move gems
    gems.forEach(g=> g.x -= 4);
    gems = gems.filter(g=> g.x + g.w > 0);
    // collisions
    for(const o of obstacles){
      if(rectColl(player,o)) {gameOver=true; playGameOver(); break;}
    }
    for(let i=gems.length-1;i>=0;i--){
      if(rectColl(player,gems[i])){score+=10; playGem(); gems.splice(i,1);}
    }
    // score over time
    score += 0.1;
  }

  function draw(){
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,H);
    skyGrad.addColorStop(0, '#87ceeb'); // light blue
    skyGrad.addColorStop(1, '#4682b4'); // steel blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,W,H);
    // clouds
    clouds.forEach(c=>{
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size*0.6, 0, Math.PI*2);
      ctx.arc(c.x+ c.size*0.5, c.y- c.size*0.3, c.size*0.5, 0, Math.PI*2);
      ctx.arc(c.x- c.size*0.5, c.y- c.size*0.3, c.size*0.5, 0, Math.PI*2);
      ctx.fill();
    });
    // ground with texture
    ctx.fillStyle = '#555';
    ctx.fillRect(0,groundY,W, H-groundY);
    // simple ground line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,groundY+1);
    ctx.lineTo(W,groundY+1);
    ctx.stroke();
    // player with rounded corners
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(player.x, player.y, player.w, player.h, 4) : ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fill();
    // obstacles (use darker hue)
    obstacles.forEach(o=>{
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x,o.y,o.w,o.h);
    });
    // gems (draw as glowing circles)
    gems.forEach(g=>{
      const grad = ctx.createRadialGradient(g.x+g.w/2, g.y+g.h/2, 2, g.x+g.w/2, g.y+g.h/2, g.w/2);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x+g.w/2, g.y+g.h/2, g.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign='center';
      ctx.fillText('Game Over', W/2, H/2-10);
      ctx.fillText('Press Space to Restart', W/2, H/2+20);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  // input
  document.addEventListener('keydown', e=>{
    if(e.code === 'Space'){
      // ensure audio context is running
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if(gameOver){
        // reset
        obstacles=[]; gems=[]; clouds=[]; score=0; frames=0; gameOver=false; player.y=groundY-player.h; player.vy=0; requestAnimationFrame(loop);
      } else if(player.y===groundY-player.h){
        player.vy = player.jumpForce;
        playJump();
      }
    }
  });

  // start
  requestAnimationFrame(loop);
})();
