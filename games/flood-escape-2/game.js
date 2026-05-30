// Simple Flood Escape game
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  const boat = {x:w/2-15,y:h-40,w:30,h:30,dx:0,dy:0,speed:2};
  const debris = [];
  const maxDebris = 10;
  let water = 0; // rising from bottom (pixels)
  let gameOver = false;
  const keys = {};
  // input
  window.addEventListener('keydown',e=>{keys[e.key]=true; if (audioCtx.state === 'suspended') audioCtx.resume();});
  window.addEventListener('keyup',e=>keys[e.key]=false);
  function update(){
    if(gameOver) return;
    // boat movement
    boat.dx = (keys['ArrowLeft']?-1:0)+(keys['ArrowRight']?1:0);
    boat.dy = (keys['ArrowUp']?-1:0)+(keys['ArrowDown']?1:0);
    boat.x += boat.dx*boat.speed;
    boat.y += boat.dy*boat.speed;
    // clamp
    boat.x = Math.max(0,Math.min(w-boat.w,boat.x));
    boat.y = Math.max(0,Math.min(h-boat.h,boat.y));
    // spawn debris
    if(debris.length<maxDebris && Math.random()<0.02){
      debris.push({x:Math.random()*w, y:0, w:20, h:20, vy:1+Math.random()*2});
    }
    // move debris
    for(let i=debris.length-1;i>=0;i--){
      const d=debris[i];
      d.y+=d.vy;
      if(d.y>h) debris.splice(i,1);
    }
    // water rise
    water+=0.3; // pixels per frame
    // collision detection
    for(const d of debris){
      if(boat.x < d.x+d.w && boat.x+boat.w > d.x &&
         boat.y < d.y+d.h && boat.y+boat.h > d.y){
        gameOver=true;
        playBeep();
      }
    }
    if(water>h) gameOver=true;
  }
  function draw(){
    // Background
    const bgGrad = ctx.createLinearGradient(0,0,w,0);
    bgGrad.addColorStop(0,'#001d4a');
    bgGrad.addColorStop(1,'#00396b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);

    // Water with gradient (rising from bottom)
    const waterGrad = ctx.createLinearGradient(0,h-water,w,h);
    waterGrad.addColorStop(0,'rgba(0,100,255,0.6)');
    waterGrad.addColorStop(1,'rgba(0,150,255,0.3)');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0,h-water,w,water);

    // Boat – draw as a simple triangle
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.moveTo(boat.x + boat.w/2, boat.y);
    ctx.lineTo(boat.x, boat.y + boat.h);
    ctx.lineTo(boat.x + boat.w, boat.y + boat.h);
    ctx.closePath();
    ctx.fill();

    // Debris – draw as circles with subtle shadow
    ctx.fillStyle = '#8b5a2b';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    for(const d of debris){
      ctx.beginPath();
      ctx.arc(d.x + d.w/2, d.y + d.h/2, d.w/2, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset shadow

    // Game Over overlay
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#ff5252';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w/2, h/2);
    }
  }
  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
