(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.clientWidth;
  canvas.height=canvas.clientHeight;
  const SHIP_WIDTH=40,SHIP_HEIGHT=20,SHIP_SPEED=5;
  const METEOR_RADIUS=15,STAR_RADIUS=8;
  const METEOR_INTERVAL=1000,STAR_INTERVAL=3000;
  const SPEED_INCREMENT=0.02;
  // Background stars for parallax effect
  const BG_STAR_COUNT=80;
  const bgStars=[];
  for(let i=0;i<BG_STAR_COUNT;i++){
    bgStars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      radius: Math.random()*1.5+0.5,
      twinkle: Math.random()<0.5
    });
  }
  const ship={x:canvas.width/2,y:canvas.height-SHIP_HEIGHT-10};
  const meteors=[],stars=[];
  const shipParticles=[];
  let score=0, speed=2, lastMeteor=0, lastStar=0, gameOver=false;
  const keys={ArrowLeft:false,ArrowRight:false};
  document.addEventListener('keydown',e=>{if(e.key in keys){keys[e.key]=true; // play thrust sound on movement keys
    if(e.key==='ArrowLeft' || e.key==='ArrowRight') playSound(200,0.05);
  }
  if(gameOver&&e.key==='Enter')restart();});
// Ensure audio context is running after first user gesture
document.addEventListener('click',()=>{if(audioCtx.state!=='running')audioCtx.resume();});
  document.addEventListener('keyup',e=>{if(e.key in keys)keys[e.key]=false;});
  function spawnMeteor(){const x=Math.random()*(canvas.width-METEOR_RADIUS*2)+METEOR_RADIUS;meteors.push({x,y:-METEOR_RADIUS});}
  function spawnStar(){const x=Math.random()*(canvas.width-STAR_RADIUS*2)+STAR_RADIUS;stars.push({x,y:-STAR_RADIUS,collected:false});}
  function circleRectCollision(cx,cy,cr,rx,ry,rw,rh){const closestX=Math.max(rx,Math.min(cx,rx+rw));const closestY=Math.max(ry,Math.min(cy,ry+rh));const dx=cx-closestX,dy=cy-closestY;return dx*dx+dy*dy<cr*cr;}
// Simple sound helper using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
  function restart(){ship.x=canvas.width/2;meteors.length=0;stars.length=0;score=0;speed=2;lastMeteor=lastStar=0;gameOver=false;requestAnimationFrame(loop);}
  function loop(timestamp){if(gameOver){ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='24px sans-serif';ctx.fillText(`Game Over – Score: ${score}`,canvas.width/2,canvas.height/2);ctx.font='16px sans-serif';ctx.fillText('Press Enter to restart',canvas.width/2,canvas.height/2+30);return;}
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Draw parallax background stars
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#fff';
    for(let i=bgStars.length-1;i>=0;i--){
      const s=bgStars[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
      s.y += speed*0.2; // slower than meteors
      if(s.y>canvas.height){ s.y=0; s.x=Math.random()*canvas.width; }
    }
    ctx.restore();
    // Update ship position
    if(keys.ArrowLeft) ship.x = Math.max(0, ship.x - SHIP_SPEED);
    if(keys.ArrowRight) ship.x = Math.min(canvas.width - SHIP_WIDTH, ship.x + SHIP_SPEED);
    // Draw ship as a stylized triangle with glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,170,255,0.7)';
    ctx.shadowBlur = 12;
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + SHIP_HEIGHT);
    shipGrad.addColorStop(0, '#0af');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + SHIP_HEIGHT);
    ctx.lineTo(ship.x + SHIP_WIDTH / 2, ship.y);
    ctx.lineTo(ship.x + SHIP_WIDTH, ship.y + SHIP_HEIGHT);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Ship thrust particles
    if(keys.ArrowLeft || keys.ArrowRight){
      // emit particles from the bottom center of ship
      shipParticles.push({
        x: ship.x + SHIP_WIDTH/2 + (Math.random()-0.5)*5,
        y: ship.y + SHIP_HEIGHT,
        vy: 1 + Math.random()*1,
        alpha: 0.8,
        life: 30
      });
    }
    // Update and draw ship particles
    ctx.fillStyle = '#0af';
    for(let i=shipParticles.length-1;i>=0;i--){
      const p = shipParticles[i];
      p.y += p.vy;
      p.alpha -= 0.025;
      p.life--;
      ctx.globalAlpha = Math.max(p.alpha,0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI*2);
      ctx.fill();
      if(p.life <=0 || p.y>canvas.height) shipParticles.splice(i,1);
    }
    ctx.globalAlpha = 1;
    if(timestamp-lastMeteor>METEOR_INTERVAL){spawnMeteor();lastMeteor=timestamp;}
    if(timestamp-lastStar>STAR_INTERVAL){spawnStar();lastStar=timestamp;}
    // Draw meteors with radial gradient for depth
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i];
      m.y+=speed;
      const grad=ctx.createRadialGradient(m.x,m.y,0,m.x,m.y,METEOR_RADIUS);
      grad.addColorStop(0,'#ff7');
      grad.addColorStop(1,'#a44');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(m.x,m.y,METEOR_RADIUS,0,Math.PI*2);
      ctx.fill();
      if(circleRectCollision(m.x,m.y,METEOR_RADIUS,ship.x,ship.y,SHIP_WIDTH,SHIP_HEIGHT)){
        gameOver=true;
        playSound(150,0.4); // collision sound
      }
      if(m.y-METEOR_RADIUS>canvas.height) meteors.splice(i,1);
    }
    // Draw and update stars with glow and twinkle
    for(let i=stars.length-1;i>=0;i--){
      const s=stars[i];
      s.y+=speed*0.8; // slower than meteors
      // twinkle effect
      ctx.globalAlpha = s.twinkle ? 0.6 : 1.0;
      const starGrad=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,STAR_RADIUS);
      starGrad.addColorStop(0,'#fff');
      starGrad.addColorStop(1,'rgba(255,255,0,0)');
      ctx.fillStyle=starGrad;
      ctx.beginPath();
      ctx.arc(s.x,s.y,STAR_RADIUS,0,Math.PI*2);
      ctx.fill();
      ctx.globalAlpha=1.0;
      // collect star
      if(!s.collected && circleRectCollision(s.x,s.y,STAR_RADIUS,ship.x,ship.y,SHIP_WIDTH,SHIP_HEIGHT)){
        s.collected=true;
        score+=10;
        stars.splice(i,1);
      }
      // remove off-screen stars
      if(s.y-STAR_RADIUS>canvas.height) stars.splice(i,1);
    }
    speed+=SPEED_INCREMENT*(1/60);
    ctx.fillStyle='#000';ctx.font='16px sans-serif';ctx.textAlign='left';ctx.fillText(`Score: ${score}`,10,20);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();