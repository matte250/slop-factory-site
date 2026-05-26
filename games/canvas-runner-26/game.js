// Minimal endless runner for canvas with id="game"
(function(){
    const canvas = document.getElementById('game');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Audio setup
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playTone(freq, dur) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    }
    function playJumpSound(){ playTone(300, 0.1); }
    function playGameOverSound(){
      // low beep then higher beep
      playTone(150, 0.2);
      setTimeout(()=>playTone(250,0.2), 250);
    }

  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;
  const GRAVITY = 0.6;
  // utility: draw rounded rectangle
  function drawRoundedRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
  }

  const JUMP_VEL = -12;
  const PLAYER_SIZE = 20;

  const player = {x:50, y:H-PLAYER_SIZE, w:PLAYER_SIZE, h:PLAYER_SIZE, vy:0, onGround:false};
  const platforms = [];
  const clouds = [];
  let gameOver = false;
  let gameOverPlayed = false;
  let frame = 0;

  function spawnPlatform(){
    const gap = 100 + Math.random()*100;
    const lastX = platforms.length? platforms[platforms.length-1].x + platforms[platforms.length-1].w : 0;
    const x = Math.max(lastX, W) + gap;
    const w = 80 + Math.random()*120;
    const y = H - (30 + Math.random()*70);
    const hasSpike = Math.random()<0.2; // 20% chance
    platforms.push({x, y, w, h:20, spike: hasSpike});
  }

  // spawn simple cloud
  function spawnCloud(){
    const r = 20 + Math.random()*15;
    const x = W + Math.random()*200; // start beyond right edge
    const y = 30 + Math.random()* (H/2 - 30);
    const speed = 0.5 + Math.random()*0.5; // slower than platforms
    clouds.push({x, y, r, speed});
  }

  function reset(){
    player.y = H-PLAYER_SIZE; player.vy=0; player.onGround=false;
    platforms.length=0; clouds.length=0; frame=0; gameOver=false; gameOverPlayed=false;
    // initial platform
    platforms.push({x:0, y:H-30, w:200, h:20, spike:false});
    for(let i=0;i<5;i++) spawnPlatform();
    // initial clouds
    for(let i=0;i<3;i++) spawnCloud();
    requestAnimationFrame(loop);
  }

  function update(){
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    player.onGround = false;
    // platform movement
    platforms.forEach(p=> p.x -= 3);
    // cloud movement (slower)
    clouds.forEach(c=> c.x -= c.speed);
    // remove off‑screen platforms
    while(platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
    // remove off‑screen clouds
    while(clouds.length && clouds[0].x + clouds[0].r < 0) clouds.shift();
    // spawn new platforms
    if(platforms[platforms.length-1].x + platforms[platforms.length-1].w < W) spawnPlatform();
    // occasionally spawn a cloud
    if(Math.random()<0.02) spawnCloud();
    // collision with platforms (simple AABB from above)
    for(const p of platforms){
      if(player.vy>=0 &&
         player.x + player.w > p.x && player.x < p.x + p.w &&
         player.y + player.h >= p.y && player.y + player.h <= p.y + p.h){
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
        // spike check
        if(p.spike && player.x + player.w > p.x + p.w - 10){
          gameOver = true;
        }
      }
    }
    // fall off bottom
    if(player.y > H) gameOver = true;
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,H);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,W,H);

    // draw clouds (simple circles moving slowly)
    clouds.forEach(c => {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
      ctx.fill();
    });

    // player as rounded square
    ctx.fillStyle = '#0a0';
    drawRoundedRect(player.x, player.y, player.w, player.h, 4);

    // platforms with slight gradient
    const platGrad = ctx.createLinearGradient(0,0,0,20);
    platGrad.addColorStop(0, '#555');
    platGrad.addColorStop(1, '#777');
    ctx.fillStyle = platGrad;
    for(const p of platforms){
      drawRoundedRect(p.x, p.y, p.w, p.h, 3);
      if(p.spike){
        // draw spike as a triangle
        ctx.fillStyle = '#a00';
        ctx.beginPath();
        ctx.moveTo(p.x + p.w - 10, p.y);
        ctx.lineTo(p.x + p.w, p.y);
        ctx.lineTo(p.x + p.w - 10, p.y - 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = platGrad;
      }
    }
  }

  function loop(){
    if(gameOver){
      if (!gameOverPlayed) {
        playGameOverSound();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', W/2, H/2);
      return;
    }
    update();
    draw();
    frame++;
    requestAnimationFrame(loop);
  }

  // input handling
  function tryJump(){
    if(player.onGround){
      // Ensure audio context is running (required by some browsers)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.vy = JUMP_VEL;
      player.onGround = false;
      playJumpSound();
    }
  }
  document.addEventListener('keydown', e=>{ if(e.code==='Space') tryJump(); });
  canvas.addEventListener('click', tryJump);

  // start game
  reset();
})();
