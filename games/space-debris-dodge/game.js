(function(){
  const canvas=document.getElementById('game');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth;
  const height=canvas.height=canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  // Pre-generate starfield background
  const stars=[];
  for(let i=0;i<200;i++){
    stars.push({x:Math.random()*width,y:Math.random()*height,size:Math.random()*2+1});
  }
  const ship={x:width/2,y:height/2,size:15,speed:3};
  const keys={};
  const asteroids=[];
  const fuels=[];
  let score=0,alive=true;
  window.addEventListener('keydown',e=>{keys[e.key]=true;if(audioCtx.state==='suspended')audioCtx.resume();});
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function spawnAsteroid(){
    const edge=Math.floor(Math.random()*4);
    const size=20+Math.random()*30;let x,y,vx,vy;
    if(edge===0){x=0;y=Math.random()*height;vx=1+Math.random()*2;vy=(Math.random()-0.5)*2;}
    else if(edge===1){x=width;y=Math.random()*height;vx=-(1+Math.random()*2);vy=(Math.random()-0.5)*2;}
    else if(edge===2){x=Math.random()*width;y=0;vy=1+Math.random()*2;vx=(Math.random()-0.5)*2;}
    else{x=Math.random()*width;y=height;vy=-(1+Math.random()*2);vx=(Math.random()-0.5)*2;}
    asteroids.push({x,y,vx,vy,size});
  }
  function spawnFuel(){
    const x=Math.random()*width;
    const y=Math.random()*height;
    fuels.push({x,y,size:10});
  }
  function update(){
    if(!alive)return;
    if(keys.ArrowUp)ship.y-=ship.speed;
    if(keys.ArrowDown)ship.y+=ship.speed;
    if(keys.ArrowLeft)ship.x-=ship.speed;
    if(keys.ArrowRight)ship.x+=ship.speed;
    ship.x=Math.max(0,Math.min(width,ship.x));
    ship.y=Math.max(0,Math.min(height,ship.y));
    asteroids.forEach(a=>{a.x+=a.vx;a.y+=a.vy;});
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      if(a.x<-a.size||a.x>width+a.size||a.y<-a.size||a.y>height+a.size)asteroids.splice(i,1);
    }
    for(let i=fuels.length-1;i>=0;i--){
      const f=fuels[i];
      const dx=ship.x-f.x,dy=ship.y-f.y;
      if(Math.hypot(dx,dy)<ship.size+f.size){score+=10;fuels.splice(i,1);beep(800,150);}
    }
    for(const a of asteroids){
      const dx=ship.x-a.x,dy=ship.y-a.y;
      if(Math.hypot(dx,dy)<ship.size+a.size){beep(200,500);alive=false;break;}
    }
    if(Math.random()<0.02)spawnAsteroid();
    if(Math.random()<0.005)spawnFuel();
  }
  function draw(){
    // Black background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,width,height);
    // Starfield
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,2*Math.PI);ctx.fill();});
    // Ship (blue triangle)
    ctx.fillStyle='deepskyblue';
    ctx.beginPath();
    ctx.moveTo(ship.x,ship.y-ship.size);
    ctx.lineTo(ship.x-ship.size,ship.y+ship.size);
    ctx.lineTo(ship.x+ship.size,ship.y+ship.size);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient
    asteroids.forEach(a=>{
      const grad=ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,a.size);
      grad.addColorStop(0,'lightgray');
      grad.addColorStop(1,'dimgray');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(a.x,a.y,a.size,0,2*Math.PI);ctx.fill();
    });
    // Fuel cells with glowing gradient
    fuels.forEach(f=>{
      const grad=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,f.size);
      grad.addColorStop(0,'lime');
      grad.addColorStop(1,'green');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(f.x,f.y,f.size,0,2*Math.PI);ctx.fill();
    });
    // UI
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(!alive){ctx.fillStyle='red';ctx.fillText('Game Over',width/2-40,height/2);}
  }
  function loop(){update();draw();if(alive)requestAnimationFrame(loop);}
  requestAnimationFrame(loop);
})();