// Minimal Pixel Escape game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 400;
  const height = canvas.height = canvas.clientHeight || 400;

  // Player
  const player = {
    x: width/2,
    y: height/2,
    size: 8,
    angle: 0, // radians
    speed: 0,
    maxSpeed: 2,
    accel: 0.05,
    rotSpeed: Math.PI/90 // per frame
  };

  // Walls (rectangles moving downwards)
  const walls = [];
  const wallSpawnInterval = 1000; // ms
  let lastWall = 0;

  // Timer
  const gameDuration = 30; // seconds
  let startTime = null;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed after first user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio, {once:true});
  window.addEventListener('keydown', resumeAudio, {once:true});

  function beep(freq, duration=0.1, volume=0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Simple background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 60; // low rumble
  bgOsc.type = 'sine';
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  function spawnWall(){
    const w = 20 + Math.random()*60;
    const h = 10 + Math.random()*30;
    const x = Math.random()*(width-w);
    walls.push({x, y:-h, w, h, speed:1+Math.random()*1.5});
    // subtle beep for new wall
    beep(180, 0.05, 0.1);
  }

  function update(dt){
    if(gameOver) return;
    // timer
    const now = Date.now();
    if(!startTime) startTime = now;
    const elapsed = (now-startTime)/1000;
    if(elapsed>=gameDuration){ gameOver=true; return; }
    // input
    if(keys['ArrowLeft']) player.angle -= player.rotSpeed;
    if(keys['ArrowRight']) player.angle += player.rotSpeed;
    if(keys['ArrowUp']) player.speed = Math.min(player.maxSpeed, player.speed+player.accel);
    else player.speed = Math.max(0, player.speed-player.accel/2);
    // move player
    player.x += Math.cos(player.angle)*player.speed;
    player.y += Math.sin(player.angle)*player.speed;
    // keep inside bounds
    if(player.x<0) player.x=0; if(player.x>width) player.x=width;
    if(player.y<0) player.y=0; if(player.y>height) player.y=height;
    // spawn walls
    if(now-lastWall>wallSpawnInterval){ spawnWall(); lastWall=now; }
    // update walls
    for(let i=walls.length-1;i>=0;i--){
      const w=walls[i];
      w.y+=w.speed;
      if(w.y>height) walls.splice(i,1);
    }
    // collision detection
    for(const w of walls){
if(player.x+player.size> w.x && player.x< w.x+w.w &&
          player.y+player.size> w.y && player.y< w.y+w.h){
        // collision sound
        beep(80, 0.2, 0.3);
        gameOver=true; break;
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // draw background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0,'#001d3a');
    bgGrad.addColorStop(1,'#0b4f8a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);

    // draw walls with varying shades
    for(const w of walls){
      const hue = 200 + Math.random()*40; // bluish tones
      ctx.fillStyle = `hsl(${hue},70%,40%)`;
      ctx.fillRect(w.x,w.y,w.w,w.h);
    }

    // draw player with glow effect
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // glow
    ctx.shadowColor = 'cyan';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#00ff80';
    ctx.fillRect(-player.size/2,-player.size/2,player.size,player.size);
    ctx.restore();
    // reset shadow for UI
    ctx.shadowBlur = 0;
    // timer
    const remaining = Math.max(0, Math.ceil(gameDuration - (Date.now()-startTime)/1000));
    ctx.fillStyle='black';
    ctx.font='16px sans-serif';
    ctx.fillText('Time: '+remaining,10,20);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='32px sans-serif';
      ctx.fillText('Game Over', width/2-80, height/2);
    }
  }

  function loop(){
    const now = Date.now();
    const dt = now - (loop.lastTime||now);
    loop.lastTime = now;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
