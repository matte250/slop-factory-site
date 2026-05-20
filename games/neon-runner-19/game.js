// Neon Runner – simple endless runner on canvas with id "game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first interaction
  const resumeAudio = () => audioCtx.state === 'suspended' && audioCtx.resume();
  function playTone(freq, duration, type='sine'){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound(){ playTone(300, 0.1); }
  function playCrashSound(){ playTone(100, 0.3, 'square'); }

  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  // Game settings
  const speed = 2;          // horizontal speed of world
  const gravity = 0.6;       // gravity acceleration
  const jumpStrength = -12; // initial jump velocity
  const laneHeight = 50;     // vertical distance between floor and ceiling
  // Player
  const player = {x: 50, y: H - laneHeight, w: 30, h: 30, vy:0, onGround:true};
  // Obstacles array
  const obstacles = [];
  let frame = 0;
  let gameOver = false;
  // Input – click or tap to jump
  canvas.addEventListener('click',()=>{ resumeAudio(); if(player.onGround){ player.vy = jumpStrength; player.onGround = false; playJumpSound(); } });
  canvas.addEventListener('touchstart',()=>{ resumeAudio(); if(player.onGround){ player.vy = jumpStrength; player.onGround = false; playJumpSound(); } });
  function spawnObstacle(){
    // random height: either a block from ground or a ceiling block (gap)
    const type = Math.random()<0.5?'block':'gap';
    const size = 30 + Math.random()*20;
    if(type==='block'){
      obstacles.push({x:W, y:H - laneHeight - size, w:size, h:size, type});
    } else {
      // gap: obstacle is a ceiling block that creates a gap to jump through
      obstacles.push({x:W, y:0, w:size, h:laneHeight/2, type});
    }
  }
  function update(){
    if(gameOver) return;
    // move player
    player.vy += gravity;
    player.y += player.vy;
    if(player.y >= H - laneHeight){ player.y = H - laneHeight; player.vy=0; player.onGround=true; }
    // move obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= speed;
      // collision detection (simple AABB)
      if(o.type==='block'){
        if(player.x < o.x+o.w && player.x+player.w > o.x && player.y < o.y+o.h && player.y+player.h > o.y){
          playCrashSound();
          gameOver = true;
        }
      } else { // gap – treat as ceiling obstacle, player must be above it
        if(player.x < o.x+o.w && player.x+player.w > o.x && player.y < o.y+o.h){
          gameOver = true;
        }
      }
      // remove off‑screen
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
    // spawn new obstacles periodically
    if(frame % 120 === 0) spawnObstacle();
    frame++;
  }
  function draw(){
    // background gradient (dark to neon)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#0a0a2a');
    bgGrad.addColorStop(1, '#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // draw ground line with glow
    ctx.fillStyle = '#111';
    ctx.fillRect(0, H - laneHeight, W, laneHeight);
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;

    // draw player – neon cyan with glow
    ctx.fillStyle = '#0ff';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // reset shadow for obstacles
    ctx.shadowColor = '#f00';
    ctx.shadowBlur = 8;
    // draw obstacles with neon red glow and rounded corners
    ctx.fillStyle = '#f00';
    obstacles.forEach(o=>{
      const r = 5; // corner radius
      ctx.beginPath();
      ctx.moveTo(o.x + r, o.y);
      ctx.lineTo(o.x + o.w - r, o.y);
      ctx.quadraticCurveTo(o.x + o.w, o.y, o.x + o.w, o.y + r);
      ctx.lineTo(o.x + o.w, o.y + o.h - r);
      ctx.quadraticCurveTo(o.x + o.w, o.y + o.h, o.x + o.w - r, o.y + o.h);
      ctx.lineTo(o.x + r, o.y + o.h);
      ctx.quadraticCurveTo(o.x, o.y + o.h, o.x, o.y + o.h - r);
      ctx.lineTo(o.x, o.y + r);
      ctx.quadraticCurveTo(o.x, o.y, o.x + r, o.y);
      ctx.closePath();
      ctx.fill();
    });
    // reset shadow for UI
    ctx.shadowBlur = 0;
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.font = '30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W/2, H/2);
    }
  }
  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  // start
  requestAnimationFrame(loop);
})();
