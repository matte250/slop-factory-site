// Simple Pixel Dodge game
(function(){
  const canvas=document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx=canvas.getContext('2d');
  const WIDTH=canvas.width=400;
  const HEIGHT=canvas.height=600;

  const player={w:40,h:20,x:WIDTH/2-20,y:HEIGHT-30, speed:5};
  const keys={left:false,right:false};
  const circles=[]; // falling obstacles
  const stars=[]; // background stars
  let spawnTimer=0, spawnInterval=60; // frames
  // sound effects
  const hitSound = new Audio('hit.wav'); // play on collision
  const spawnSound = new Audio('spawn.wav'); // optional spawn sound
  let speedIncrement=0.02; // increase fall speed over time
  let baseFallSpeed=2;
  let score=0;
  let gameOver=false;

  function update(){
    if(gameOver) return;
    // move player
    if(keys.left) player.x-=player.speed;
    if(keys.right) player.x+=player.speed;
    player.x=Math.max(0, Math.min(WIDTH-player.w, player.x));

    // spawn circles
    if(--spawnTimer<=0){
      const radius=Math.random()*15+10;
      circles.push({x:Math.random()*(WIDTH-radius*2)+radius, y:-radius, r:radius, speed:baseFallSpeed+Math.random()*2});
        spawnSound.currentTime=0; spawnSound.play();
      spawnTimer=spawnInterval;
      spawnInterval=Math.max(20, spawnInterval-1); // faster spawning
    }

    // update circles
    for(let i=circles.length-1;i>=0;i--){
      const c=circles[i];
      c.y+=c.speed;
      // collision with player
      if(c.y + c.r > player.y && c.x > player.x && c.x < player.x+player.w){
        hitSound.play();
        gameOver=true; break;
      }
      // remove off-screen
      if(c.y - c.r > HEIGHT) circles.splice(i,1), score++;
    }
    if(!gameOver) score++; // increase score each frame
  }

  function draw(){
    // Draw a subtle vertical gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#111');
    bgGrad.addColorStop(1, '#222');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw player with rounded corners and a slight glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,150,255,0.7)';
    ctx.shadowBlur = 12;
    const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
    playerGrad.addColorStop(0, '#00aaff');
    playerGrad.addColorStop(1, '#0044ff');
    ctx.fillStyle = playerGrad;
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
    ctx.restore();

    // Draw circles with radial gradients and shadow
    circles.forEach(c => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,0,0,0.5)';
      ctx.shadowBlur = 8;
      const grad = ctx.createRadialGradient(c.x, c.y, c.r * 0.1, c.x, c.y, c.r);
      grad.addColorStop(0, '#ff6666');
      grad.addColorStop(1, '#990000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  // input handling
  window.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft' || e.key==='a') keys.left=true; if(e.key==='ArrowRight' || e.key==='d') keys.right=true; });
  window.addEventListener('keyup',e=>{ if(e.key==='ArrowLeft' || e.key==='a') keys.left=false; if(e.key==='ArrowRight' || e.key==='d') keys.right=false; });

  loop();
})();
