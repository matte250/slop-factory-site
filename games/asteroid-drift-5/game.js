// Asteroid Drift – minimal canvas game
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // starfield background
  const stars = Array.from({length: 100},()=>({
    x: Math.random()*W,
    y: Math.random()*H,
    r: Math.random()*1.5+0.5,
    opacity: Math.random()*0.5+0.5
  }));

  // ----- state -----
  const player = {x: W/2, y: H-50, r:12, speed:0, maxSpeed:4};
  let asteroids = [];
  let powerUps = [];
  let particles = [];
  let score = 0;
  let gameOver = false;
  let keys = {};

  // ----- utils -----
  function rand(min,max){return Math.random()*(max-min)+min;}
  function dist(ax,ay,bx,by){return Math.hypot(ax-bx, ay-by);}

  // ----- input -----
  // audio context (activate on first interaction)
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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  window.addEventListener('keydown',e=>{
    keys[e.key]=true;
    if(audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // ----- game objects -----
  function spawnAsteroid(){
    const size = rand(10,30);
    asteroids.push({
      x:rand(size,W-size),
      y:-size,
      r:size,
      vx:0,
      vy:rand(1,3),
      angle:rand(0,Math.PI*2),
      angularVel:rand(-0.02,0.02)
    });
  }
  function spawnPower(){
    const r = 8;
    powerUps.push({x:rand(r,W-r), y:-r, r, vy:2});
  }

  // spawn intervals
  let asteroidTimer = 0, powerTimer = 0;

  // ----- main loop -----
  function update(dt){
    if(gameOver) return;
    // player movement
    if(keys['ArrowLeft']) player.speed = -player.maxSpeed;
    else if(keys['ArrowRight']) player.speed = player.maxSpeed;
    else player.speed = 0;
    player.x += player.speed;
    player.x = Math.max(player.r, Math.min(W-player.r, player.x));

    // spawn logic
    asteroidTimer -= dt; powerTimer -= dt;
    if(asteroidTimer <= 0){ spawnAsteroid(); asteroidTimer = 800; }
    if(powerTimer <= 0){ spawnPower(); powerTimer = 3000; }

    // update asteroids
    asteroids.forEach(a=> {
      a.y += a.vy;
      a.angle += a.angularVel;
    });
    asteroids = asteroids.filter(a=> a.y - a.r < H);
    // update power‑ups
    powerUps.forEach(p=> p.y += p.vy);
    powerUps = powerUps.filter(p=> p.y - p.r < H);

    // update stars (twinkling motion)
    stars.forEach(s=> {
      s.y += 0.2; // slow drift
      if(s.y > H){ s.y = 0; s.x = Math.random()*W; }
    });

    // update particles
    particles.forEach(p=> {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      p.alpha = Math.max(0, p.life/600);
    });
    particles = particles.filter(p=> p.life > 0);

    // collisions
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      if(dist(a.x,a.y,player.x,player.y) < a.r+player.r){
        // explosion sound
        playTone(220, 300);
        gameOver=true;
        // create explosion particles
        for(let j=0;j<20;j++){
          particles.push({
            x: a.x,
            y: a.y,
            vx: (Math.random()-0.5)*2,
            vy: (Math.random()-0.5)*2,
            r: Math.random()*2+1,
            life: 600,
            alpha: 1
          });
        }
        break;
      }
    }
    for(let i=powerUps.length-1;i>=0;i--){
      const p = powerUps[i];
      if(dist(p.x,p.y,player.x,player.y) < p.r+player.r){
          score++; powerUps.splice(i,1);
          playTone(660, 120); // power-up sound
        }
    }
  }

  function draw(){
    ctx.clearRect(0,0,W,H);
    // starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    stars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    });
    // player ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y - player.r);
    ctx.lineTo(player.x - player.r, player.y + player.r);
    ctx.lineTo(player.x + player.r, player.y + player.r);
    ctx.closePath();
    ctx.fill();
    // asteroids with rotation
    asteroids.forEach(a=>{
      ctx.save();
      ctx.translate(a.x,a.y);
      ctx.rotate(a.angle);
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(0,0,a.r,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    });
    // power‑ups with glow
    powerUps.forEach(p=>{
      const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      grad.addColorStop(0,'#ff0');
      grad.addColorStop(1,'#880');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });
    // particles
    particles.forEach(p=>{
      ctx.fillStyle = `rgba(255,165,0,${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+score,10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  let last = performance.now();
  function loop(now){
    const dt = now - last; last = now;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
