// Simple endless runner game based on IDEA.md
(function(){
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioCtx = window.AudioContext||window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq,dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value=freq;
    osc.type='sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1,audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime+dur);
  }
  function playJump(){playTone(440,0.1);}
  function playHit(){playTone(150,0.3);}

  if(!canvas||!canvas.getContext){return;}
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;
  const player = {x:50, y:height-30, w:20, h:20, vy:0, gravity:0.6, jump:-12};
  const obstacles = [];
  let frames=0;
  function spawn(){
    const size = 20+Math.random()*30;
    obstacles.push({x:width, y:height-size, w:size, h:size, speed:6+Math.random()*3});
  }
  function update(){
    frames++;
    if(frames%100===0) spawn();
    // player physics
    player.vy+=player.gravity;
    player.y+=player.vy;
    if(player.y+player.h>height){player.y=height-player.h;player.vy=0;}
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=o.speed;
      // collision
if(o.x<player.x+player.w && o.x+o.w>player.x && o.y<player.y+player.h && o.y+o.h>player.y){
          // reset game on hit
          obstacles.length=0;frames=0;player.y=height-player.h;player.vy=0;playHit();return;
        }
      if(o.x+o.w<0) obstacles.splice(i,1);
    }
  }
  function draw(){
    // sky gradient background
    const bg = ctx.createLinearGradient(0,0,0,height);
    bg.addColorStop(0,'#87CEEB');
    bg.addColorStop(1,'#fff');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,width,height);
    // player as triangle
    ctx.fillStyle='orange';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y+player.h);
    ctx.lineTo(player.x+player.w/2, player.y);
    ctx.lineTo(player.x+player.w, player.y+player.h);
    ctx.closePath();
    ctx.fill();
    // obstacles as gradient circles
    obstacles.forEach(o=>{
        const grad = ctx.createRadialGradient(o.x+o.w/2, o.y+o.h/2, Math.min(o.w,o.h)/4, o.x+o.w/2, o.y+o.h/2, Math.min(o.w,o.h)/2);
        grad.addColorStop(0,'#ff8080');
        grad.addColorStop(1,'#b20000');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x+o.w/2, o.y+o.h/2, Math.min(o.w,o.h)/2, 0, Math.PI*2);
        ctx.fill();
    });
  }
  function loop(){
    update();
    draw();
    requestAnimationFrame(loop);
  }
  // jump on click / space
  canvas.addEventListener('click',()=>{if(player.vy===0) player.vy=player.jump;});
  document.addEventListener('keydown',e=>{if(e.code==='Space'&&player.vy===0) player.vy=player.jump;});
  loop();
})();
