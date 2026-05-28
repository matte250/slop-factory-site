// Neon Runner – enhanced graphics
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.offsetWidth||800;
  const H=canvas.height=canvas.offsetHeight||400;
  // player
  const player={x:50,y:H/2,width:30,height:20,vy:0,gravity:0.5,jump:-10};
  // obstacles
  const obstacles=[];
  // stars for background
  const stars=[];
  function initStars(){
    const count=100;
    for(let i=0;i<count;i++){
      stars.push({x:Math.random()*W, y:Math.random()*H});
    }
  }
  initStars();
  let frame=0,gameOver=false;
  // input
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  document.addEventListener('keydown',e=>{
    if(e.code==='ArrowUp'){
      player.vy=player.jump;
      playTone(440,0.1); // jump sound
    }
  });
  document.addEventListener('keyup',e=>{if(e.code==='ArrowUp')player.vy=0;});
  function spawn(){
    const h=20+Math.random()*30;
    obstacles.push({x:W, y:H-h, w:20, h});
  }
  function update(){
    if(gameOver) return;
    frame++;
    if(frame%100===0) spawn();
    // player physics
    player.vy+=player.gravity;
    player.y+=player.vy;
    if(player.y+player.height>H){player.y=H-player.height;player.vy=0;}
    if(player.y<0){player.y=0;player.vy=0;}
    // move obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=3;
      if(o.x+o.w<0) obstacles.splice(i,1);
      // collision
      if(o.x<player.x+player.width && o.x+o.w>player.x && o.y<player.y+player.height && o.y+o.h>player.y){
        playTone(200,0.2); // collision sound
        gameOver=true;break;
      }
    }
    draw();
    if(!gameOver) requestAnimationFrame(update);
    else{ctx.fillStyle='red';ctx.font='48px sans-serif';ctx.fillText('Game Over',W/2-120,H/2);}
  }
  function draw(){
    // background gradient
    const bgGrad=ctx.createLinearGradient(0,0,W,H);
    bgGrad.addColorStop(0,'#001d3d');
    bgGrad.addColorStop(1,'#001d3d');
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='white';
    stars.forEach(s=>{
      ctx.fillRect(s.x,s.y,2,2);
    });
    // player ship with neon glow
    ctx.save();
    ctx.translate(player.x+player.width/2, player.y+player.height/2);
    ctx.fillStyle='cyan';
    ctx.shadowColor='cyan';
    ctx.shadowBlur=20;
    ctx.beginPath();
    ctx.moveTo(-player.width/2, player.height/2);
    ctx.lineTo(0, -player.height/2);
    ctx.lineTo(player.width/2, player.height/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur=0;
    // obstacles with gradient
    obstacles.forEach(o=>{
      const grad=ctx.createLinearGradient(0,o.y,o.w,o.y+o.h);
      grad.addColorStop(0,'#ff6600');
      grad.addColorStop(1,'#ff3300');
      ctx.fillStyle=grad;
      ctx.fillRect(o.x,o.y,o.w,o.h);
    });
  }
  update();
})();
