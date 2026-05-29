// Enhanced canvas game: dodge falling asteroids with improved graphics
(function(){
  const canvas=document.getElementById('game');
  if(!canvas) return;
  const ctx=canvas.getContext('2d');
  const w=canvas.width||800, h=canvas.height||600;
  canvas.width=w; canvas.height=h;
 
  // starfield background
  const stars=[]; const STAR_COUNT=100;
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:Math.random()*w, y:Math.random()*h, r:Math.random()*1.5+0.5, tw:Math.random()*0.5+0.5});
  }
 
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playCollision(){ playBeep(150); }
  function playSpawn(){ playBeep(300); }
 
  const ship={w:40, h:20, x:w/2, y:h-30, speed:5};
  const keys={};
  document.addEventListener('keydown',e=>{audioCtx.resume(); if(e.key==='ArrowLeft'||e.key==='ArrowRight')keys[e.key]=true;});
  document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')keys[e.key]=false;});
 
  const asteroids=[];
  let lastSpawn=0, score=0, gameOver=false;

  function spawn(){
    const radius=15+Math.random()*10;
    asteroids.push({x:Math.random()* (w-2*radius)+radius, y:-radius, r:radius, speed:2+Math.random()*3});
    playSpawn();
  }

  function update(dt){
    if(keys['ArrowLeft']) ship.x-=ship.speed;
    if(keys['ArrowRight']) ship.x+=ship.speed;
    ship.x=Math.max(ship.w/2, Math.min(w-ship.w/2, ship.x));

    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.y+=a.speed;
      if(a.y-a.r>h){ asteroids.splice(i,1); score++; }
      // collision with ship rectangle
      const dx=Math.abs(a.x-ship.x);
      const dy=Math.abs(a.y-(ship.y+ship.h/2));
      if(dx<a.r+ship.w/2 && dy<a.r+ship.h/2){ playCollision(); gameOver=true; }
    }
    if(Date.now()-lastSpawn>1000){ spawn(); lastSpawn=Date.now(); }
  }

  function draw(){
    // background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,w,h);
    // stars (twinkling)
    stars.forEach(s=>{ctx.fillStyle='white'; ctx.globalAlpha=0.5+0.5*Math.sin(Date.now()*0.002+s.tw*10); ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();});
    ctx.globalAlpha=1.0;
    // ship (gradient triangle)
    const shipGrad=ctx.createLinearGradient(0,ship.y,0,ship.y+ship.h);
    shipGrad.addColorStop(0,'orange');
    shipGrad.addColorStop(1,'red');
    ctx.fillStyle=shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x-ship.w/2, ship.y+ship.h);
    ctx.lineTo(ship.x+ship.w/2, ship.y+ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad=ctx.createRadialGradient(a.x,a.y,a.r*0.2,a.x,a.y,a.r);
      grad.addColorStop(0,'#777');
      grad.addColorStop(1,'#222');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill();
    });
    // score
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='48px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over', w/2, h/2);
    }
  }

  let last=performance.now();
  function loop(ts){
    const dt=ts-last; last=ts;
    if(!gameOver){ update(dt); draw(); requestAnimationFrame(loop);} else { draw(); }
  }
  requestAnimationFrame(loop);
})();
