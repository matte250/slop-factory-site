// Simple endless runner for canvas#game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 800;
  const height = canvas.height = canvas.offsetHeight || 400;

  // Sound effects
  const jumpSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=');

  // Player
  const player = {x:50, y:height-60, w:30, h:30, vy:0, jumpForce:-12, onGround:false};
  const gravity = 0.5;

  // Obstacles
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames

  function addObstacle(){
    const size = 30 + Math.random()*30;
    obstacles.push({x:width, y:height-size, w:size, h:size});
  }

  function update(){
    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y + player.h >= height){
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Jump on space or click
    if(inputSpace){
      if(player.onGround){
        player.vy = player.jumpForce;
        // play jump sound
        jumpSound.currentTime = 0;
        jumpSound.play();
      }
      inputSpace = false;
    }

    // Obstacles movement
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= 5;
      // remove off‑screen
      if(o.x + o.w < 0) obstacles.splice(i,1);
    }
    // spawn obstacles
    obstacleTimer++;
    if(obstacleTimer > obstacleInterval){
      addObstacle();
      obstacleTimer = 0;
    }

    // Collision detection
    for(const o of obstacles){
      if(player.x < o.x+o.w && player.x+player.w > o.x &&
         player.y < o.y+o.h && player.y+player.h > o.y){
        // Game over
        cancelAnimationFrame(animId);
        // play game over sound
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        alert('Game Over');
        return;
      }
    }
  }

  function draw(){
    // sky gradient background
    const skyGrad = ctx.createLinearGradient(0,0,width,height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#4682B4'); // deeper blue
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,width,height);
    // ground
    const groundHeight = 40;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0,height-groundHeight,width,groundHeight);
    // player (simple pixel art with eyes)
    ctx.fillStyle = '#ff0';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x+8, player.y+8, 4, 4);
    ctx.fillRect(player.x+player.w-12, player.y+8, 4, 4);
    // obstacles (draw as darker blocks)
    ctx.fillStyle = '#b22222';
    for(const o of obstacles){
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  }

  let animId;
  function loop(){
    update();
    draw();
    animId = requestAnimationFrame(loop);
  }

  // Input handling
  let inputSpace = false;
  window.addEventListener('keydown',e=>{ if(e.code==='Space') inputSpace=true; });
  canvas.addEventListener('click',()=>{ inputSpace=true; });

  // start
  loop();
})();
