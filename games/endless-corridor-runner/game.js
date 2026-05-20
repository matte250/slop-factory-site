// Endless Corridor Runner
// Assumes a <canvas id="game"></canvas> exists in the page.
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const width=canvas.width=window.innerWidth;
  const height=canvas.height=window.innerHeight;

  const GRAVITY=0.6;
  const JUMP=-12;
  const SPEED=4; // scrolling speed

  const player={x:50,y:height-50,w:30,h:30,vy:0,ground:height-50};
  let obstacles=[];
  let frame=0;
  let gameOver=false;

  function spawnObstacle(){
    const size=Math.random()*30+20;
    obstacles.push({x:width, y:player.ground-size, w:size, h:size});
  }

  function update(){
    if(gameOver) return;
    // Player physics
    player.vy+=GRAVITY;
    player.y+=player.vy;
    if(player.y>player.ground){
      player.y=player.ground;
      player.vy=0;
    }
    // Obstacles movement
    for(let i=obstacles.length-1;i>=0;i--){
      const o=obstacles[i];
      o.x-=SPEED;
      // collision
        if(o.x<player.x+player.w && o.x+o.w>player.x &&
           o.y<player.y+player.h && o.y+o.h>player.y){
          gameOver=true;
          // Play collision/game-over sound
          playTone(200, 0.3);
        }
      // remove off‑screen
      if(o.x+o.w<0) obstacles.splice(i,1);
    }
    // spawn
    if(frame%90===0) spawnObstacle();
    frame++;
  }

  function draw(){
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,0);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#3b3b5c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);

    // Floor with gradient
    const floorGrad = ctx.createLinearGradient(0,player.ground+player.h,width,player.ground+player.h);
    floorGrad.addColorStop(0, '#555');
    floorGrad.addColorStop(1, '#aaa');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0,player.ground+player.h,width,2);

    // Player with rounded corners and gradient shading
    const pGrad = ctx.createLinearGradient(player.x,player.y,player.x,player.y+player.h);
    pGrad.addColorStop(0, '#00ff00');
    pGrad.addColorStop(1, '#006400');
    ctx.fillStyle = pGrad;
    const radius = 6;
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

    // Obstacles with varying colors and slight shadow
    obstacles.forEach(o=>{
      const obsGrad = ctx.createLinearGradient(o.x, o.y, o.x, o.y+o.h);
      obsGrad.addColorStop(0, '#ff5555');
      obsGrad.addColorStop(1, '#b20000');
      ctx.fillStyle = obsGrad;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle='#fff';
      ctx.font='48px sans-serif';
      ctx.textAlign='center';
      ctx.fillText('Game Over',width/2,height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }

  // input handling
  function jump(){
    if(player.y===player.ground){
      player.vy=JUMP;
      // Play jump sound
      playTone(400, 0.1);
    }
  }
  window.addEventListener('keydown',e=>{if(e.code==='Space')jump();});
  window.addEventListener('mousedown',jump);
  window.addEventListener('touchstart',e=>{e.preventDefault();jump();});

  loop();
})();
