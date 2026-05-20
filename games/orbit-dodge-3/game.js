// Orbit Dodge – minimal canvas game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const w=canvas.width=canvas.clientWidth||400;
  const h=canvas.height=canvas.clientHeight||400;
  const center={x:w/2,y:h/2};
  // star field for background
  const stars=[]; for(let i=0;i<100;i++) stars.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+0.5});
  const ship={angle:0,radius:150,angVel:0,thrust:0,x:0,y:0,size:6};
  const asteroids=[];
  let score=0,keys={};
  // audio setup
  const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  function playTone(freq,dur){
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.frequency.value=freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now=audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001,now);
    gain.gain.exponentialRampToValueAtTime(0.2,now+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001,now+dur/1000);
    osc.start(now);
    osc.stop(now+dur/1000);
  }
  // input handling
  window.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(e.key==='ArrowUp') playTone(440,100); // thrust sound
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function drawPolygon(x,y,size,angle,verts){
    ctx.beginPath();
    for(let i=0;i<verts.length;i++){
      const a=angle+verts[i]*Math.PI*2/verts.length;
      const vx=x+Math.cos(a)*size;
      const vy=y+Math.sin(a)*size;
      if(i===0) ctx.moveTo(vx,vy); else ctx.lineTo(vx,vy);
    }
    ctx.closePath();
    ctx.fill();
  }
  function spawn(){
    const a=Math.random()*Math.PI*2;
    const r=Math.max(w,h);
    // generate irregular asteroid shape (5 vertices with random radii)
    const verts=Array.from({length:5},()=>0.8+Math.random()*0.4);
    asteroids.push({angle:a,radius:r,spd:1.5+Math.random()*1,size:8,verts});
    playTone(200,50); // spawn sound
  }
  function update(dt){
    // ship control
    if(keys['ArrowLeft']) ship.angVel=-0.003*dt;
    else if(keys['ArrowRight']) ship.angVel=0.003*dt;
    else ship.angVel*=0.98;
    if(keys['ArrowUp']) ship.thrust=0.04*dt; else ship.thrust*=0.95;
    ship.angle+=ship.angVel;
    ship.radius+=ship.thrust;
    // keep ship within bounds
    ship.radius=Math.max(20,Math.min(Math.max(w,h)/2,ship.radius));
    ship.x=center.x+Math.cos(ship.angle)*ship.radius;
    ship.y=center.y+Math.sin(ship.angle)*ship.radius;
    // asteroids move inward
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.radius-=a.spd*dt;
      if(a.radius<20){asteroids.splice(i,1);score++;continue;}
      const ax=center.x+Math.cos(a.angle)*a.radius;
      const ay=center.y+Math.sin(a.angle)*a.radius;
      // collision
      const dx=ship.x-ax, dy=ship.y-ay;
      if(dx*dx+dy*dy < (ship.size+a.size)*(ship.size+a.size)){
        // collision sound
        playTone(100,200);
        // reset game
        asteroids.length=0;score=0;ship.radius=150;ship.angle=0;ship.angVel=0;ship.thrust=0;
        break;
      }
    }
    // spawn occasional asteroids
    if(Math.random()<0.02) spawn();
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    // background stars
    ctx.fillStyle='black';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle='white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    }
    // planet with radial gradient
    const grad=ctx.createRadialGradient(center.x,center.y,10,center.x,center.y,30);
    grad.addColorStop(0,'#555');
    grad.addColorStop(1,'#111');
    ctx.fillStyle=grad;
    ctx.beginPath();ctx.arc(center.x,center.y,30,0,Math.PI*2);ctx.fill();
    // ship as triangle
    ctx.fillStyle='cyan';
    drawPolygon(ship.x,ship.y,ship.size,ship.angle,[0,0.4,0.8]);
    // asteroids as irregular polygons
    ctx.fillStyle='orange';
    for(const a of asteroids){
      const ax=center.x+Math.cos(a.angle)*a.radius;
      const ay=center.y+Math.sin(a.angle)*a.radius;
      drawPolygon(ax,ay,a.size,a.angle,a.verts);
    }
    // score
    ctx.fillStyle='white';
    ctx.font='14px sans-serif';
    ctx.fillText('Score: '+score,10,20);
  }
  let last=performance.now();
  function loop(){
    const now=performance.now();
    const dt=now-last;
    last=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
