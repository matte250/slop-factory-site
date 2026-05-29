// Simple endless runner
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJump(){ beep(400, 0.07); }
  function playHit(){ beep(150, 0.2); }
  function playGameOver(){ beep(80, 0.5); }
  const W = canvas.width = canvas.clientWidth || 400;
  const H = canvas.height = canvas.clientHeight || 200;
  const GROUND_HEIGHT = 20;
  const GRAVITY = 0.5, JUMP = -10;
  let speed = 2, frame = 0, gameOver = false; let gameOverSoundPlayed = false;
  const player = {x:50, y:H - GROUND_HEIGHT - 10, w:10, h:10, vy:0, onGround:true};
  const obstacles = [];
  function spawn(){
    const size = 10 + Math.random()*10;
    // obstacles sit on top of the ground strip
    obstacles.push({x:W, y:H - GROUND_HEIGHT - size, w:size, h:size});
  }
  function update(){
    if(gameOver) return;
    frame++;
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y+player.h>H - GROUND_HEIGHT){ player.y=H - GROUND_HEIGHT - player.h; player.vy=0; player.onGround=true; }
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x -= speed;
      if(o.x+o.w<0) obstacles.splice(i,1);
      // collision
      if(o.x<player.x+player.w && o.x+o.w>player.x && o.y<player.y+player.h && o.y+o.h>player.y){ gameOver=true; playHit(); }
    }
    // spawn logic
    if(frame%Math.max(60-Math.floor(speed*10),20)===0) spawn();
    // increase speed
    speed += 0.001;
    // play game over sound once
    if(gameOver && !gameOverSoundPlayed){
      audioCtx.resume();
      playGameOver();
      gameOverSoundPlayed = true;
    }
  }
  function draw(){
    // background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#87ceeb'); // sky blue
    grad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ground strip
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);

    // player as a circle with shadow
    ctx.save();
    ctx.fillStyle = '#ffdd00';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // obstacles as rounded rectangles with gradient
    obstacles.forEach(o => {
      const oGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
      oGrad.addColorStop(0, '#ff5722');
      oGrad.addColorStop(1, '#bf360c');
      ctx.fillStyle = oGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }
  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  // input
  window.addEventListener('keydown',e=>{ if(e.code==='Space'&&player.onGround){ audioCtx.resume(); playJump(); player.vy=JUMP; player.onGround=false; } });
  canvas.addEventListener('click',()=>{ if(player.onGround){ audioCtx.resume(); playJump(); player.vy=JUMP; player.onGround=false; } });
  // start
  spawn();
  requestAnimationFrame(loop);
})();
