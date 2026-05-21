// Endless Runner game for canvas with id "game"
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx=canvas.getContext('2d');
  // Set canvas size to fill window
  function resize(){ canvas.width=window.innerWidth; canvas.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);

  const player={x:80,width:30,height:30,vy:0,gravity:0.6,jumpForce:-12,onGround:false};
  const speed=6; // world scroll speed
  let platforms=[]; // {x,w,y}
  let obstacles=[]; // {x,w,y,h}
  let score=0; let lastTime=0; let gameOver=false;

  function init(){
    // initial platform covering bottom
    platforms=[{x:0,w:canvas.width*2,y:canvas.height-100}];
    obstacles=[];
    player.y=platforms[0].y-player.height;
    player.vy=0;
    player.onGround=true;
    score=0; gameOver=false;
    requestAnimationFrame(loop);
  }

  function addChunk(){
    const last=platforms[platforms.length-1];
    const gap=Math.random()<0.2?150:0; // occasional gap
    const newX=last.x+last.w+gap;
    const height=Math.max(50,Math.random()*200);
    const y=canvas.height-100-height;
    const w=200+Math.random()*200;
    platforms.push({x:newX,w,y});
    // maybe add obstacle on this platform
    if(Math.random()<0.3){
      const obsW=30+Math.random()*20;
      const obsH=30+Math.random()*20;
      const obsX=newX+Math.random()*(w-obsW);
      const obsY=y-obsH;
      obstacles.push({x:obsX,w:obsW,y:obsY,h:obsH});
    }
  }

  function update(dt){
    // world moves left
    platforms.forEach(p=>p.x-=speed);
    obstacles.forEach(o=>o.x-=speed);
    // remove off-screen
    while(platforms.length && platforms[0].x+platforms[0].w<0) platforms.shift();
    while(obstacles.length && obstacles[0].x+obstacles[0].w<0) obstacles.shift();
    // ensure enough chunks
    while(platforms[platforms.length-1].x+platforms[platforms.length-1].w < canvas.width*2) addChunk();
    // player physics
    if(!player.onGround) player.vy+=player.gravity;
    player.y+=player.vy;
    // ground check
    player.onGround=false;
    for(const p of platforms){
      if(player.x+player.width>p.x && player.x<p.x+p.w &&
         player.y+player.height>p.y && player.y+player.height<=p.y+player.vy+5){
        player.y=p.y-player.height;
        player.vy=0;
        player.onGround=true;
        break;
      }
    }
    // fall off screen -> lose
    if(player.y>canvas.height){ endGame(); }
    // obstacle collision
    for(const o of obstacles){
      if(player.x<o.x+o.w && player.x+player.width>o.x &&
         player.y<o.y+o.h && player.y+player.height>o.y){
        endGame(); break;
      }
    }
    if(!gameOver) score+=dt/1000; // seconds
  }

  function draw(){
    // Clear canvas
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Sky background gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    skyGrad.addColorStop(0, '#87CEEB'); // light sky blue
    skyGrad.addColorStop(1, '#E0F7FA'); // pale cyan
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // Draw platforms as brown rectangles with slight rounding
    ctx.fillStyle = '#654321';
    platforms.forEach(p=>{
      ctx.fillRect(p.x,p.y,p.w,canvas.height-p.y);
    });

    // Draw obstacles as red triangles (spikes)
    ctx.fillStyle = 'red';
    obstacles.forEach(o=>{
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // Draw player as a blue circle
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(player.x + player.width/2, player.y + player.height/2, player.width/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw score
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Score: '+Math.floor(score),10,30);

    // Game over overlay
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '40px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!lastTime) lastTime=timestamp;
    const dt=timestamp-lastTime;
    lastTime=timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playSound(freq, duration){
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    }
    function endGame(){
      if(!gameOver){
        playSound(150, 0.4); // low tone on lose
        gameOver = true;
      }
    }
    // input
    window.addEventListener('keydown',e=>{ if(e.code==='Space' && player.onGround && !gameOver){ player.vy=player.jumpForce; player.onGround=false; playSound(440,0.1); } });

    init();
})();
