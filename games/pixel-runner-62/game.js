// Pixel Runner – enhanced graphics
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 200;

  // ----- Game objects -----
  const player = {x:50, y:H-40, w:30, h:30, vy:0, jumpStrength:-12, onGround:true};
  const GRAVITY = 0.6;
  const obstacles = [];
  let obstacleTimer = 0;
  const OBSTACLE_SPACING = 1500; // ms

  // Parallax background layers
  const layers = {
    sky: {colorTop: '#87CEEB', colorBottom: '#B0E0E6'}, // light sky blue gradient
    distant: {speed: 0.2, color: '#C2B280'}, // far hills/mountains
    near: {speed: 0.5, color: '#6B8E23'}, // closer hills
    ground: {color: '#355E3B'} // ground grass
  };

  let lastTime=0, gameOver=false;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function reset(){
    player.y = H-40; player.vy=0; player.onGround=true;
    obstacles.length=0; obstacleTimer=0; gameOver=false; lastTime=0;
    drawGameOver.played = false;
    requestAnimationFrame(loop);
  }

  function loop(timestamp){
    if(!lastTime) lastTime=timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(gameOver) return drawGameOver();

    // Update background scroll offsets
    layers.distant.offset = (layers.distant.offset||0) + layers.distant.speed*dt;
    layers.near.offset = (layers.near.offset||0) + layers.near.speed*dt;

    // Player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y >= H-40){
      player.y = H-40; player.vy=0; player.onGround=true;
    }

    // Spawn obstacles
    obstacleTimer += dt;
    if(obstacleTimer > OBSTACLE_SPACING){
      obstacleTimer = 0;
      obstacles.push({x:W, w:20, h:40});
    }

    // Move obstacles & collision
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= 3; // constant speed
      if(!gameOver && o.x < player.x+player.w && o.x+o.w > player.x &&
         player.y+player.h > H-40 && player.y < H-40+o.h){
        gameOver = true;
      }
      if(o.x+o.w < 0) obstacles.splice(i,1);
    }

    draw();
    requestAnimationFrame(loop);
  }

  // ----- Rendering -----
  function draw(){
    ctx.clearRect(0,0,W,H);
    drawSky();
    drawHills(layers.distant, 0.3);
    drawHills(layers.near, 0.5);
    drawGround();
    drawPlayer();
    drawObstacles();
  }

  function drawSky(){
    const grad = ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0, layers.sky.colorTop);
    grad.addColorStop(1, layers.sky.colorBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,W,H);
  }

  // Draw simple hills using sinusoidal shapes
  function drawHills(layer, amplitude){
    ctx.fillStyle = layer.color;
    const offset = (layer.offset||0) % W;
    ctx.beginPath();
    ctx.moveTo(-offset, H*0.6);
    const step = 30; // pixel step for smoothness
    for(let x=-offset; x<=W+step; x+=step){
      const y = H*0.6 + Math.sin((x+offset)/50) * amplitude * 30;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawGround(){
    ctx.fillStyle = layers.ground.color;
    const groundY = H*0.8;
    ctx.fillRect(0, groundY, W, H-groundY);
    // Simple ground texture – vertical lines
    ctx.strokeStyle = '#2E4F2C';
    ctx.lineWidth = 2;
    for(let x=0; x<W; x+=15){
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function drawPlayer(){
    // Pixel‑art style runner – simple stick figure
    ctx.fillStyle = '#FF6600';
    ctx.fillRect(player.x, player.y, player.w, player.h); // body block
    // head
    ctx.beginPath();
    ctx.arc(player.x+player.w/2, player.y-10, 8, 0, Math.PI*2);
    ctx.fillStyle = '#FFCC99';
    ctx.fill();
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x+player.w/2-4, player.y-12, 2, 2);
    ctx.fillRect(player.x+player.w/2+2, player.y-12, 2, 2);
  }

  function drawObstacles(){
    ctx.fillStyle = '#333';
    obstacles.forEach(o=>{
      // simple obstacle – a spike triangle
      ctx.beginPath();
      ctx.moveTo(o.x, H-40);
      ctx.lineTo(o.x+o.w/2, H-40-o.h);
      ctx.lineTo(o.x+o.w, H-40);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawGameOver(){
    draw();
    // Play game over sound once
    if(!drawGameOver.played){
      playBeep(150,0.3);
      drawGameOver.played = true;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#FFF';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2);
    ctx.fillText('Click or Space to Restart', W/2, H/2+30);
  }

  // ----- Input -----
  function jump(){
    if(player.onGround && !gameOver){
      player.vy = player.jumpStrength;
      player.onGround = false;
      playBeep(400,0.1); // jump sound
    }
  }
  canvas.addEventListener('mousedown',()=>{ gameOver?reset():jump(); });
  window.addEventListener('keydown',e=>{ if(e.code==='Space'){ e.preventDefault(); gameOver?reset():jump(); } });

  reset();
})();
