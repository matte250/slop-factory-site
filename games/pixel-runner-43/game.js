// Minimal Pixel Runner game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth||400;
  const height=canvas.height=canvas.clientHeight||200;
  const player={x:50,y:height/2-10,w:20,h:20,dy:0};
  const obstacles=[];
  let lastObs=0,score=0,gameOver=false,startTime=performance.now();
  // Input
  let audioStarted=false;
  document.addEventListener('keydown',e=>{
    if(!audioStarted){
      audioCtx.resume().then(startBackground);
      audioStarted=true;
    }
    if(e.key==='ArrowUp')player.dy=-3;
    if(e.key==='ArrowDown')player.dy=3;
  });
  document.addEventListener('keyup',e=>{if(e.key==='ArrowUp'&&player.dy<0)player.dy=0;if(e.key==='ArrowDown'&&player.dy>0)player.dy=0;});
  function spawn(){
    const size=10+Math.random()*20;
    obstacles.push({x:width,y:Math.random()*(height-size),w:size,h:size,spd:2+Math.random()*2});
  }
  function update(dt){
    if(gameOver)return;
    player.y+=player.dy;
    // keep player inside canvas
    if(player.y<0)player.y=0;
    if(player.y+player.h>height)player.y=height-player.h;
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=o.spd;
      // collision
      if(o.x<player.x+player.w && o.x+o.w>player.x && o.y<player.y+player.h && o.y+o.h>player.y){gameOver=true; playCollision(); stopBackground();}
      if(o.x+o.w<0)obstacles.splice(i,1);
    }
    // spawn logic
    if(performance.now()-lastObs>800){spawn();lastObs=performance.now();}
    // score
    score=Math.floor((performance.now()-startTime)/1000);
  }
  function draw(){
ctx.clearRect(0,0,width,height);
      // background gradient
      const bgGrad = ctx.createLinearGradient(0,0,width, height);
      bgGrad.addColorStop(0, '#222');
      bgGrad.addColorStop(1, '#555');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0,0,width,height);
      // player (rounded square with shadow)
      ctx.fillStyle='lime';
      ctx.shadowColor='rgba(0,255,0,0.5)';
      ctx.shadowBlur=8;
      ctx.beginPath();
      ctx.roundRect(player.x, player.y, player.w, player.h, 4);
      ctx.fill();
      ctx.shadowBlur=0;
      // obstacles (colored circles with slight variation)
      obstacles.forEach(o=>{
        const hue = Math.floor(Math.random()*360);
        ctx.fillStyle = `hsl(${hue},80%,60%)`;
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
        ctx.fill();
      });
    // score
    ctx.fillStyle='black';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,width,height);ctx.fillStyle='white';ctx.textAlign='center';ctx.fillText('Game Over',width/2,height/2);}
  }
  function loop(timestamp){
    const dt=timestamp-(lastTime||timestamp);
    lastTime=timestamp;
    update(dt);
    draw();
    if(!gameOver)requestAnimationFrame(loop);
  }
  let lastTime=0;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let bgOsc=null;
  function startBackground(){
    if(bgOsc) return;
    bgOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOsc.frequency.value = 60; // low hum
    gain.gain.value = 0.02;
    bgOsc.connect(gain).connect(audioCtx.destination);
    bgOsc.start();
  }
  function stopBackground(){
    if(bgOsc){bgOsc.stop();bgOsc.disconnect();bgOsc=null;}
  }
  function playCollision(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  requestAnimationFrame(loop);
})();
