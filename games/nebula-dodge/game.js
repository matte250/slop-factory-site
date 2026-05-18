// Nebula Dodge – minimal canvas game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;

  // ship
  const ship = {x:50, y:h/2, w:20, h:10, vy:0, speed:3};

  // asteroids
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1000; // ms
  let speedFactor = 1;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // input
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);
  canvas.addEventListener('mousemove',e=>{ const rect=canvas.getBoundingClientRect(); ship.y = e.clientY-rect.top; });

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision(){
    // low rumble
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.7);
  }

  function spawnAsteroid(){
    const size = 15+Math.random()*15;
    asteroids.push({x:w+size, y:Math.random()*h, r:size, speed:2+speedFactor});
  }

  function update(dt){
    if(gameOver) return;
    // ship control
    if(keys['ArrowUp']||keys['w']){
      ship.vy = -ship.speed;
      playTone(500,0.04);
    }
    else if(keys['ArrowDown']||keys['s']){
      ship.vy = ship.speed;
      playTone(250,0.04);
    }
    else ship.vy = 0;
    ship.y += ship.vy;
    ship.y = Math.max(0, Math.min(h-ship.h, ship.y));

    // asteroids
    asteroidTimer += dt;
    if(asteroidTimer>asteroidInterval){
      spawnAsteroid();
      asteroidTimer=0;
    }
    asteroids.forEach(a=>{ a.x -= a.speed*dt/16; });
    // remove off‑screen
    while(asteroids.length && asteroids[0].x + asteroids[0].r < 0) asteroids.shift();

    // collision
    for(const a of asteroids){
      const dx = (ship.x+ship.w/2) - a.x;
      const dy = (ship.y+ship.h/2) - a.y;
      const dist = Math.hypot(dx,dy);
      if(dist < a.r + Math.max(ship.w,ship.h)/2){
        gameOver=true;
        playCollision();
        break;
      }
    }

    // increase difficulty
    speedFactor += dt*0.00001;
    asteroidInterval = Math.max(200, 1000 - speedFactor*200);
    score += dt*0.01;
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,0,h);
    bgGrad.addColorStop(0,'#001020');
    bgGrad.addColorStop(1,'#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,w,h);
    // stars background (twinkling)
    for(let i=0;i<50;i++){
      const sx = Math.random()*w;
      const sy = Math.random()*h;
      const alpha = 0.2 + Math.random()*0.5;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
    // ship (triangle with glow)
    ctx.save();
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x+ship.w, ship.y+ship.h);
    shipGrad.addColorStop(0,'#00ffff');
    shipGrad.addColorStop(1,'#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial shading
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0,'#bbbbbb');
      grad.addColorStop(1,'#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r,0,Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    if(gameOver){ ctx.fillText('Game Over', w/2-40, h/2); }
  }

  function loop(timestamp){
    const dt = timestamp - lastTime; lastTime = timestamp;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
