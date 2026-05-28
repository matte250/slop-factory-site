// Neon Runner – enhanced graphics
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){return;}
  const ctx=canvas.getContext('2d');
  const W=canvas.width=window.innerWidth;
  const H=canvas.height=window.innerHeight;
  // player – neon rectangle with glow
  const player={x:W/2-15,y:H-60,w:30,h:30,vy:0,color:'#0ff'};
  const GRAVITY=0.6, JUMP=-12, SPEED=3;
  const keys={};
  addEventListener('keydown',e=>{keys[e.key]=true;if(audioCtx.state==='suspended'){audioCtx.resume();}});
  addEventListener('keyup',e=>{keys[e.key]=false;});
  // audio – simple synth tones
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // background ambient tone
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // obstacles – glowing squares that rotate
  const obs=[];
  const OBSTACLE_FREQ=1200; // ms
  let lastObs=0,score=0,alive=true;
  function spawn(){
    const size=Math.random()*30+20;
    const gap=Math.random()*0.6+0.2; // gap width ratio
    const x=Math.random()<gap?Math.random()*W*gap:Math.random()*W*(1-gap)+W*gap;
    obs.push({
      x,
      y:-size,
      w:size,
      h:size,
      speed:4+score/1000,
      color:'#f0f',
      angle:0,
      angularSpeed:(Math.random()-0.5)*0.04 // slow rotation
    });
  }
  function update(dt){
    if(!alive) return;
    // player movement
    if(keys['ArrowLeft']||keys['a']) player.x-=SPEED;
    if(keys['ArrowRight']||keys['d']) player.x+=SPEED;
    if((keys['ArrowUp']||keys['w']||keys[' ']) && player.vy===0){player.vy=JUMP;playTone(440,0.2);}
    player.vy+=GRAVITY;
    player.y+=player.vy;
    if(player.y+player.h>H){player.y=H-player.h;player.vy=0;}
    // keep inside bounds
    if(player.x<0) player.x=0;
    if(player.x+player.w>W) player.x=W-player.w;
    // obstacles
    const now=Date.now();
    if(now-lastObs>OBSTACLE_FREQ){spawn();lastObs=now;}
    for(let i=obs.length-1;i>=0;i--){
      const o=obs[i];
      o.y+=o.speed;
      o.angle+=o.angularSpeed;
      if(o.y>H) obs.splice(i,1);
      // collision
      if(o.x<player.x+player.w && o.x+o.w>player.x && o.y<player.y+player.h && o.y+o.h>player.y){alive=false;playTone(220,0.4); }
    }
    score+=dt;
  }
  function draw(){
    // neon gradient background
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#001');
    bg.addColorStop(1,'#003');
    ctx.fillStyle=bg;
    ctx.fillRect(0,0,W,H);
    // player with glow
    ctx.save();
    ctx.shadowBlur=12;
    ctx.shadowColor=player.color;
    ctx.fillStyle=player.color;
    ctx.fillRect(player.x,player.y,player.w,player.h);
    ctx.restore();
    // obstacles with glow and rotation
    obs.forEach(o=>{
      ctx.save();
      ctx.translate(o.x+o.w/2,o.y+o.h/2);
      ctx.rotate(o.angle);
      ctx.shadowBlur=8;
      ctx.shadowColor=o.color;
      ctx.fillStyle=o.color;
      ctx.fillRect(-o.w/2,-o.h/2,o.w,o.h);
      ctx.restore();
    });
    // score
    ctx.fillStyle='#fff';
    ctx.font='20px monospace';
    ctx.fillText('Score: '+Math.floor(score/1000),10,30);
    if(!alive){
      ctx.fillStyle='#f88';
      ctx.font='40px monospace';
      ctx.fillText('Game Over',W/2-100,H/2);
    }
  }
  let last=performance.now();
  function loop(t){
    const dt=t-last;
    last=t;
    update(dt);
    draw();
    if(alive) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
