// Minimal Asteroid Escape game targeting <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){console.error('Canvas #game not found');return;}
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration/1000);
    osc.start(now);
    osc.stop(now + duration/1000);
  }
  function scoreSound(){ playTone(600, 80); }
  function collisionSound(){ playTone(200, 200); }

  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship (triangle)
  const ship = {w:40, h:20, x:width/2-20, y:height-30, speed:5};
  // Generate background stars
  const stars = Array.from({length:100},()=>({
    x: Math.random()*width,
    y: Math.random()*height,
    r: Math.random()*2+1
  }));
  const ship = {w:40, h:20, x:width/2-20, y:height-30, speed:5};
  const keys = {left:false,right:false};

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Score
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')keys.left=true; if(e.key==='ArrowRight')keys.right=true;});
  window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft')keys.left=false; if(e.key==='ArrowRight')keys.right=false;});

  function spawnAsteroid(){
    const size = 20 + Math.random()*30;
    const speed = 2 + Math.random()*3;
    asteroids.push({x:Math.random()*(width-size), y:-size, w:size, h:size, speed});
  }

  function update(dt){
    if(gameOver) return;
    // move ship
    if(keys.left) ship.x = Math.max(0, ship.x - ship.speed);
    if(keys.right) ship.x = Math.min(width-ship.w, ship.x + ship.speed);
    // move stars (parallax background)
    for(let s of stars){
      s.y += 0.5; // slow downward drift
      if(s.y > height){ s.y = 0; s.x = Math.random()*width; }
    }
    // spawn asteroids
    if(Date.now()-lastSpawn>asteroidSpawnInterval){spawnAsteroid(); lastSpawn=Date.now();}
    // move asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.y += a.speed;
      // remove off‑screen
      if(a.y>height){asteroids.splice(i,1); score++; scoreSound();}
      // collision
      if(a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
        gameOver=true; collisionSound(); break;
      }
    }
  }

  function render(){
    // space background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,height);
    bgGrad.addColorStop(0,'#000020');
    bgGrad.addColorStop(1,'#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // stars (draw before ship/asteroids)
    ctx.fillStyle='white';
    stars.forEach(s=>{ ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill(); });
    // ship (triangle)
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x+a.w/2, a.y+a.h/2, a.w*0.2, a.x+a.w/2, a.y+a.h/2, a.w/2);
      grad.addColorStop(0, '#777777');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x+a.w/2, a.y+a.h/2, a.w/2, 0, Math.PI*2);
      ctx.fill();
    });
    // score
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    // game over overlay
    if(gameOver){
      ctx.fillStyle='rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle='white';
      ctx.textAlign='center';
      ctx.font='32px sans-serif';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }
  }

  let lastTime=0;
  function loop(ts){
    const dt=ts-lastTime; lastTime=ts;
    update(dt);
    render();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
