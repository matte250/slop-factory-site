// Simple Orbit Dodge game
(function(){
  let gameOver=false;
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(300, 0.1); }
  function playCollect() { playTone(600, 0.08); }
  function playGameOver() { playTone(150, 0.5); }
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth||400;
  const H = canvas.height = canvas.clientHeight||400;
  const planet = {x:W/2,y:H/2,r:30};
  const ship = {angle:0, radius:80, vel:0};
  const keys={};
  const asteroids=[]; const stars=[]; const STAR_COUNT=100; for(let i=0;i<STAR_COUNT;i++){stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.5});}
  let score=0, lastSpawn=0;
  const spawnRate=800; // ms
  function rand(min,max){return Math.random()*(max-min)+min;}
  function addAst(){
    const a=rand(0,2*Math.PI);
    const r=Math.max(W,H);
    asteroids.push({x:planet.x+Math.cos(a)*r, y:planet.y+Math.sin(a)*r, angle:a, speed:1.5});
  }
  function update(dt){
    if(gameOver) return;
    // controls
    if(keys.ArrowLeft) ship.angle-=0.003*dt;
    if(keys.ArrowRight) ship.angle+=0.003*dt;
    if(keys.ArrowUp){ ship.vel=0.08; playThrust(); } else ship.vel*=0.99;
    ship.radius+=ship.vel*dt;
    if(ship.radius<planet.r+10) ship.radius=planet.r+10;
    // asteroids
    for(let i=asteroids.length-1;i>=0;--i){
      const a=asteroids[i];
      const dx=planet.x-a.x, dy=planet.y-a.y;
      const d=Math.hypot(dx,dy);
      a.x+=dx/d*a.speed*dt/16; a.y+=dy/d*a.speed*dt/16;
      // collision ship
      const sx=planet.x+Math.cos(ship.angle)*ship.radius;
      const sy=planet.y+Math.sin(ship.angle)*ship.radius;
      if(Math.hypot(a.x-sx,a.y-sy)<10){asteroids.splice(i,1); score+=1; playCollect();}
      // hit planet
      else if(d<planet.r){asteroids.splice(i,1); gameOver=true; playGameOver(); }
    }
    if(Date.now()-lastSpawn>spawnRate){addAst(); lastSpawn=Date.now();}
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    // stars background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,2*Math.PI);ctx.fill();});
    // planet with gradient
    const planetGrad=ctx.createRadialGradient(planet.x,planet.y,planet.r*0.2,planet.x,planet.y,planet.r);
    planetGrad.addColorStop(0,'#8B4513');
    planetGrad.addColorStop(1,'#3A2F0A');
    ctx.fillStyle=planetGrad;
    ctx.beginPath();ctx.arc(planet.x,planet.y,planet.r,0,2*Math.PI);ctx.fill();
    // ship as triangle
    const sx=planet.x+Math.cos(ship.angle)*ship.radius;
    const sy=planet.y+Math.sin(ship.angle)*ship.radius;
    const frontX=sx, frontY=sy;
    const backDist=8;
    const backX=planet.x+Math.cos(ship.angle)*(ship.radius-backDist);
    const backY=planet.y+Math.sin(ship.angle)*(ship.radius-backDist);
    const perpAngle=ship.angle+Math.PI/2;
    const leftX=backX+Math.cos(perpAngle)*5;
    const leftY=backY+Math.sin(perpAngle)*5;
    const rightX=backX-Math.cos(perpAngle)*5;
    const rightY=backY-Math.sin(perpAngle)*5;
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(frontX,frontY);
    ctx.lineTo(leftX,leftY);
    ctx.lineTo(rightX,rightY);
    ctx.closePath();
    ctx.fill();
    // asteroids with stroke
    ctx.fillStyle='dimgray';
    ctx.strokeStyle='gray';
    ctx.lineWidth=2;
    asteroids.forEach(a=>{ctx.beginPath();ctx.arc(a.x,a.y,8,0,2*Math.PI);ctx.fill();ctx.stroke();});
    // score
    ctx.fillStyle='white'; ctx.font='16px sans-serif'; ctx.fillText('Score: '+score,10,20);
  }
  let last=performance.now();
  function loop(now){
    const dt=now-last; last=now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  window.addEventListener('keydown',e=>{ keys[e.key]=true; audioCtx.resume(); });
  window.addEventListener('keyup',e=>keys[e.key]=false);
  requestAnimationFrame(loop);
})();
