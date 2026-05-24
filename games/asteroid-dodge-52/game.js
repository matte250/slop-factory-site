// Asteroid Dodge game targeting <canvas id="game"></canvas>
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const W=canvas.width=canvas.clientWidth||800;
  const H=canvas.height=canvas.clientHeight||600;
  // Audio context
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur/1000);
  }
  // Ensure audio context is resumed on first interaction
  canvas.addEventListener('click',()=>{audioCtx.resume();});
  // Background stars
  const stars=[];
  for(let i=0;i<100;i++){
    stars.push({x:Math.random()*W, y:Math.random()*H, r:Math.random()*2+1, twinkle:Math.random()});
  }
  // Explosion particles
  const particles=[];
  // Ship
  const ship={x:W/2, y:H-50, w:30, h:40, speed:5};
  // Input
  const keys={};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect();ship.x=e.clientX-rect.left;});
  // Asteroids
  const asteroids=[];
  let spawnTimer=0, spawnInterval=1000, speed=2, score=0, lastTime=0;
function spawn(){
    const r=Math.random()*20+10;
    const x=Math.random()*(W-2*r)+r;
    // start just above the canvas
    const y=-r;
    const angle=0;
    const rotSpeed=(Math.random()-0.5)*0.02; // radians per ms
    asteroids.push({x, y, r, v:speed, angle, rotSpeed});
  }
  function update(dt){
    // ship movement via keys
    if(keys.ArrowLeft||keys.a) ship.x-=ship.speed;
    if(keys.ArrowRight||keys.d) ship.x+=ship.speed;
    ship.x=Math.max(ship.w/2, Math.min(W-ship.w/2, ship.x));
    // asteroids
    spawnTimer+=dt;
    if(spawnTimer>spawnInterval){spawnTimer=0; spawn(); beep(660,80);}
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.y+=a.v*dt/16;
      a.angle+=a.rotSpeed*dt; // rotate asteroid
      // collision (circle-rect approx)
      const dx=Math.abs(a.x-ship.x);
      const dy=Math.abs(a.y-(ship.y-ship.h/2));
      if(dx<a.r+ship.w/2 && dy<a.r+ship.h/2){gameOver();return;}
      if(a.y-a.r>H){asteroids.splice(i,1);score++;beep(440,100);}
    }
    // update particles
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;
      p.y+=p.vy;
      p.life--;
      p.alpha = p.life/60;
      if(p.life<=0) particles.splice(i,1);
    }
    // increase difficulty
    if(score%10===0 && score!==0){speed+=0.2; spawnInterval=Math.max(300,spawnInterval-30);}
  }
  function draw(){
    // background gradient
    const bgGrad=ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,"#001133");
    bgGrad.addColorStop(1,"#000011");
    ctx.fillStyle=bgGrad;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,2*Math.PI);ctx.fill();});
    // ship (triangle) with gradient
    const shipGrad=ctx.createLinearGradient(ship.x-ship.w/2,ship.y-ship.h/2,ship.x+ship.w/2,ship.y+ship.h/2);
    shipGrad.addColorStop(0,"#00ffdd");
    shipGrad.addColorStop(1,"#0099aa");
    ctx.fillStyle=shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y-ship.h/2);
    ctx.lineTo(ship.x-ship.w/2, ship.y+ship.h/2);
    ctx.lineTo(ship.x+ship.w/2, ship.y+ship.h/2);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient and rotation
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const radGrad=ctx.createRadialGradient(0,0,a.r*0.3,0,0,a.r);
      radGrad.addColorStop(0,"#888888");
      radGrad.addColorStop(1,"#222222");
      ctx.fillStyle=radGrad;
      ctx.beginPath();
      ctx.arc(0,0,a.r,0,2*Math.PI);
      ctx.fill();
      ctx.restore();
    });
    // score
    ctx.fillStyle='yellow';
    ctx.font='20px sans-serif';
    ctx.fillText('Score: '+score,10,30);
  }
  function loop(ts){
    const dt=ts-lastTime; lastTime=ts;
    update(dt);
    draw();
    if(running) requestAnimationFrame(loop);
  }
  let running=true;
  let totalTime=0;
  // particles array already defined earlier
  function gameOver(){
    running=false;
    // create explosion particles at ship location
    for(let i=0;i<30;i++){
      const angle=Math.random()*2*Math.PI;
      const speed=Math.random()*2+1;
      particles.push({
        x: ship.x,
        y: ship.y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        life: 60,
        alpha: 1
      });
    }
    beep(200,300); // collision sound
    ctx.fillStyle='red';
    ctx.font='40px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over',W/2,H/2);
  }
  requestAnimationFrame(loop);
})();
