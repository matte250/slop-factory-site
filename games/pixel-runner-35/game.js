// Pixel Runner with improved graphics
// Canvas with id="game" must exist in the HTML.
(function(){

  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0,"#87CEEB"); // sky blue
  bgGrad.addColorStop(1,"#FFF8DC"); // light sand
  const groundY = H-20; // ground line position
  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump(){ playTone(300, 0.1); }
  function playCrash(){ playTone(100, 0.3); }
  const GRAVITY = 0.6;
  const PLAYER = {x:50, y:H-60, w:30, h:30, vy:0, onGround:false};
  const obstacles = [];
  const clouds = [];
  let lastSpawn = 0, lastCloud = 0, gameOver = false;
  let score = 0;

  function spawnObstacle(){
    const width = 20 + Math.random()*30;
    const height = 30 + Math.random()*40;
    obstacles.push({x:W, y:H-height, w:width, h:height});
  }

  function spawnCloud(){
    const w = 60 + Math.random()*60;
    const h = 30 + Math.random()*30;
    const y = 20 + Math.random() * (groundY - 80);
    const speed = 1 + Math.random()*1; // slower than obstacles
    clouds.push({x:W, y, w, h, speed});
  }

  function rectCollide(a,b){
    return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
  }

  function update(dt){
    // player physics
    PLAYER.vy += GRAVITY;
    PLAYER.y += PLAYER.vy;
    if(PLAYER.y + PLAYER.h >= H){
      PLAYER.y = H-PLAYER.h;
      PLAYER.vy = 0;
      PLAYER.onGround = true;
    } else {
      PLAYER.onGround = false;
    }
    // obstacles movement
    for(let i=obstacles.length-1;i>=0;--i){
      const o = obstacles[i];
      o.x -= 4; // scroll speed
      if(o.x + o.w < 0) obstacles.splice(i,1);
      else if(rectCollide(PLAYER,o)){
      gameOver = true;
      playCrash();
    }
    }
    // clouds movement
    for(let i=clouds.length-1;i>=0;--i){
      const c = clouds[i];
      c.x -= c.speed;
      if(c.x + c.w < 0) clouds.splice(i,1);
    }
    // spawn timing
    const now = Date.now();
    if(now - lastSpawn > 1300){
      spawnObstacle();
      lastSpawn = now;
    }
    if(now - lastCloud > 2500){
      spawnCloud();
      lastCloud = now;
    }
  }

  function draw(){
    // sky background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);
    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    clouds.forEach(c=>{
      ctx.beginPath();
      ctx.ellipse(c.x + c.w/2, c.y + c.h/2, c.w/2, c.h/2, 0, 0, Math.PI*2);
      ctx.fill();
    });
    // ground line
    ctx.fillStyle = '#654321';
    ctx.fillRect(0,groundY,W,4);
    // player (simple triangle for flair)
    ctx.fillStyle = '#00ff00';
    ctx.beginPath();
    ctx.moveTo(PLAYER.x, PLAYER.y + PLAYER.h);
    ctx.lineTo(PLAYER.x + PLAYER.w/2, PLAYER.y);
    ctx.lineTo(PLAYER.x + PLAYER.w, PLAYER.y + PLAYER.h);
    ctx.closePath();
    ctx.fill();
    // obstacles (spike shape)
    ctx.fillStyle = '#ff0000';
    obstacles.forEach(o=>{
      const spikes = Math.max(3, Math.floor(o.w/10));
      const spikeWidth = o.w / spikes;
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      for(let i=0;i<spikes;i++){
        const px = o.x + i*spikeWidth;
        ctx.lineTo(px + spikeWidth/2, o.y);
        ctx.lineTo(px + spikeWidth, o.y + o.h);
      }
      ctx.closePath();
      ctx.fill();
    });
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }

  function loop(){
    if(gameOver) return;
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // input
  canvas.addEventListener('pointerdown',()=>{
    if(PLAYER.onGround && !gameOver){
      PLAYER.vy = -12;
      playJump();
    }
  });

  // start
  requestAnimationFrame(loop);
})();
