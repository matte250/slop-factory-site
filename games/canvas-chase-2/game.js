(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth;
  const height=canvas.height=canvas.clientHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur){
    // Ensure AudioContext is running (required after user gesture)
    if(audioCtx.state === 'suspended'){
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  const player={x:50,y:height-30,w:20,h:20,vy:0,jumpForce:-8,grounded:false};
  const obstacles=[];
  let frame=0,score=0,raf;
  const speed=2;

  function addObstacle(){
    if(Math.random()<0.5){
      const size=20;
      obstacles.push({x:width,y:height-size,w:size,h:size});
    }else{
      const gapWidth=30;
      obstacles.push({x:width,y:height,w:gapWidth,h:0,gap:true});
    }
  }

  function rectIntersect(a,b){
    return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  }

  function update(){
    frame++;
    if(frame%120===0) addObstacle();
    // physics
    player.vy+=0.3;
    player.y+=player.vy;
    if(player.y+player.h>=height){
      player.y=height-player.h;
      player.vy=0;
      player.grounded=true;
    }else player.grounded=false;
    // move obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=speed;
      if(o.x+o.w<0) obstacles.splice(i,1);
    }
    // collision
    for(const o of obstacles){
      if(o.gap){
        if(player.x+player.w>o.x && player.x<o.x+o.w && player.grounded){
          player.grounded=false; // will start falling over gap
        }
      }else if(rectIntersect(player,o)){
        cancelAnimationFrame(raf);
        playBeep(200,0.2); // collision sound
        alert('Game Over! Score: '+Math.floor(score));
        return;
      }
    }
    score+=speed*0.1;
    draw();
    raf=requestAnimationFrame(update);
  }

function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#87ceeb');
    bgGrad.addColorStop(1,'#f0f8ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);

    // ground with gradient
    const groundGrad = ctx.createLinearGradient(0,height-10,width,height);
    groundGrad.addColorStop(0,'#555');
    groundGrad.addColorStop(1,'#333');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0,height-10,width,10);

    // helper for rounded rect
    const roundRect = (x,y,w,h,r,fillStyle) => {
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
        ctx.fillStyle = fillStyle;
        ctx.fill();
    };

    // player with rounded corners and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x+player.w, player.y+player.h);
    playerGrad.addColorStop(0,'#00ff00');
    playerGrad.addColorStop(1,'#006400');
    roundRect(player.x, player.y, player.w, player.h, 4, playerGrad);

    // obstacles with gradient and rounded corners
    for(const o of obstacles){
        if(o.gap) continue;
        const grad = ctx.createLinearGradient(o.x, o.y, o.x+o.w, o.y+o.h);
        grad.addColorStop(0,'#ff5555');
        grad.addColorStop(1,'#aa0000');
        roundRect(o.x, o.y, o.w, o.h, 3, grad);
    }

    // score with shadow
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 2;
    ctx.fillText('Score: '+Math.floor(score),10,20);
    ctx.shadowBlur = 0;
}

  function jump(){
    if(player.grounded){
      player.vy=player.jumpForce;
      player.grounded=false;
      playBeep(660,0.08); // jump sound
    }
  }
  document.addEventListener('keydown',e=>{if(e.code==='Space') jump();});
  document.addEventListener('mousedown',jump);
  raf=requestAnimationFrame(update);
})();