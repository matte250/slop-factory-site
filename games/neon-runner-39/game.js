// Minimal Neon Runner implementation with sound
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 400;
  const player = {x:w/2, y:h-30, r:10, speed:4, dir:0};
  const obstacles = [];
  let frame = 0, score = 0, running = true;
  const keys = {ArrowLeft:false, ArrowRight:false};
  // Audio context for simple synthesis
  const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  function beep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type='square';
    osc.frequency.value=freq;
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+dur);
    osc.start();
    osc.stop(audioCtx.currentTime+dur);
  }
  function playCollision(){ beep(100, 0.3); }
  function playScore(){ beep(600, 0.05); }
  document.addEventListener('keydown',e=>{if(e.key in keys) keys[e.key]=true;});
  document.addEventListener('keyup',e=>{if(e.key in keys) keys[e.key]=false;});
  function spawn(){
    const gap = 80 + Math.random()*40;
    const width = Math.random()* (w- gap);
    obstacles.push({x:0, y:-20, w:width, gapStart:width, speed:2});
    obstacles.push({x:width+gap, y:-20, w:w-(width+gap), gapStart:width+gap, speed:2});
  }
  function update(){
    if(keys.ArrowLeft) player.x -= player.speed;
    if(keys.ArrowRight) player.x += player.speed;
    player.x = Math.max(player.r, Math.min(w-player.r, player.x));
    obstacles.forEach(o=>o.y+=o.speed);
    if(frame%120===0) spawn();
    // collision detection
    for(const o of obstacles){
      if(o.y+20>player.y-player.r && o.y<player.y+player.r){
        if(player.x-player.r < o.gapStart || player.x+player.r > o.gapStart+80){
          if(running){
            playCollision();
            running = false;
          }
          break;
        }
      }
    }
    // clean up off‑screen obstacles
    while(obstacles.length && obstacles[0].y>h) obstacles.shift();
    if(running){
      score++;
      if(frame%30===0) playScore(); // subtle tick each 0.5 sec
    }
    frame++; 
  }
  function draw(){
    // Neon background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,h);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);

    // Draw player with neon glow
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 12;
    ctx.fillStyle='lime';
    ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Draw obstacles as glowing neon bars
    obstacles.forEach(o=>{
      const grad = ctx.createLinearGradient(o.x,0,o.x+o.w,0);
      grad.addColorStop(0,'#0ff');
      grad.addColorStop(1,'#003');
      ctx.fillStyle = grad;
      ctx.fillRect(o.x,o.y,o.w,20);
    });

    // Neon style score text
    ctx.fillStyle='white';
    ctx.font='18px monospace';
    ctx.fillText('Score: '+score,10,30);
    if(!running){
      ctx.font='24px monospace';
      ctx.fillText('Game Over', w/2-60, h/2);
    }
  }
  function loop(){
    if(running){update(); draw(); requestAnimationFrame(loop);} else {draw();}
  }
  loop();
})();
