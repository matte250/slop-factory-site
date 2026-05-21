// Canvas Runner with enhanced graphics
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio assets (tiny beep sounds encoded as data URIs)
  const jumpAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQgAAAA='); // short silent placeholder (replace with real sound if desired)
  const hitAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQgAAAA=');
  // set fixed size (can be overridden by CSS)
  canvas.width = 800; canvas.height = 200;
  const GRAVITY = 0.6, JUMP = -12, SPEED = 4;
  const player = {x:80, y:canvas.height-30, w:30, h:30, vy:0, slide:false, dead:false};
  const obstacles=[]; let frames=0, score=0;
  function spawn(){
    const type = Math.random()<0.5?'low':'high';
    const o = {x:canvas.width, w:20, h:type==='low'?30:60, y:canvas.height-(type==='low'?30:60), type};
    obstacles.push(o);
  }
  function update(){
    if(player.dead) return;
    // player physics
    player.vy+=GRAVITY; player.y+=player.vy;
    if(player.y>canvas.height-30){player.y=canvas.height-30; player.vy=0;}
    // slide handling
    if(player.slide){ player.h=15; } else { player.h=30; }
    // obstacles
    frames++; if(frames%120===0) spawn();
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i]; o.x-=SPEED; 
      // collision (AABB)
if(!player.dead && o.x<player.x+player.w && o.x+o.w>player.x &&
          o.y<player.y+player.h && o.y+o.h>player.y){
          player.dead=true;
          hitAudio.currentTime=0;
          hitAudio.play();
        }
      if(o.x+o.w<0) obstacles.splice(i,1);
    }
    if(!player.dead) score = Math.floor(frames/60);
  }
  function draw(){
    // sky background gradient
    const skyGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    skyGrad.addColorStop(0,'#87ceeb');
    skyGrad.addColorStop(1,'#b0e0e6');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // ground
    ctx.fillStyle = '#444';
    ctx.fillRect(0,canvas.height-20,canvas.width,20);
    // helper for rounded rect
    const drawRounded = (x,y,w,h,r,color)=>{
      ctx.beginPath();
      ctx.moveTo(x+r,y);
      ctx.lineTo(x+w-r,y);
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r);
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h);
      ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };
    // player (green with slight shadow)
    drawRounded(player.x,player.y,player.w,player.h,6,'#2ecc71');
    // obstacles (color based on type)
    obstacles.forEach(o=>{
      const col = o.type==='low' ? '#e74c3c' : '#e67e22';
      drawRounded(o.x,o.y,o.w,o.h,4,col);
    });
    // score / game over
    ctx.fillStyle='#000'; ctx.font='18px sans-serif'; ctx.textAlign='left';
    ctx.fillText('Score: '+score,10,30);
    if(player.dead){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#fff'; ctx.textAlign='center';
      ctx.font='36px sans-serif';
      ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
    }
  }
  function loop(){
    update(); draw();
    if(!player.dead) requestAnimationFrame(loop);
  }
  // input
  window.addEventListener('keydown',e=>{
    if(e.code==='Space' && player.y===canvas.height-30){ player.vy=JUMP; jumpAudio.currentTime=0; jumpAudio.play(); }
    if(e.code==='ArrowDown'){ player.slide=true; }
  });
  window.addEventListener('keyup',e=>{ if(e.code==='ArrowDown') player.slide=false;});
  loop();
})();
