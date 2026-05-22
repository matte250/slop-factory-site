(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.clientWidth;
  canvas.height=canvas.clientHeight;
  // generate background stars
  const STAR_COUNT=100;
  const stars=Array.from({length:STAR_COUNT},()=>({
    x:Math.random()*canvas.width,
    y:Math.random()*canvas.height,
    r:Math.random()*1.5+0.5,
    opacity:Math.random()*0.5+0.5
  }));
  const GRAVITY=0.3, THRUST=-8, SPAWN_RATE=1500, FUEL_CELL_RATE=8000, OBSTACLE_SIZE=40, FUEL_CELL_SIZE=20;
  let rocket={x:canvas.width/2,y:canvas.height*0.8,w:20,h:30,vy:0,fuel:100,alive:true,score:0};
  const obstacles=[],fuelCells=[];
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300);
  const playCollect = () => playTone(600);
  const playCrash = () => playTone(100);
  const applyThrust=()=>{if(rocket.fuel<=0)return;rocket.vy+=THRUST;rocket.fuel=Math.max(0,rocket.fuel-1);rocket.thrust=true;playThrust();};
  canvas.addEventListener('mousedown',applyThrust);
  canvas.addEventListener('touchstart',e=>{e.preventDefault();applyThrust();});
  const rand=(a,b)=>Math.random()*(b-a)+a;
  const rectCollision=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  const spawnObstacle=()=>{const side=Math.random()<0.5?'left':'right';const x=side==='left'?-OBSTACLE_SIZE:canvas.width;const y=rand(0,canvas.height*0.6);const vy=rand(1,3);const vx=side==='left'?rand(1,3):-rand(1,3);obstacles.push({x,y,w:OBSTACLE_SIZE,h:OBSTACLE_SIZE,vx,vy});};
  const spawnFuelCell=()=>{const x=rand(OBSTACLE_SIZE,canvas.width-OBSTACLE_SIZE);const y=-FUEL_CELL_SIZE;const vy=rand(1,2);fuelCells.push({x,y,w:FUEL_CELL_SIZE,h:FUEL_CELL_SIZE,vy});};
  setInterval(spawnObstacle,SPAWN_RATE);
  setInterval(spawnFuelCell,FUEL_CELL_RATE);
  const update=dt=>{if(!rocket.alive)return;rocket.vy+=GRAVITY;rocket.y+=rocket.vy;rocket.x=Math.max(0,Math.min(canvas.width-rocket.w,rocket.x));if(rocket.y>canvas.height-rocket.h||(rocket.fuel<=0&&rocket.vy>0)){rocket.alive=false;playCrash();}obstacles.forEach(o=>{o.x+=o.vx;o.y+=o.vy;});while(obstacles.length&& (obstacles[0].x<-OBSTACLE_SIZE||obstacles[0].x>canvas.width+OBSTACLE_SIZE))obstacles.shift();fuelCells.forEach(f=>f.y+=f.vy);fuelCells.forEach((f,i)=>{if(rectCollision(rocket,f)){rocket.fuel=Math.min(100,rocket.fuel+30);fuelCells.splice(i,1);rocket.score+=10;playCollect();}});while(fuelCells.length&&fuelCells[0].y>canvas.height)fuelCells.shift();if(obstacles.some(o=>rectCollision(rocket,o))){rocket.alive=false;playCrash();}rocket.score=Math.floor(rocket.score+dt*0.02);};
  const draw=()=>{
  // background gradient
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#001d3d');
  grad.addColorStop(1,'#000814');
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,255,255,${s.opacity})`;
    ctx.fill();
  });
  // rocket (triangle)
  ctx.save();
  ctx.translate(rocket.x+rocket.w/2, rocket.y+rocket.h/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillStyle='#ff0';
  ctx.beginPath();
  ctx.moveTo(-rocket.w/2, rocket.h/2);
  ctx.lineTo(rocket.w/2, rocket.h/2);
  ctx.lineTo(0,-rocket.h/2);
  ctx.closePath();
  ctx.fill();
  // thrust flame
  if(rocket.thrust && rocket.alive){
    ctx.fillStyle='orange';
    ctx.beginPath();
    ctx.moveTo(-rocket.w/4, rocket.h/2);
    ctx.lineTo(rocket.w/4, rocket.h/2);
    ctx.lineTo(0, rocket.h/2 + 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  // obstacles (asteroids as circles)
  ctx.fillStyle='#a33';
  obstacles.forEach(o=>{
    ctx.beginPath();
    ctx.arc(o.x+o.w/2, o.y+o.h/2, o.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  // fuel cells (glowing)
  fuelCells.forEach(f=>{
    ctx.beginPath();
    ctx.arc(f.x+f.w/2, f.y+f.h/2, f.w/2, 0, Math.PI*2);
    ctx.fillStyle='rgba(0,255,0,0.8)';
    ctx.fill();
    ctx.strokeStyle='rgba(0,255,0,0.5)';
    ctx.stroke();
  });
  // UI
  ctx.fillStyle='#fff';
  ctx.font='16px sans-serif';
  ctx.fillText(`Fuel: ${rocket.fuel.toFixed(0)}`,10,20);
  ctx.fillText(`Score: ${rocket.score}`,10,40);
  if(!rocket.alive){
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#fff';
    ctx.textAlign='center';
    ctx.font='30px sans-serif';
    ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
  }
  // reset thrust flag
  rocket.thrust=false;
};
  let last=performance.now();
  const loop=now=>{const dt=now-last;last=now;update(dt);draw();requestAnimationFrame(loop);};
  requestAnimationFrame(loop);
})();