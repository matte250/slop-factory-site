// Simple Meteor Dodge game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // create star field for background
  const stars = Array.from({length:100},()=>({
    x: Math.random()*W,
    y: Math.random()*H,
    radius: Math.random()*1.5+0.5
  }));
  // audio assets (data URIs)
  const hitSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep
  const spawnSound = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const bgMusic = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();

  // Player ship
  const ship = { w:40, h:20, x:W/2-20, y:H-30, speed:5 };
  const keys = { left:false, right:false };
  let audioStarted = false;
  const startAudio = ()=>{ if(!audioStarted){ bgMusic.play(); audioStarted = true; } };
  document.addEventListener('keydown',e=>{ startAudio(); if(e.key==='ArrowLeft')keys.left=true; if(e.key==='ArrowRight')keys.right=true;});
  document.addEventListener('keyup',e=>{ if(e.key==='ArrowLeft')keys.left=false; if(e.key==='ArrowRight')keys.right=false;});

  // Meteors
  const meteors = [];
  let spawnTimer=0, spawnInterval=60, // frames
      elapsed=0, lastTime=0,
      gameOver=false;

  function spawn(){
    const size = 20+Math.random()*30;
    meteors.push({x:Math.random()*(W-size), y:-size, size, speed:2+elapsed*0.02});
    // play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }
  function update(dt){
    if(keys.left) ship.x = Math.max(0, ship.x-ship.speed);
    if(keys.right) ship.x = Math.min(W-ship.w, ship.x+ship.speed);
    // meteors
    for(let i=meteors.length-1;i>=0;i--){
      const m=meteors[i];
      m.y += m.speed;
      // collision
      if(m.x < ship.x+ship.w && m.x+m.size > ship.x && m.y < ship.y+ship.h && m.y+m.size > ship.y){
        // play hit sound on collision
        hitSound.currentTime = 0;
        hitSound.play();
        gameOver=true;
      }
      // remove off-screen
      if(m.y>H) meteors.splice(i,1);
    }
    spawnTimer++;
    if(spawnTimer>=spawnInterval){ spawnTimer=0; spawn(); }
    elapsed += dt/1000;
  }
  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // star field (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{
      const twinkle = Math.random()*0.5+0.5;
      ctx.globalAlpha = twinkle;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
    // ship (triangle)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // meteors with gradient
    meteors.forEach(m=>{
      const grad = ctx.createRadialGradient(
        m.x + m.size/2, m.y + m.size/2, m.size*0.1,
        m.x + m.size/2, m.y + m.size/2, m.size/2
      );
      grad.addColorStop(0,'#faa');
      grad.addColorStop(1,'#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x + m.size/2, m.y + m.size/2, m.size/2, 0, Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle='#fff';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+Math.floor(elapsed),10,20);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff';
      ctx.font='30px sans-serif';
      ctx.fillText('Game Over',W/2-80,H/2);
    }
  }
  function loop(timestamp){
    if(!lastTime) lastTime=timestamp;
    const dt = timestamp-lastTime;
    lastTime=timestamp;
    if(!gameOver){
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }
  requestAnimationFrame(loop);
})();
