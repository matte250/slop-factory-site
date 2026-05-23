// Simple canvas game based on IDEA.md
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.clientWidth||800;
  const H=canvas.height=canvas.clientHeight||600;
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200;
    gain.gain.value = 0.05;
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  };
  const playCollision = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };
  const playOrb = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  // generate background stars once
  for(let i=0;i<100;i++){
    stars.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*1.5+0.5,
      twinkle: Math.random()*0.5+0.5
    });
  }

  // ---- Game objects ----
  const ship={x:W/2,y:H/2,angle:0,vx:0,vy:0,r:10};
  const asteroids=[]; // each {x,y,vx,vy,r}
  const orbs=[]; // each {x,y,r,ttl}
  const stars=[]; // background stars
  let keys={};
  let score=0, orbScore=0, start=Date.now();
  let gameOver=false;
  let asteroidSpawn=2000; // ms
  let lastAsteroid=Date.now();
  let orbSpawn=5000;
  let lastOrb=Date.now();

  // ---- Input ----
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') playThrust();
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') stopThrust();
  });

  function update(dt){
    if(gameOver) return;
    // ship controls
    if(keys['ArrowLeft']) ship.angle-=0.003*dt;
    if(keys['ArrowRight']) ship.angle+=0.003*dt;
    if(keys['ArrowUp']){ // thrust
      ship.vx+=Math.cos(ship.angle)*0.001*dt;
      ship.vy+=Math.sin(ship.angle)*0.001*dt;
    }
    // move ship
    ship.x+=ship.vx*dt; ship.y+=ship.vy*dt;
    // screen wrap
    if(ship.x<0) ship.x+=W; if(ship.x>W) ship.x-=W;
    if(ship.y<0) ship.y+=H; if(ship.y>H) ship.y-=H;

    // spawn asteroids
    if(Date.now()-lastAsteroid>asteroidSpawn){
      const angle=Math.random()*Math.PI*2;
      const speed=0.05+Math.random()*0.1;
    asteroids.push({
      x: Math.random()*W,
      y: Math.random()*H,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      r: 15 + Math.random()*20,
      angle: Math.random()*Math.PI*2,
      angularVel: (Math.random()-0.5)*0.001,
      ttl: 0 // unused
    });
      lastAsteroid=Date.now();
      // increase difficulty
      if(asteroidSpawn>500) asteroidSpawn-=50;
    }
    // spawn orbs
    if(Date.now()-lastOrb>orbSpawn){
      orbs.push({x:Math.random()*W,y:Math.random()*H,r:5,ttl:10000});
      lastOrb=Date.now();
    }

    // update asteroids
    for(let a of asteroids){
      a.x+=a.vx*dt; a.y+=a.vy*dt;
      // rotate asteroid
      a.angle += a.angularVel * dt;
      if(a.x<0) a.x+=W; if(a.x>W) a.x-=W;
      if(a.y<0) a.y+=H; if(a.y>H) a.y-=H;
    }
    // update orbs ttl
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      o.ttl-=dt; if(o.ttl<=0) orbs.splice(i,1);
    }

    // collisions ship-asteroid
    for(let a of asteroids){
      const dx=ship.x-a.x, dy=ship.y-a.y;
      const dist=Math.hypot(dx,dy);
      if(dist<ship.r+a.r){gameOver=true; playCollision(); break;}
    }
    // ship-orb collection
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      const dx=ship.x-o.x, dy=ship.y-o.y;
if(Math.hypot(dx,dy)<ship.r+o.r){
          orbScore+=10; orbs.splice(i,1); playOrb();
        }
    }
    // score based on time
    score=Math.floor((Date.now()-start)/1000)+orbScore;
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
// ship with optional thrust flame
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // thrust flame
  if (keys['ArrowUp']) {
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, -5);
    ctx.lineTo(-20, 5);
    ctx.closePath();
    ctx.fillStyle = 'orange';
    ctx.fill();
  }
  // ship body
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, 6);
  ctx.lineTo(-8, -6);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();
    // background stars
    ctx.fillStyle='white';
    for(let s of stars){
      ctx.globalAlpha = s.twinkle * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 + s.x + s.y));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    // asteroids with rotation
    for(let a of asteroids){
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = 'gray';
      ctx.beginPath();
      ctx.moveTo(a.r,0);
      ctx.lineTo(-a.r*0.6, a.r*0.8);
      ctx.lineTo(-a.r*0.6, -a.r*0.8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // orbs with glow
    for(let o of orbs){
      const grad=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*3);
      grad.addColorStop(0,'rgba(0,255,0,0.8)');
      grad.addColorStop(1,'rgba(0,255,0,0)');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle='white';
    ctx.font='16px monospace';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.textAlign='center';
      ctx.font='48px monospace';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  let last=performance.now();
  function loop(now){
    const dt=now-last; last=now;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
