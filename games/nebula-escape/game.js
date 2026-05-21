// Simple endless runner based on IDEA.md
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const resize=()=>{canvas.width=window.innerWidth;canvas.height=window.innerHeight;};
  window.addEventListener('resize',resize);resize();

  const ship={x:canvas.width/2,y:canvas.height*0.8,w:12,h:20,dx:0,dy:0,score:0,fuel:100,alive:true};
  const keys={};
  const orbs=[], asteroids=[], nebula=[], stars=[];
  const SPAWN_ORB=2000, SPAWN_AST=3000, MAX_ORB=30, MAX_AST=20;
  const SPAWN_NEBULA=500, MAX_NEBULA=50;
  const STAR_COUNT=100;
  let lastOrb=0,lastAst=0, lastNebula=0, lastTime=0;
  // initialize starfield
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, size:1+Math.random()*2});
  }
  // sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollect(){ playTone(800, 0.1); }
  function playCrash(){ playTone(200, 0.3); }
  function playBoost(){ playTone(1200, 0.05); }


  // input
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function drawShip(){
    // ship with gradient shading
    const grad = ctx.createLinearGradient(ship.x, ship.y-ship.h/2, ship.x, ship.y+ship.h/2);
    grad.addColorStop(0, '#f0f'); // top tip color
    grad.addColorStop(1, '#08f'); // bottom color
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y-ship.h/2);
    ctx.lineTo(ship.x-ship.w/2, ship.y+ship.h/2);
    ctx.lineTo(ship.x+ship.w/2, ship.y+ship.h/2);
    ctx.closePath();
    ctx.fill();
  }
  function drawOrbs(){
    orbs.forEach(o=>{
      ctx.fillStyle=o.color || 'lime';
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r,0,2*Math.PI);
      ctx.fill();
    });
  }
  function drawAsteroids(){
    // asteroids with rotation and semi‑transparent shading
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const ang=((i*2*Math.PI)/5)-Math.PI/2;
        const r=i%2? a.r*0.6 : a.r;
        ctx.lineTo(Math.cos(ang)*r, Math.sin(ang)*r);
      }
      ctx.closePath();
      ctx.fillStyle='rgba(200,200,200,0.8)';
      ctx.fill();
      ctx.restore();
      // update rotation for next frame
      a.angle += a.rotSpeed;
    });
  }
  function spawnOrb(){
    if(orbs.length<MAX_ORB){
      const r=6+Math.random()*4;
      const gradColor='rgba(0,255,0,'+(0.6+Math.random()*0.3)+')';
      orbs.push({x:Math.random()*canvas.width, y:-10, r, color:gradColor});
    }
  }

  function spawnNebula(){
    if(nebula.length<MAX_NEBULA){
      const r=30+Math.random()*50;
      const angle=Math.random()*2*Math.PI;
      const rotSpeed=(Math.random()-0.5)*0.001;
      nebula.push({x:Math.random()*canvas.width, y:-r, r, angle, rotSpeed});
    }
  }

  function drawNebula(){
    nebula.forEach(n=>{
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.angle);
      const grad=ctx.createRadialGradient(0,0,n.r*0.3,0,0,n.r);
      grad.addColorStop(0,'rgba(150,0,200,0.2)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(0,0,n.r,0,2*Math.PI);
      ctx.fill();
      ctx.restore();
      n.angle+=n.rotSpeed;
    });
  }
  function spawnAst(){
    if(asteroids.length<MAX_AST){
      const r=12+Math.random()*8;
      const angle=Math.random()*2*Math.PI;
      const rotSpeed=(Math.random()-0.5)*0.03;
      asteroids.push({x:Math.random()*canvas.width, y:-r, r, angle, rotSpeed});
    }
  }
  function update(dt){
    // controls
    ship.dx=0;
    if(keys['ArrowLeft']) ship.dx=-3;
    if(keys['ArrowRight']) ship.dx=3;
    if(keys['ArrowUp']) ship.dy=-5; else ship.dy=2; // forward speed
    // move ship
    ship.x+=ship.dx; ship.y+=ship.dy;
    // keep inside canvas
    ship.x=Math.max(ship.w/2, Math.min(canvas.width-ship.w/2, ship.x));
    ship.y=Math.max(ship.h/2, Math.min(canvas.height-ship.h/2, ship.y));
    // fuel consumption
    ship.fuel-=dt*0.02; // per ms
    // background scroll speed
    const speed=2+ship.dy;
    // move pickups and obstacles
    orbs.forEach(o=>o.y+=speed);
    asteroids.forEach(a=>a.y+=speed);
    nebula.forEach(n=>n.y+=speed);
    // remove off‑screen
    while(orbs.length && orbs[0].y>canvas.height+10) orbs.shift();
    while(asteroids.length && asteroids[0].y>canvas.height+10) asteroids.shift();
    while(nebula.length && nebula[0].y>canvas.height+10) nebula.shift();
    // collision detection
    orbs.forEach((o,i)=>{if(Math.hypot(o.x-ship.x,o.y-ship.y)<o.r+ship.w/2){ship.fuel=Math.min(100, ship.fuel+20); ship.score+=10; playCollect(); orbs.splice(i,1);}});
    asteroids.forEach((a,i)=>{if(Math.hypot(a.x-ship.x,a.y-ship.y)<a.r+ship.w/2){ship.alive=false; playCrash();}});
    // score and fuel checks
    ship.score+=dt*0.01;
    if(ship.fuel<=0) ship.alive=false;
  }
  function drawStars(){
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,2*Math.PI);ctx.fill();});
  }

function draw(){
    // background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // starfield
    drawStars();
    // nebula clouds
    drawNebula();
    // pickups and obstacles
    drawOrbs();
    drawAsteroids();
    // player ship
    drawShip();
    // UI
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.textAlign='left';
    ctx.fillText('Score: '+Math.floor(ship.score),10,20);
    ctx.fillText('Fuel: '+Math.floor(ship.fuel),10,40);
    if(!ship.alive){
      ctx.fillStyle='red';
      ctx.textAlign='center';
      ctx.font='48px sans-serif';
      ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
    }
  }
  function loop(ts){
    if(!lastTime) lastTime=ts;
    const dt=ts-lastTime;
    lastTime=ts;
    if(ship.alive){
      if(ts-lastOrb>SPAWN_ORB) {spawnOrb();lastOrb=ts;}
      if(ts-lastAst>SPAWN_AST) {spawnAst();lastAst=ts;}
      update(dt);
    }
    draw();
    if(ship.alive) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
