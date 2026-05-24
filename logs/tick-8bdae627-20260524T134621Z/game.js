// Nebula Runner – enhanced graphics implementation
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const W=canvas.width=window.innerWidth;
  const H=canvas.height=window.innerHeight;

  const keys={};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  // generate starfield
  const stars=[]; for(let i=0;i<150;i++) stars.push({x:Math.random()*W, y:Math.random()*H, speed:0.2+Math.random()*0.4});
  // sound effects
  const sounds={
    dash:new Audio('https://www.soundjay.com/button/sounds/button-09.mp3'),
    hit:new Audio('https://www.soundjay.com/button/sounds/button-10.mp3'),
    orb:new Audio('https://www.soundjay.com/button/sounds/button-3.mp3'),
    gameOver:new Audio('https://www.soundjay.com/misc/sounds/fail-trombone-01.mp3')
  };

  const player={x:W/2, y:H/2, r:12, speed:2, vx:0, vy:0, health:3, shield:0, dashCooldown:0, boost:0};
  const asteroids=[], drones=[], orbs=[];
  let lastSpawn=0, lastOrb=0, score=0;

  function spawn(type){
    const side=Math.random()<0.5?0:1; // 0 left/top, 1 right/bottom
    const obj={x:0,y:0,r:12, vx:0, vy:0};
    if(type==='asteroid'){
      obj.r=14; obj.vx=-1.5-Math.random(); obj.vy=0; obj.x=side?W:0; obj.y=Math.random()*H;
    }else if(type==='drone'){
      obj.r=10; obj.vx=-2-Math.random(); obj.vy=0; obj.x=side?W:0; obj.y=Math.random()*H;
    }
    (type==='asteroid'?asteroids:drones).push(obj);
  }
  function spawnOrb(){
    const obj={x:Math.random()*W, y:-10, r:8, vy:1.5};
    orbs.push(obj);
  }

  // trail buffer for player glow effect
  const trail=[]; // store recent positions

  // game state flag for game over sound
  let gameOverPlayed=false;

  function update(dt){
    // player movement
    player.vx=0; player.vy=0;
    if(keys.ArrowLeft) player.vx=-player.speed;
    if(keys.ArrowRight) player.vx=player.speed;
    if(keys.ArrowUp) player.vy=-player.speed;
    if(keys.ArrowDown) player.vy=player.speed;
    player.x+=player.vx; player.y+=player.vy;
    // keep inside
    player.x=Math.max(0,Math.min(W,player.x));
    player.y=Math.max(0,Math.min(H,player.y));

    // record trail
    trail.push({x:player.x, y:player.y, alpha:1});
    if(trail.length>10) trail.shift();

    // dash
    if(keys[' '] && player.dashCooldown<=0){
      player.x+=player.vx*15; player.y+=player.vy*15; player.dashCooldown=60; // frames
      sounds.dash.currentTime=0; sounds.dash.play();
    }
    if(player.dashCooldown>0) player.dashCooldown--;

    // spawn obstacles
    if(Date.now()-lastSpawn>1500){spawn('asteroid'); spawn('drone'); lastSpawn=Date.now();}
    if(Date.now()-lastOrb>3000){spawnOrb(); lastOrb=Date.now();}

    // update stars for parallax effect
    stars.forEach(s=>{s.x-=s.speed; if(s.x<0){s.x=W; s.y=Math.random()*H;}});

    // update asteroids
    asteroids.forEach((a,i)=>{a.x+=a.vx; if(a.x< -20) asteroids.splice(i,1);});
    drones.forEach((d,i)=>{d.x+=d.vx; if(d.x< -20) drones.splice(i,1);});
    orbs.forEach((o,i)=>{o.y+=o.vy; if(o.y>H+20) orbs.splice(i,1);});

    // collisions
    function collide(obj){
      const dx=player.x-obj.x, dy=player.y-obj.y; const dist=Math.hypot(dx,dy);
      return dist<player.r+obj.r;
    }
    asteroids.forEach((a,i)=>{if(collide(a)){player.health--; sounds.hit.currentTime=0; sounds.hit.play(); asteroids.splice(i,1);}});
    drones.forEach((d,i)=>{if(collide(d)){if(player.shield){player.shield--;} else {player.health--; sounds.hit.currentTime=0; sounds.hit.play();} drones.splice(i,1);}});
    orbs.forEach((o,i)=>{if(collide(o)){player.speed+=0.5; player.boost=180; sounds.orb.currentTime=0; sounds.orb.play(); orbs.splice(i,1);}});
    if(player.boost>0){player.boost--; if(player.boost===0) player.speed=2;}
  }

  function draw(){
    // background gradient (nebula)
    const bg=ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#001020');
    bg.addColorStop(1,'#000000');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // starfield (parallax)
    ctx.fillStyle='rgba(255,255,255,0.3)';
    stars.forEach(s=>{ctx.fillRect(s.x,s.y,2,2);});
    // trail glow
    trail.forEach((p,i)=>{const t=i/trail.length; ctx.fillStyle=`rgba(0,255,255,${p.alpha*t})`; ctx.beginPath(); ctx.arc(p.x,p.y,player.r,0,2*Math.PI); ctx.fill();});
    // player with radial glow
    const grad=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,player.r*2);
    grad.addColorStop(0,'rgba(0,255,255,0.8)');
    grad.addColorStop(1,'rgba(0,100,255,0)');
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(player.x,player.y,player.r*2,0,2*Math.PI); ctx.fill();
    ctx.fillStyle='cyan'; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,2*Math.PI); ctx.fill();
    // asteroids with shading
    ctx.fillStyle='dimgray'; asteroids.forEach(a=>{ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,2*Math.PI); ctx.fill();});
    // drones with red gradient
    drones.forEach(d=>{const dg=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.r); dg.addColorStop(0,'rgba(255,80,80,0.9)'); dg.addColorStop(1,'rgba(150,0,0,0)'); ctx.fillStyle=dg; ctx.beginPath(); ctx.arc(d.x,d.y,d.r,0,2*Math.PI); ctx.fill();});
    // orbs pulsating
    ctx.fillStyle='yellow'; orbs.forEach(o=>{const pulse=Math.abs(Math.sin(Date.now()/200))*0.3+0.7; ctx.globalAlpha=pulse; ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,2*Math.PI); ctx.fill();}); ctx.globalAlpha=1;
    // UI
    ctx.fillStyle='white'; ctx.font='16px sans-serif';
    ctx.fillText('Health: '+player.health,10,20);
    ctx.fillText('Shield: '+player.shield,10,40);
  }

  let last=0;
  function loop(timestamp){
    const dt=timestamp-last; last=timestamp;
    update(dt);
    draw();
    if(player.health>0) requestAnimationFrame(loop); else {if(!gameOverPlayed){sounds.gameOver.currentTime=0; sounds.gameOver.play(); gameOverPlayed=true;} ctx.fillStyle='red'; ctx.font='48px sans-serif'; ctx.fillText('Game Over',W/2-120,H/2);}
  }
  requestAnimationFrame(loop);
})();
