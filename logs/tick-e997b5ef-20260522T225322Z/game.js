// Simple Meteor Escape game
// Canvas element with id="game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container
  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // generate star field
    stars = [];
    for(let i=0;i<100;i++){
      stars.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height,
        r: 0.5 + Math.random()*1.5
      });
    }
  }

  // Audio assets
  const backgroundMusic = new Audio('background.mp3');
  backgroundMusic.loop = true;
  const crashSound = new Audio('crash.wav');
  const thrustSound = new Audio('thrust.wav');
  let audioStarted = false;
  window.addEventListener('resize', resize);
  resize();

  // Ship definition
  const ship = {x:0, y:0, w:30, h:30, speed:200};
  function resetShip(){
    ship.x = canvas.width/2 - ship.w/2;
    ship.y = canvas.height - ship.h - 10;
  }
  resetShip();

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.key]=true; if(!audioStarted && (e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown')){ backgroundMusic.play(); audioStarted=true; } if(e.key==='ArrowLeft' || e.key==='ArrowRight' || e.key==='ArrowUp' || e.key==='ArrowDown'){ thrustSound.currentTime=0; thrustSound.play(); } });
  window.addEventListener('keyup',e=>{keys[e.key]=false});

  // Meteor definition
  const meteors = [];
  let stars = [];
  let spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let meteorSpeed = 100; // px/s, will increase over time

  // Game state
  let startTime = null;
  let elapsed = 0;
  let gameOver = false;
  const gameDuration = 60; // seconds

  function spawnMeteor(){
    const size = 20 + Math.random()*30;
    meteors.push({x:Math.random()*(canvas.width-size), y:-size, w:size, h:size});
  }

  function update(dt){
    if(gameOver) return;
    // Move ship
    if(keys.ArrowLeft) ship.x -= ship.speed*dt;
    if(keys.ArrowRight) ship.x += ship.speed*dt;
    if(keys.ArrowUp) ship.y -= ship.speed*dt;
    if(keys.ArrowDown) ship.y += ship.speed*dt;
    // Clamp ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));
    // Spawn meteors
    if(performance.now() - lastSpawn > spawnInterval){
      spawnMeteor();
      lastSpawn = performance.now();
    }
    // Increase difficulty over time
    meteorSpeed = 100 + elapsed*10; // 10px/s per second
    // Update meteors
    for(let i=meteors.length-1;i>=0;i--){
      const m = meteors[i];
      m.y += meteorSpeed*dt;
      // Remove off‑screen meteors
      if(m.y > canvas.height) meteors.splice(i,1);
    }
    // Collision detection
    for(const m of meteors){
      if(!(ship.x+ship.w < m.x || ship.x > m.x+m.w || ship.y+ship.h < m.y || ship.y > m.y+m.h)){
        crashSound.currentTime=0;
        crashSound.play();
        gameOver = true;
        backgroundMusic.pause();
        break;
      }
    }
    // Timer check
    elapsed = (performance.now()-startTime)/1000;
    if(elapsed >= gameDuration) gameOver = true;
  }

  function draw(){
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
    // Draw ship as triangle
    ctx.fillStyle = '#00f';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw meteors with radial gradient
    for(const m of meteors){
      const grad = ctx.createRadialGradient(m.x+m.w/2, m.y+m.h/2, m.w*0.1, m.x+m.w/2, m.y+m.h/2, m.w/2);
      grad.addColorStop(0, '#ff4e50');
      grad.addColorStop(1, '#c04848');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x+m.w/2, m.y+m.h/2, m.w/2,0,Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Time: '+(gameDuration-Math.max(0,Math.floor(elapsed))),10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      const score = Math.floor(elapsed);
      ctx.fillText('Game Over – Score: '+score, canvas.width/2, canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!startTime) startTime = timestamp;
    const dt = (timestamp - (lastTime||timestamp))/1000;
    lastTime = timestamp;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  let lastTime = 0;
  requestAnimationFrame(loop);
})();
