// Simple Asteroid Dodge game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Simple beep generator
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  // Background drone
  let droneOsc = null;
  function startDrone(){
    if(droneOsc) return;
    droneOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    droneOsc.type = 'sawtooth';
    droneOsc.frequency.value = 40;
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    droneOsc.connect(gain);
    gain.connect(audioCtx.destination);
    droneOsc.start();
  }
  function stopDrone(){
    if(droneOsc){
      droneOsc.stop();
      droneOsc.disconnect();
      droneOsc = null;
    }
  }
  // Start audio on user interaction
  window.addEventListener('click',()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); startDrone(); },{once:true});
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  const ship = {x:50, y:height/2, w:30, h:20, dy:0, speed:4};

  // Starfield background
  const starCount = 120;
  const starSpeed = 0.3;
  const stars = [];
  for(let i=0;i<starCount;i++){
    stars.push({x:Math.random()*width, y:Math.random()*height, radius:Math.random()*1.5+0.5, twinkle:Math.random()});
  }
  const ship = {x:50, y:height/2, w:30, h:20, dy:0, speed:4};

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2.5;

  let lastSpawn = 0, score = 0, prevScore = 0, startTime = performance.now(), gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.key]=true});
  window.addEventListener('keyup',e=>{keys[e.key]=false});

  function update(dt){
    // Update star twinkle (simple pulsate)
    stars.forEach(s=>{
      s.twinkle += (Math.random()-0.5)*0.02;
      if(s.twinkle<0) s.twinkle=0;
      if(s.twinkle>1) s.twinkle=1;
      // Move stars leftwards for parallax effect
      s.x -= starSpeed;
      if(s.x < 0) s.x = width;
    });
    // Ship movement (W/S or ArrowUp/Down)
    ship.dy = 0;
    if(keys['ArrowUp']||keys['w']||keys['W']) ship.dy = -ship.speed;
    else if(keys['ArrowDown']||keys['s']||keys['S']) ship.dy = ship.speed;
    ship.y = Math.max(0, Math.min(height-ship.h, ship.y + ship.dy));

    // Asteroid spawn
    if(performance.now() - lastSpawn > asteroidSpawnInterval){
      const radius = 15 + Math.random()*10;
      asteroids.push({x:width+radius, y:Math.random()*height, r:radius});
      lastSpawn = performance.now();
      // Play a subtle spawn sound
      playBeep(120, 80);
    }

    // Move asteroids and check collisions
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x -= asteroidSpeed;
      // Collision with ship (simple AABB vs circle)
      const shipRect = {x:ship.x, y:ship.y, w:ship.w, h:ship.h};
      const nearestX = Math.max(shipRect.x, Math.min(a.x, shipRect.x+shipRect.w));
      const nearestY = Math.max(shipRect.y, Math.min(a.y, shipRect.y+shipRect.h));
      const dx = a.x - nearestX, dy = a.y - nearestY;
      if(dx*dx+dy*dy < a.r*a.r){ if(!gameOver){ playBeep(350,150); stopDrone(); } gameOver = true; }
      // Asteroid reaches left edge (crush)
      if(a.x - a.r <= 0) gameOver = true;
      // Remove off‑screen
      if(a.x + a.r < 0) asteroids.splice(i,1);
    }
    if(!gameOver) score = Math.floor((performance.now()-startTime)/1000);
  }

  function draw(){
    // Background cleared by filling black in ship draw section
    // Background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0,0,width,height);
    // Starfield
    stars.forEach(s=>{
      const alpha = 0.5 + s.twinkle * 0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    // Ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x+ship.w, ship.y+ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids with gradient shading
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score, 10, 20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  function loop(timestamp){
    if(!gameOver){
      const dt = timestamp - (lastRender||timestamp);
      update(dt);
    }
    draw();
    lastRender = timestamp;
    if(!gameOver) requestAnimationFrame(loop);
  }
  let lastRender;
  requestAnimationFrame(loop);
})();
