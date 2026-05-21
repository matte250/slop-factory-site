// Simple Pixel Pirates game
// Canvas element with id "game"
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx=canvas.getContext('2d');
  const W=canvas.width=800;
  const H=canvas.height=600;

  // Game state
  const ship={x:W/2,y:H/2,angle:0,dx:0,dy:0,size:15,life:3,score:0};
  const keys={};
  const treasures=[];
  const obstacles=[];
  let scrollY=0;
  let gameOver=false;
  // Audio setup
  const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  function playTone(freq,dur){
    const osc=audioCtx.createOscillator();
    const gain=audioCtx.createGain();
    osc.type='sine';
    osc.frequency.value=freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
    osc.stop(audioCtx.currentTime+dur);
  }
  // Background ambient hum
  setInterval(()=>{playTone(100,0.2);},2000);
  function playCollect(){playTone(600,0.1);} // treasure collect
  function playHit(){playTone(200,0.2);} // collision hit
  function playGameOver(){playTone(50,0.5);}

  // Input handling
  window.addEventListener('keydown',e=>{keys[e.key]=true;});
  window.addEventListener('keyup',e=>{keys[e.key]=false;});

  function spawnTreasure(){
    const t={x:Math.random()*W, y:-20, size:10};
    treasures.push(t);
  }
  function spawnObstacle(){
    const o={x:Math.random()*W, y:-40, size:20, type:Math.random()<0.5?'island':'enemy'};
    obstacles.push(o);
  }

  function update(){
    if(gameOver) return;
    // Ship controls
    if(keys.ArrowLeft) ship.angle-=0.05;
    if(keys.ArrowRight) ship.angle+=0.05;
    if(keys.ArrowUp){
      ship.dx+=Math.cos(ship.angle)*0.2;
      ship.dy+=Math.sin(ship.angle)*0.2;
    }
    // Apply friction
    ship.dx*=0.99; ship.dy*=0.99;
    ship.x+=ship.dx; ship.y+=ship.dy;
    // Wrap around edges
    if(ship.x<0) ship.x+=W; if(ship.x>W) ship.x-=W;
    if(ship.y<0) ship.y+=H; if(ship.y>H) ship.y-=H;

    // Scroll background
    scrollY+=1;
    // Spawn objects periodically
    if(Math.random()<0.02) spawnTreasure();
    if(Math.random()<0.03) spawnObstacle();

    // Update treasures and check collect
    for(let i=treasures.length-1;i>=0;i--){
      const t=treasures[i];
      t.y+=2; // move down with scroll
        if(distance(ship.x,ship.y,t.x,t.y)<ship.size){
          ship.score+=10; treasures.splice(i,1);
          playCollect();
        } else if(t.y>H){treasures.splice(i,1);}

    }
    // Update obstacles and collisions
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.y+=3;
        if(distance(ship.x,ship.y,o.x,o.y)<ship.size+o.size/2){
          ship.life--; obstacles.splice(i,1);
          playHit();
          if(ship.life<=0){gameOver=true; playGameOver();}
        } else if(o.y>H){obstacles.splice(i,1);}

    }
  }

  function draw(){
    // Water background with gradient
    const waterGrad=ctx.createLinearGradient(0,0,0,H);
    waterGrad.addColorStop(0,'#003366');
    waterGrad.addColorStop(1,'#001122');
    ctx.fillStyle=waterGrad;
    ctx.fillRect(0,0,W,H);
    // Wave overlay using sine
    ctx.strokeStyle='rgba(255,255,255,0.2)';
    ctx.lineWidth=2;
    for(let i=0;i<15;i++){
      const waveY=(i*40+scrollY)%H;
      ctx.beginPath();
      for(let x=0;x<=W;x+=20){
        const offset=Math.sin((x+scrollY)/50)*5;
        ctx.lineTo(x, waveY+offset);
      }
      ctx.stroke();
    }
    // Draw treasures with radial gradient
    treasures.forEach(t=>{
      const grad=ctx.createRadialGradient(t.x,t.y,0,t.x,t.y,t.size);
      grad.addColorStop(0,'gold');
      grad.addColorStop(1,'darkgoldenrod');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.arc(t.x,t.y,t.size,0,2*Math.PI);
      ctx.fill();
    });
    // Draw obstacles (islands as polygons, enemies as circles)
    obstacles.forEach(o=>{
      if(o.type==='island'){
        ctx.fillStyle='sienna';
        ctx.beginPath();
        const points=5;
        const radius=o.size;
        for(let i=0;i<points;i++){
          const ang=i*2*Math.PI/points;
          const px=o.x+Math.cos(ang)*radius;
          const py=o.y+Math.sin(ang)*radius;
          if(i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
        }
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle='darkred';
        ctx.beginPath();
        ctx.arc(o.x,o.y,o.size,0,2*Math.PI);
        ctx.fill();
      }
    });
    // Draw ship with sail
    ctx.save();
    ctx.translate(ship.x,ship.y);
    ctx.rotate(ship.angle);
    // hull
    ctx.fillStyle='white';
    ctx.beginPath();
    ctx.moveTo(ship.size,0);
    ctx.lineTo(-ship.size/2,ship.size/2);
    ctx.lineTo(-ship.size/2,-ship.size/2);
    ctx.closePath();
    ctx.fill();
    // sail
    ctx.fillStyle='lightgray';
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(-ship.size/2,-ship.size*1.5);
    ctx.lineTo(ship.size/2,-ship.size*1.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // HUD
    ctx.fillStyle='white';
    ctx.font='16px monospace';
    ctx.fillText('Score: '+ship.score,10,20);
    ctx.fillText('Lives: '+ship.life,10,40);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='red';
      ctx.font='48px monospace';
      ctx.textAlign='center';
      ctx.fillText('Game Over',W/2,H/2-20);
      ctx.font='24px monospace';
      ctx.fillText('Final Score: '+ship.score,W/2,H/2+20);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  function distance(x1,y1,x2,y2){return Math.hypot(x2-x1,y2-y1);}
  loop();
})();
