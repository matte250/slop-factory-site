// game.js – minimal endless runner for canvas#game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 400;
  const ground = h - 40;

  const player = {x:50, y:ground-20, w:20, h:20, vy:0, jumpForce:-12, onGround:true};
  const gravity = 0.6;

  const obstacles = [];
  let spawnTimer = 0;
  let gameOver = false;

  function spawnObstacle(){
    const size = 20 + Math.random()*30;
    obstacles.push({x:w, y:ground-size, w:size, h:size, type:'spike'});
  }

  function update(){
    if(gameOver) return;
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y >= ground-player.h){
      player.y = ground-player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles
    spawnTimer--;
    if(spawnTimer <= 0){
      spawnObstacle();
      spawnTimer = 90 + Math.random()*60; // frames
    }
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= 4; // scroll speed
      // collision
      if(o.x < player.x+player.w && o.x+o.w > player.x &&
         player.y+player.h > o.y){
        playTone(200, 0.3); // collision sound
gameOver = true;
      }
      // remove off‑screen
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,w,0);
    bgGrad.addColorStop(0, '#87ceeb');
    bgGrad.addColorStop(1, '#1e90ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);

    // ground with texture
    ctx.fillStyle = '#3e3e3e';
    ctx.fillRect(0,ground,w, h-ground);
    // draw ground line
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0,ground+1);
    ctx.lineTo(w,ground+1);
    ctx.stroke();

    // player as rounded rectangle with gradient
    const pGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    pGrad.addColorStop(0, '#00ff00');
    pGrad.addColorStop(1, '#006400');
    ctx.fillStyle = pGrad;
    const radius = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + radius, player.y);
    ctx.lineTo(player.x + player.w - radius, player.y);
    ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
    ctx.lineTo(player.x + player.w, player.y + player.h - radius);
    ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
    ctx.lineTo(player.x + radius, player.y + player.h);
    ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
    ctx.lineTo(player.x, player.y + radius);
    ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
    ctx.closePath();
    ctx.fill();

    // obstacles – draw spikes as triangles
    ctx.fillStyle = '#c00';
    obstacles.forEach(o=>{
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // game over overlay
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w/2, h/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  // input
  window.addEventListener('keydown', e=>{
    if(e.code==='Space' && player.onGround){
      // ensure audio context is running
      audioCtx.resume();
      playTone(440, 0.1); // jump sound
      player.vy = player.jumpForce;
      player.onGround = false;
    }
    if(e.code==='Space' && gameOver){
      // restart
      obstacles.length = 0;
      player.y = ground-player.h;
      player.vy = 0;
      player.onGround = true;
      gameOver = false;
      spawnTimer = 0;
      loop();
    }
  });

  loop();
})();
