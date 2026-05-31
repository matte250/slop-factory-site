(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  // set a dark space background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ship = {w:60,h:15,x:canvas.width/2,y:canvas.height-30,speed:6,dx:0};
// audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// resume audio context on first user interaction (required on some browsers)
window.addEventListener('click',()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); },{once:true});
function playBeep(freq, dur){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
  const meteors=[]; const powerUps=[]; const stars=[];

let lastMeteor=0,lastPower=0,score=0,startTime=performance.now(),gameOver=false,shield=false,shieldTimer=0;
  const keys={};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  const rand=(min,max)=>Math.random()*(max-min)+min;
// generate starfield
for(let i=0;i<100;i++){
  stars.push({
    x: rand(0, canvas.width),
    y: rand(0, canvas.height),
    r: rand(0.5, 2),
    speed: rand(0.2, 0.6)
  });
}
  const spawnMeteor=()=>{const r=rand(10,20); meteors.push({x:rand(r,canvas.width-r),y:-r,r:r,speed:rand(2,4)+score/2000});};
  const spawnPower=()=>{powerUps.push({x:rand(15,canvas.width-15),y:-15,r:10,speed:2,type:Math.random()<0.5?'shield':'speed'});};
  const rectCircleCollision=(rx,ry,rw,rh,cx,cy,cr)=>{const distX=Math.abs(cx-rx-rw/2); const distY=Math.abs(cy-ry-rh/2); if(distX>rw/2+cr) return false; if(distY>rh/2+cr) return false; if(distX<=rw/2||distY<=rh/2) return true; const dx=distX-rw/2; const dy=distY-rh/2; return dx*dx+dy*dy<=cr*cr;};
  const update=now=>{if(gameOver){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.font='30px sans-serif';ctx.textAlign='center';ctx.fillText(`Game Over – Score: ${score}`,canvas.width/2,canvas.height/2);return;}
    const delta=now-startTime; score=Math.floor(delta/100);
    ship.dx=0; if(keys.ArrowLeft) ship.dx=-ship.speed; if(keys.ArrowRight) ship.dx=ship.speed; ship.x=Math.max(0,Math.min(canvas.width-ship.w,ship.x+ship.dx));
    if(now-lastMeteor>800){spawnMeteor();lastMeteor=now;} if(now-lastPower>5000){spawnPower();lastPower=now;}
    for(let i=meteors.length-1;i>=0;i--){const m=meteors[i];m.y+=m.speed; if(rectCircleCollision(ship.x,ship.y,ship.w,ship.h,m.x,m.y,m.r)){if(shield){meteors.splice(i,1);continue;}playBeep(150,0.3);gameOver=true;} if(m.y-m.r>canvas.height) meteors.splice(i,1);}
    for(let i=powerUps.length-1;i>=0;i--){const p=powerUps[i];p.y+=p.speed; if(rectCircleCollision(ship.x,ship.y,ship.w,ship.h,p.x,p.y,p.r)){if(p.type==='shield'){shield=true;shieldTimer=now+5000;playBeep(300,0.2);}else if(p.type==='speed'){ship.speed=10;setTimeout(()=>{ship.speed=6},4000);playBeep(600,0.15);} powerUps.splice(i,1);continue;} if(p.y-p.r>canvas.height) powerUps.splice(i,1);}
    if(shield && now>shieldTimer) shield=false;
    // background: dark space gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stars move slowly downward to simulate depth
    ctx.fillStyle = '#fff';
    for(let i=stars.length-1;i>=0;i--){
      const s = stars[i];
      s.y += s.speed;
      if(s.y > canvas.height){ s.y = 0; s.x = rand(0, canvas.width); }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // ship – draw a sleek triangle with gradient shading
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, shield ? '#0ff' : '#0f0');
    shipGrad.addColorStop(1, shield ? '#004' : '#003');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    // triangle points: tip, left rear, right rear
    ctx.moveTo(ship.x + ship.w / 2, ship.y); // tip
    ctx.lineTo(ship.x, ship.y + ship.h); // left rear
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h); // right rear
    ctx.closePath();
    ctx.fill();
    // meteors with radial gradient
    meteors.forEach(m=>{
      const grad = ctx.createRadialGradient(m.x, m.y, m.r*0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#ff7');
      grad.addColorStop(1, '#a52a2a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI*2);
      ctx.fill();
    });
    // power‑ups
    ctx.fillStyle='#ff0'; powerUps.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
    // score
    ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.fillText(`Score: ${score}`,10,20);
    requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
})();