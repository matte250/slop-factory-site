document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const player = {x: canvas.width/2, y: canvas.height/2, r:10, vx:0, vy:0, speed:3};
  const keys = {};
  const enemies = [];
  const stars = [];
  const particles = [];
  const bgStars = [];
  let score = 0;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playStar(){ beep(300, 0.1); }
  function playGameOver(){ beep(100, 0.5); }
  let gameOver = false;
  let enemyTimer = 0;
  let starTimer = 0;

  const rand = (min,max)=>Math.random()*(max-min)+min;
  const dist = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);

  function spawnEnemy(){
    const r = rand(20,50);
    const side = Math.floor(rand(0,4));
    let x,y,vx,vy;
    // spawn just outside a random edge
    if(side===0){x=-r; y=rand(0,canvas.height); vx=rand(1,3); vy=rand(-2,2);} // left
    else if(side===1){x=canvas.width+r; y=rand(0,canvas.height); vx=-rand(1,3); vy=rand(-2,2);} // right
    else if(side===2){x=rand(0,canvas.width); y=-r; vx=rand(-2,2); vy=rand(1,3);} // top
    else {x=rand(0,canvas.width); y=canvas.height+r; vx=rand(-2,2); vy=-rand(1,3);} // bottom
    enemies.push({x,y,r,vx,vy,color:`hsl(${rand(0,360)},70%,50%)`});
  }

  function spawnStar(){
    const r = 5;
    const x = rand(r, canvas.width-r);
    const y = rand(r, canvas.height-r);
    stars.push({x,y,r,color:'#ff0'});
  }

  // Populate static background stars for a parallax field
  function initBgStars(){
    for(let i=0;i<100;i++){
      bgStars.push({
        x: rand(0, canvas.width),
        y: rand(0, canvas.height),
        r: rand(0.5,1.5),
        alpha: rand(0.3,0.9)
      });
    }
  }
  initBgStars();

  function update(dt){
    // player movement
    player.vx = (keys['ArrowRight']?1:0) - (keys['ArrowLeft']?1:0);
    player.vy = (keys['ArrowDown']?1:0) - (keys['ArrowUp']?1:0);
    const len = Math.hypot(player.vx, player.vy);
    if(len){player.vx = player.vx/len*player.speed; player.vy = player.vy/len*player.speed;}
    else {player.vx=player.vy=0;}
    player.x = Math.min(canvas.width-player.r, Math.max(player.r, player.x+player.vx));
    player.y = Math.min(canvas.height-player.r, Math.max(player.r, player.y+player.vy));

    // enemies
    enemies.forEach(e=>{e.x+=e.vx; e.y+=e.vy;});
    // remove off‑screen enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      if(e.x<-e.r||e.x>canvas.width+e.r||e.y<-e.r||e.y>canvas.height+e.r) enemies.splice(i,1);
      else if(dist(player,e)<player.r+e.r) gameOver=true;
    }

    // stars collection
    for(let i=stars.length-1;i>=0;i--){
      const s=stars[i];
      if(dist(player,s)<player.r+s.r){
        score++; stars.splice(i,1);
        // create sparkle particles
        for(let j=0;j<5;j++){
          particles.push({
            x:s.x,
            y:s.y,
            vx:rand(-1,1),
            vy:rand(-1,1),
            life:1
          });
        }
        playStar();
      }
    }
  }

  function draw(){
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // background stars (parallax)
    bgStars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,2*Math.PI); ctx.fill();
    });

    // player with glow
    ctx.save();
    ctx.shadowColor='lime';
    ctx.shadowBlur=12;
    const playerGrad = ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,player.r);
    playerGrad.addColorStop(0,'#aff');
    playerGrad.addColorStop(1,'#0f0');
    ctx.fillStyle = playerGrad;
    ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,2*Math.PI); ctx.fill();
    ctx.restore();

    // enemies with gradient fill and glow
    enemies.forEach(e=>{
      ctx.save();
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 8;
      const eg = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);
      eg.addColorStop(0,'#fff');
      eg.addColorStop(1,e.color);
      ctx.fillStyle = eg;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,2*Math.PI); ctx.fill();
      ctx.restore();
    });

    // stars sparkle (simple twinkle)
    stars.forEach(s=>{
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,2*Math.PI); ctx.fill();
    });

    // particle effects (if any)
    particles.forEach((p,i)=>{
      ctx.fillStyle = `rgba(255,255,150,${p.life})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,2,0,2*Math.PI); ctx.fill();
      p.x+=p.vx; p.y+=p.vy; p.life-=0.02;
      if(p.life<=0) particles.splice(i,1);
    });

    // score
    ctx.fillStyle='#fff'; ctx.font='16px sans-serif'; ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#f00';
      ctx.font='48px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!last) last = timestamp;
    const dt = timestamp - last;
    if(!gameOver){
      enemyTimer+=dt; starTimer+=dt;
      if(enemyTimer>1500){spawnEnemy(); enemyTimer=0;}
      if(starTimer>3000){spawnStar(); starTimer=0;}
      update(dt);
    }
    draw();
    last = timestamp;
    requestAnimationFrame(loop);
  }
  let last = null;
  requestAnimationFrame(loop);

  window.addEventListener('keydown',e=>{ if(audioCtx.state==='suspended') audioCtx.resume(); keys[e.key]=true; });
  window.addEventListener('keyup',e=>keys[e.key]=false);
});
