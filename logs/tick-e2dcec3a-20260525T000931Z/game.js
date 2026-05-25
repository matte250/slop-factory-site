// Minimal Neon Escape game based on IDEA.md
(function(){
const canvas=document.getElementById('game');
   if(!canvas){console.error('Canvas #game not found');return;}
   const ctx=canvas.getContext('2d');
   // audio setup
   const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
   function playTone(freq, duration){
     const osc = audioCtx.createOscillator();
     const gain = audioCtx.createGain();
     osc.type = 'sine';
     osc.frequency.value = freq;
     osc.connect(gain);
     gain.connect(audioCtx.destination);
     gain.gain.setValueAtTime(0, audioCtx.currentTime);
     gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
     gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
     osc.start();
     osc.stop(audioCtx.currentTime + duration);
   }
   const playDash = ()=> playTone(600, 0.1);
   const playCrash = ()=> playTone(150, 0.3);
   const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;colW=canvas.width/COLS;};
   window.addEventListener('resize',resize);
   resize();
  const COLS=7, ROW_H=30, ORB_R=12;
  let colW, speed=2, tick=0, gameOver=false;
  let orbCol=Math.floor(COLS/2);
  const obstacles=[]; // {y, cells:[{floor, spike}]}
  function spawnRow(){
    const cells=[];
    for(let i=0;i<COLS;i++){
      const floor=Math.random()>0.2; // 80% floor
      const spike=floor && Math.random()<0.1; // 10% of floors are spikes
      cells.push({floor, spike});
    }
    obstacles.push({y:-ROW_H, cells});
  }
  function update(){
    if(gameOver) return;
    tick+=speed;
    // move obstacles
    for(const o of obstacles) o.y+=speed;
    // remove offscreen
    while(obstacles.length && obstacles[0].y>canvas.height) obstacles.shift();
    // spawn new row at interval
    if(tick%ROW_H===0) spawnRow();
    // collision check when obstacle reaches orb line
    for(const o of obstacles){
      if(o.y+ROW_H>canvas.height-ROW_H && o.y<canvas.height-ROW_H){
        const cell=o.cells[orbCol];
        if(!cell.floor||cell.spike){
          gameOver=true;
          playCrash();
        }
      }
    }
    draw();
    if(!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  }
  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0,"#00101a");
    bgGrad.addColorStop(1,"#000215");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // neon grid
    ctx.strokeStyle = "rgba(0,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.shadowColor = "rgba(0,255,255,0.7)";
    ctx.shadowBlur = 4;
    for(let i=0;i<=COLS;i++){
      ctx.beginPath();
      ctx.moveTo(i*colW,0);
      ctx.lineTo(i*colW,canvas.height);
      ctx.stroke();
    }
    for(let y=0;y<canvas.height;y+=ROW_H){
      ctx.beginPath();
      ctx.moveTo(0,y);
      ctx.lineTo(canvas.width,y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0; // reset for obstacles
    // draw obstacles with neon outline
    for(const o of obstacles){
      for(let i=0;i<COLS;i++){
        const cell=o.cells[i];
        if(cell.floor){
          // floor block
          ctx.fillStyle='rgba(0,0,20,0.6)';
          ctx.fillRect(i*colW,o.y,colW,ROW_H);
          ctx.strokeStyle='rgba(0,200,255,0.4)';
          ctx.strokeRect(i*colW,o.y,colW,ROW_H);
          if(cell.spike){
            // glowing spike
            const grad = ctx.createLinearGradient(0,o.y,0,o.y+ROW_H);
            grad.addColorStop(0,"#0ff");
            grad.addColorStop(1,"#00f");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(i*colW+colW/2, o.y+ROW_H/2-8);
            ctx.lineTo(i*colW+colW/2-8, o.y+ROW_H/2+8);
            ctx.lineTo(i*colW+colW/2+8, o.y+ROW_H/2+8);
            ctx.closePath();
            ctx.fill();
            // spike outline glow
            ctx.strokeStyle='rgba(0,255,255,0.8)';
            ctx.lineWidth=2;
            ctx.stroke();
            ctx.lineWidth=1;
          }
        }
      }
    }
    // draw orb with radial glow
    const orbX = orbCol*colW+colW/2;
    const orbY = canvas.height-ROW_H/2;
    const gradOrb = ctx.createRadialGradient(orbX, orbY, ORB_R/2, orbX, orbY, ORB_R*2);
    gradOrb.addColorStop(0,"#0ff");
    gradOrb.addColorStop(1,"rgba(0,0,255,0)");
    ctx.fillStyle = gradOrb;
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(orbX, orbY, ORB_R,0,2*Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  function drawGameOver(){
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='white';
    ctx.font='48px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
  }
  canvas.addEventListener('click',e=>{if(gameOver) return; if(audioCtx.state==='suspended'){audioCtx.resume();} const half=canvas.width/2; if(e.clientX<half){orbCol=Math.max(0,orbCol-1); playDash();} else {orbCol=Math.min(COLS-1,orbCol+1); playDash();}});
  spawnRow();
  requestAnimationFrame(update);
})();
