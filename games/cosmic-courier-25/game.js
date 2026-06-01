// Simple Cosmic Courier game
// Canvas id="game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Player ship
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust(){ playTone(400, 0.05); }
  function playCollect(){ playTone(800, 0.1); }
  function playCollision(){ playTone(200, 0.3); }
  function playGameOver(){ playTone(100, 0.5); }
  let lastThrustTime = 0;
  const ship = {x: 80, y: height/2, w: 20, h: 12, vy:0, speed:2, fuel:100};

  // Game objects
  const obstacles = [];
  const packages = [];
  let score = 0;
  let lastTime = 0;
  let gameOverPlayed = false;
  // Starfield background
  const stars = [];
  function initStars(count){
    for(let i=0;i<count;i++){
      stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*1.5+0.5, speed: 0.5+Math.random()*0.5});
    }
  }
  initStars(100);


  function spawnObstacle(){
    const size = 20 + Math.random()*30;
    obstacles.push({x: width, y: Math.random()*(height-size), w:size, h:size, vx:-3});
  }
  function spawnPackage(){
    const size = 12;
    packages.push({x: width, y: Math.random()*(height-size), w:size, h:size, vx:-3, collected:false});
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.code]=true; audioCtx.resume && audioCtx.resume();});
  window.addEventListener('keyup',e=>{keys[e.code]=false});

  function update(dt){
    // Move stars for background
    stars.forEach(s=>{s.x -= s.speed; if(s.x < 0) s.x = width;});
    // Fuel drains over time
    ship.fuel -= dt*0.02; // adjust rate
    // Controls
    if(keys['ArrowUp']) ship.vy = -ship.speed;
    else if(keys['ArrowDown']) ship.vy = ship.speed;
    else ship.vy = 0;
    // Play thrust sound on vertical movement (throttle)
    if(keys['ArrowUp'] || keys['ArrowDown']){
      const now = performance.now();
      if(now - lastThrustTime > 100){
        playThrust();
        lastThrustTime = now;
      }
    }
    if(keys['ArrowLeft']) ship.x -= ship.speed;
    if(keys['ArrowRight']) ship.x += ship.speed;
    ship.y += ship.vy;
    // Keep within bounds
    ship.y = Math.max(0, Math.min(height-ship.h, ship.y));
    ship.x = Math.max(0, Math.min(width-ship.w, ship.x));

    // Move obstacles and packages
    obstacles.forEach(o=>o.x += o.vx);
    packages.forEach(p=>p.x += p.vx);
    // Remove off‑screen
    while(obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
    while(packages.length && packages[0].x + packages[0].w < 0) packages.shift();

    // Collision detection
    function rectIntersect(a,b){
      return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
    }
    for(const o of obstacles){
      if(rectIntersect(ship,o)){
        playCollision();
        ship.fuel = 0; // instant loss
      }
    }
    for(const p of packages){
      if(!p.collected && rectIntersect(ship,p)){
        p.collected = true; score+=10; ship.fuel = Math.min(100, ship.fuel+5);
        playCollect();
      }
    }
  }

  function draw(){
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#001');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // Stars with twinkle
    ctx.fillStyle = '#fff';
    stars.forEach(s=>{ ctx.globalAlpha = 0.5 + Math.random()*0.5; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha = 1.0;
    // Ship (triangle)
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Obstacles as circles
    ctx.fillStyle = '#f44';
    obstacles.forEach(o=>{ ctx.beginPath(); ctx.arc(o.x+o.w/2, o.y+o.h/2, o.w/2,0,Math.PI*2); ctx.fill(); });
    // Packages as diamonds
    ctx.fillStyle = '#ff0';
    packages.forEach(p=>{ if(p.collected) return; ctx.beginPath(); ctx.moveTo(p.x, p.y + p.h/2); ctx.lineTo(p.x + p.w/2, p.y); ctx.lineTo(p.x + p.w, p.y + p.h/2); ctx.lineTo(p.x + p.w/2, p.y + p.h); ctx.closePath(); ctx.fill(); });
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    ctx.fillText('Fuel: '+Math.max(0, Math.floor(ship.fuel)), 10, 40);
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(ship.fuel>0){
      // spawn obstacles/packages at intervals
      if(Math.random()<0.02) spawnObstacle();
      if(Math.random()<0.01) spawnPackage();
      update(dt);
      draw();
      requestAnimationFrame(loop);
} else {
       // Game over screen
       if(!gameOverPlayed){
         playGameOver();
         gameOverPlayed = true;
       }
       ctx.fillStyle = '#000';
       ctx.fillRect(0,0,width,height);
       ctx.fillStyle = '#f00';
       ctx.font = '30px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText('Game Over', width/2, height/2);
       ctx.fillText('Score: '+score, width/2, height/2+40);
     }
  }
  requestAnimationFrame(loop);
})();
