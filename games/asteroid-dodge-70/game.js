// Simple Asteroid Dodge game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.clientWidth||800;
  const H=canvas.height=canvas.clientHeight||400;
  const ship={x:80,y:H/2,w:20,h:30,vy:0, thrusting:false};
  const GRAV=0.4,THRUST=-8;
  // sound effects
  const thrustAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAA='); // short thrust sound placeholder
  const crashAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAA='); // crash sound placeholder
  let crashPlayed = false;
  const asteroids=[];
  const stars=[]; const STAR_COUNT=80;
  let lastSpawn=0, spawnRate=1500, score=0, running=true;
  function reset(){
    ship.y=H/2; ship.vy=0; asteroids.length=0; score=0; running=true; lastSpawn=performance.now();
    // initialize stars
    stars.length=0;
    for(let i=0;i<STAR_COUNT;i++){
      stars.push({x:Math.random()*W, y:Math.random()*H, radius:Math.random()*1.5+0.5, speed:0.5+Math.random()*0.5});
    }
    // reset sound flags
    crashPlayed = false;
    ship.thrusting = false;
  }
  function spawn(){
    const size=Math.random()*30+20;
    const speed=2+Math.random()*3;
    const angle=0;
    const rotSpeed=(Math.random()-0.5)*0.1; // rotation per frame
    asteroids.push({x:W+size, y:Math.random()*(H-size), r:size/2, speed, angle, rotSpeed});
  }
  function update(dt){
    // ship physics
    ship.vy+=GRAV; ship.y+=ship.vy;
    if(ship.y>H||ship.y<0){running=false;}
    // update stars (parallax background and twinkle)
    for(let i=stars.length-1;i>=0;i--){
      const s=stars[i];
      s.x-=s.speed;
      if(s.x<0){s.x=W; s.y=Math.random()*H;}
      // subtle twinkle
      s.radius += (Math.random()-0.5)*0.02;
      if(s.radius<0.4) s.radius=0.4;
      if(s.radius>2) s.radius=2;
    }
    // asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.x-=a.speed;
      a.angle+=a.rotSpeed; // rotate asteroid
      if(a.x<-a.r) {asteroids.splice(i,1); score++;}
      // collision
      const dx=ship.x-(a.x);
      const dy=ship.y-(a.y+a.r);
      const dist=Math.hypot(dx,dy);
      if(dist<a.r+ship.h/2){running=false; if(!crashPlayed){crashAudio.play(); crashPlayed=true;}}
    }
    if(running && performance.now()-lastSpawn>spawnRate){spawn(); lastSpawn=performance.now();}
  }
  function draw(){
    // background gradient
    const bgGrad=ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#001d3a');
    bgGrad.addColorStop(1,'#001122');
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.radius,0,2*Math.PI);ctx.fill();});
    // ship (triangle with stroke)
    ctx.fillStyle='cyan';
    ctx.strokeStyle='black';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(ship.x,ship.y);
    ctx.lineTo(ship.x-ship.w/2,ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w/2,ship.y+ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // thrust flame
    if(ship.thrusting){
      ctx.fillStyle='orange';
      ctx.beginPath();
      ctx.moveTo(ship.x,ship.y+ship.h);
      ctx.lineTo(ship.x-ship.w/4,ship.y+ship.h+10);
      ctx.lineTo(ship.x+ship.w/4,ship.y+ship.h+10);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad=ctx.createRadialGradient(a.x,a.y+a.r,a.r*0.2,a.x,a.y+a.r,a.r);
      grad.addColorStop(0,'#909090');
      grad.addColorStop(1,'#303030');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y+a.r,a.r,0,2*Math.PI);
      ctx.fill();
    });
    // score
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.textAlign='left';
    ctx.fillText('Score: '+score,10,20);
    if(!running){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='white';
      ctx.textAlign='center';
      ctx.font='20px sans-serif';
      ctx.fillText('Game Over – Press Space to Restart',W/2,H/2);
    }
  }
  function loop(ts){
    const dt=16; // fixed step for simplicity
    if(running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  // controls
  window.addEventListener('keydown',e=>{if(e.code==='Space'){if(!running){reset();} ship.vy=THRUST; ship.thrusting=true; thrustAudio.currentTime=0; thrustAudio.play();}});
window.addEventListener('keyup',e=>{if(e.code==='Space'){ship.thrusting=false;}});
  // start
  reset();
  requestAnimationFrame(loop);
})();
