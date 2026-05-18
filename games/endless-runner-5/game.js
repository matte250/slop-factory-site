// Endless runner game for canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // canvas size (adjust as needed)
  canvas.width = 800; canvas.height = 200;

  const GRAVITY = 0.6;
  const JUMP_VELOCITY = -12;
  const OBSTACLE_SPEED = 6;
  const SPAWN_INTERVAL = 1500; // ms

  const player = {x:50, y:canvas.height-40, w:30, h:30, vy:0, onGround:true};
  let obstacles = [];
  let score = 0;
  let lastSpawn = 0;
  let gameOver = false;

  function reset(){
    player.y = canvas.height-40; player.vy=0; player.onGround=true;
    obstacles=[]; score=0; lastSpawn=0; gameOver=false; requestAnimationFrame(loop);
  }

  function spawnObstacle(){
    const size = 30 + Math.random()*20; // width & height
    obstacles.push({x:canvas.width, y:canvas.height-size, w:size, h:size});
  }

  function update(dt){
    // player physics
    player.vy += GRAVITY;
    player.y += player.vy;
    if(player.y + player.h >= canvas.height){
      player.y = canvas.height - player.h;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }
    // obstacles
    for(let i=obstacles.length-1;i>=0;i--){
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      // collision
      if(o.x < player.x + player.w && o.x + o.w > player.x &&
         o.y < player.y + player.h && o.y + o.h > player.y){
        gameOver = true;
        playTone(150, 0.5); // crash sound
      }
      // remove off‑screen
      if(o.x + o.w < 0) obstacles.splice(i,1);
    }
    // spawn new obstacles
    if(Date.now() - lastSpawn > SPAWN_INTERVAL){
      spawnObstacle();
      lastSpawn = Date.now();
    }
    // score
    if(!gameOver) score++; // simple frame‑based score
  }

  function draw(){
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#e0f6ff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);

    // Player (rounded with gradient)
    const playerGrad = ctx.createRadialGradient(
      player.x + player.w / 2,
      player.y + player.h / 2,
      5,
      player.x + player.w / 2,
      player.y + player.h / 2,
      player.w
    );
    playerGrad.addColorStop(0, '#00c6ff');
    playerGrad.addColorStop(1, '#0072ff');
    ctx.fillStyle = playerGrad;
    ctx.beginPath();
    ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
    ctx.fill();

    // Obstacles (spike triangles)
    ctx.fillStyle = '#ff3b30';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });

    // Score display
    ctx.fillStyle = '#000';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press "r" to restart', canvas.width / 2, canvas.height / 2 + 40);
    }
  }

  let lastTime = 0;
  function loop(timestamp){
    if(!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  // controls
  window.addEventListener('keydown',e=>{
    // Ensure AudioContext is running (required on some browsers)
    if(audioCtx.state === 'suspended') audioCtx.resume();
    if((e.code==='Space' || e.code==='ArrowUp') && player.onGround && !gameOver){
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(440, 0.1); // jump sound
    }
    if(e.key==='r' && gameOver){ reset(); }
  });

  // play crash sound on game over
  function checkGameOver(){
    if(gameOver){
      playTone(150, 0.5);
    }
  }


  // start
  reset();
})();
