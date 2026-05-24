// Pixel Dodger game
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // background tone
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30; // low rumble
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  function playBeep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const W = canvas.width, H = canvas.height;
  const player = {x:W/2-10,y:H-30,w:20,h:20,dx:0,dy:0,speed:4};
  const enemies = [];
  const stars = [];
  // initialize stars
  for(let i=0;i<100;i++){
    stars.push({x:Math.random()*W, y:Math.random()*H, speed:0.2+Math.random()*0.3});
  }
  let spawnTimer = 0, spawnInterval = 1000, lastTime=0, gameOver=false, score=0;
  const keys={};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function update(dt){
    // player movement
    player.dx = (keys['ArrowLeft']? -1:0)+(keys['ArrowRight']? 1:0);
    player.dy = (keys['ArrowUp']? -1:0)+(keys['ArrowDown']? 1:0);
    player.x = Math.max(0, Math.min(W-player.w, player.x + player.dx*player.speed));
    player.y = Math.max(0, Math.min(H-player.h, player.y + player.dy*player.speed));
    // spawn enemies
    spawnTimer+=dt;
    if(spawnTimer>spawnInterval){
      spawnTimer=0;
      enemies.push({x:Math.random()* (W-20), y:-20, w:20, h:20, speed:2+Math.random()*2, color:`hsl(${Math.random()*360},80%,60%)`, angle:0}); playBeep(300,0.07);
      // gradually increase difficulty
      if(spawnInterval>200) spawnInterval-=20;
    }
    // move enemies
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      e.y+=e.speed;
      // rotate enemy
      e.angle = (e.angle + 0.02) % (Math.PI*2);
      // remove off-screen
      if(e.y>H) enemies.splice(i,1);
      // collision
      if(!(e.x+e.w<player.x||e.x>player.x+player.w||e.y+e.h<player.y||e.y>player.y+player.h)){
        gameOver=true;
        playBeep(150,0.3);
      }
    }
    // move stars
    for(const s of stars){
      s.y+=s.speed*dt*0.05; // adjust speed factor
      if(s.y>H){
        s.y=0; s.x=Math.random()*W;
      }
    }
    // increase score over time
    if(!gameOver) score += dt;
  }
  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,W,H);
    bgGrad.addColorStop(0,'#001020');
    bgGrad.addColorStop(1,'#000810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // starfield
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for(const s of stars){
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score/1000), 10, 20);
    // player (circle with shadow)
    ctx.save();
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // enemies (colored squares with slight rotation)
    enemies.forEach(e=>{
      ctx.save();
      ctx.translate(e.x + e.w/2, e.y + e.h/2);
      ctx.rotate(e.angle || 0);
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 5;
      ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
      ctx.restore();
    });
    if(gameOver){
      ctx.fillStyle='white';
      ctx.font='24px sans-serif';
      ctx.fillText('Game Over',W/2-60,H/2);
    }
  }
  function loop(timestamp){
    if(!lastTime) lastTime=timestamp;
    const dt=timestamp-lastTime;
    lastTime=timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
