// Minimal endless runner targeting <canvas id="game">
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  }
  function playJump(){ playTone(300, 0.1); }
  function playGameOver(){ playTone(100, 0.5); }

  // Game state
  let player = {x:50, y:height-30, w:20, h:20, vy:0, onGround:true};
  let clouds = [];
  let cloudTimer = 0;
  let gameEnded = false;
  const gravity = 0.8;
  const jumpStrength = -15;
  let obstacles = [];
  let spawnTimer = 0;
  let score = 0;
  let running = true;

  // Input handling
  function jump(){
    // Ensure audio context is running (required by browsers after user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if(player.onGround){
      player.vy = jumpStrength;
      player.onGround = false;
      playJump();
    }
  }
  canvas.addEventListener('click', jump);
  canvas.addEventListener('touchstart', e=>{e.preventDefault(); jump();});
  document.addEventListener('keydown', e=>{if(e.code==='Space') jump();});

  function spawnObstacle(){
    const size = 20 + Math.random()*30;
    obstacles.push({x:width, y:height-size, w:size, h:size});
  }

  function update(){
    // player physics
    player.vy += gravity;
    player.y += player.vy;
    if(player.y + player.h >= height){
      player.y = height - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    // obstacles movement & spawn
    spawnTimer--;
    if(spawnTimer <= 0){
      spawnObstacle();
      spawnTimer = 80 + Math.random()*120; // frames until next obstacle
    }
    obstacles.forEach(o=> o.x -= 4);
    // remove off‑screen obstacles
    obstacles = obstacles.filter(o=> o.x + o.w > 0);
    // cloud movement & spawn
    cloudTimer--;
    if(cloudTimer <= 0){
      // spawn cloud with random size and vertical position
      const rX = 30 + Math.random()*20;
      const rY = 15 + Math.random()*10;
      const yPos = 20 + Math.random()* (height/2 - 40);
      clouds.push({x:width, y:yPos, rX, rY});
      cloudTimer = 150 + Math.random()*200;
    }
    clouds.forEach(c=> c.x -= 2);
    clouds = clouds.filter(c=> c.x + c.rX > 0);
    // collision detection
    for(const o of obstacles){
      if(player.x < o.x+o.w && player.x+player.w > o.x &&
         player.y < o.y+o.h && player.y+player.h > o.y){
        running = false;
      }
    }
    if(running) score++;
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // Sky gradient background
    const skyGrad = ctx.createLinearGradient(0,0,0,height);
    skyGrad.addColorStop(0, '#87ceeb'); // sky blue
    skyGrad.addColorStop(0.7, '#cceeff');
    skyGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0,0,width,height);
    // Ground strip
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0,height-groundHeight,width,groundHeight);
    // Clouds (simple white ellipses)
    clouds.forEach(c=>{
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.rX, c.rY, 0, 0, Math.PI*2);
      ctx.fill();
    });
    // Player with rounded corners and gradient
    const playerGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y+player.h);
    playerGrad.addColorStop(0, '#0099ff');
    playerGrad.addColorStop(1, '#0033cc');
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
    // Obstacles as triangles (spikes)
    ctx.fillStyle = '#ff3300';
    obstacles.forEach(o=>{
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
  }

  function loop(){
    if(!running){
      if(!gameEnded){
        playGameOver();
        gameEnded = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2-10);
      ctx.fillText('Score: '+score, width/2, height/2+20);
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the loop
  requestAnimationFrame(loop);
})();
