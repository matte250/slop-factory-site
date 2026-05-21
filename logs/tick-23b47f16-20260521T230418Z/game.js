// Minimal "Cosmic Dodge" prototype targeting <canvas id="game">
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // size canvas to its displayed size
  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    initStars();
  }
  window.addEventListener('resize', resize);
  resize();

  // Player ship (triangle)
  const ship = {x:50, y:canvas.height/2, w:20, h:15, speed:3};
  const keys = {ArrowUp:false,ArrowDown:false,ArrowLeft:false,ArrowRight:false,W:false,A:false,S:false,D:false};
  let audioStarted = false;
  window.addEventListener('keydown',e=>{if(e.key in keys){keys[e.key]=true; if(!audioStarted){audioCtx.resume(); audioStarted=true; }}});
  window.addEventListener('keyup',e=>{if(e.key in keys) keys[e.key]=false;});

  // Obstacles (asteroids) array
  const asteroids = [];
  // Starfield data
  const stars = [];
  function initStars(){
    stars.length = 0;
    const count = Math.min(200, canvas.width * canvas.height / 5000 | 0);
    for(let i=0;i<count;i++){
      stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, bright:Math.random()<0.5});
    }
  }
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let spawnTimer = 0;
  let distance = 0;
  let gameOver = false;

  function spawnAsteroid(){
    const size = Math.random()*30+10;
    const y = Math.random()* (canvas.height - size);
    const speed = Math.random()*2+2; // leftward speed
    asteroids.push({x:canvas.width+size, y, size, speed});
  }

  function update(){
    if(gameOver) return;
    // move ship
    let moved = false;
    if(keys.ArrowUp||keys.W){ ship.y -= ship.speed; moved = true; }
    if(keys.ArrowDown||keys.S){ ship.y += ship.speed; moved = true; }
    if(keys.ArrowLeft||keys.A){ ship.x -= ship.speed; moved = true; }
    if(keys.ArrowRight||keys.D){ ship.x += ship.speed; moved = true; }
    // keep inside canvas
    ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));
    ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
    // play movement sound (throttle)
    if(moved && (audioCtx && audioStarted)){
      const now = performance.now();
      if(!window.lastMoveSound || now - window.lastMoveSound > 100){ // 100ms debounce
        playTone(440, 0.05);
        window.lastMoveSound = now;
      }
    }

    // spawn logic: increase difficulty over time
    spawnTimer -= 1;
    if(spawnTimer <= 0){
      spawnAsteroid();
      // faster spawns as distance grows
      spawnTimer = Math.max(20, 100 - distance*0.05);
    }

    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x -= a.speed;
      if(a.x + a.size < 0) asteroids.splice(i,1);
    }

    // collision detection (simple AABB)
    for(const a of asteroids){
      if(ship.x < a.x + a.size && ship.x + ship.w > a.x &&
         ship.y < a.y + a.size && ship.y + ship.h > a.y){
        gameOver = true;
        // play crash sound
        if(audioCtx && audioStarted) playTone(150, 0.3);
        break;
      }
    }

    distance += 0.5; // arbitrary distance increment per frame
  }

function draw(){
    // background gradient (space)
    const grad = ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // starfield twinkling update
    for(const s of stars){
      // random twinkle
      if(Math.random()<0.02) s.bright = !s.bright;
    }
    // starfield draw
    for(const s of stars){
      ctx.fillStyle = s.bright ? '#fff' : '#888';
      ctx.fillRect(s.x, s.y, 2, 2);
    }
    // ship with gradient
    ctx.save();
    ctx.translate(ship.x + ship.w/2, ship.y + ship.h/2);
    const shipGrad = ctx.createLinearGradient(-ship.w/2,0,ship.w/2,0);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#080');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(-ship.w/2, 0);
    ctx.lineTo(ship.w/2, -ship.h/2);
    ctx.lineTo(ship.w/2, ship.h/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with irregular polygon
    ctx.fillStyle = '#a52a2a';
    for(const a of asteroids){
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.speed * 0.1); // slight rotation based on speed
      ctx.beginPath();
      const r = a.size/2;
      for(let i=0;i<7;i++){
        const angle = (i*2*Math.PI)/7;
        const rad = r * (0.5 + Math.random()*0.5);
        ctx.lineTo(Math.cos(angle)*rad, Math.sin(angle)*rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Distance: '+Math.floor(distance), 10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }
    // ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids
    ctx.fillStyle = '#a52a2a';
    for(const a of asteroids){
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size/2, 0, Math.PI*2);
      ctx.fill();
    }
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Distance: '+Math.floor(distance), 10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
