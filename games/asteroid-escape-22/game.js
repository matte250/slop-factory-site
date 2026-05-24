// Minimal Asteroid Escape game with enhanced graphics
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // generate starfield
  const starCount = Math.floor((canvas.width * canvas.height) / 5000);
  const stars = [];
  for(let i=0;i<starCount;i++){
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.5+0.5});
  }

  // Ship state
  const ship = {x: canvas.width/2, y: canvas.height/2, angle:0, vx:0, vy:0, radius:8};
  const thrust = 0.1, rotateSpeed = 0.07;

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  const asteroidSpeed = 2;

  let lastSpawn = 0, startTime = null, gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.code]=true; if(audioCtx.state==='suspended') audioCtx.resume(); if(e.code==='ArrowUp') playBeep(400,0.07); if(e.code==='ArrowLeft' || e.code==='ArrowRight') playBeep(200,0.05);});
  window.addEventListener('keyup',e=>keys[e.code]=false);

  function spawnAsteroid(){
    const side = Math.random()<0.5? 'top' : 'left';
    let x,y,dx,dy;
    if(side==='top'){
      x = Math.random()*canvas.width;
      y = -20;
      dx = (Math.random()*2-1)*asteroidSpeed;
      dy = asteroidSpeed;
    } else {
      x = -20;
      y = Math.random()*canvas.height;
      dx = asteroidSpeed;
      dy = (Math.random()*2-1)*asteroidSpeed;
    }
    const radius = 10+Math.random()*15;
    const angle = Math.random()*Math.PI*2;
    const rotSpeed = (Math.random()*0.02-0.01);
    asteroids.push({x,y,dx,dy,radius,angle,rotSpeed});
    // sound for new asteroid
    playBeep(150,0.04);
  }

  function update(dt){
    if(gameOver) return;
    // ship controls
    if(keys['ArrowLeft']) ship.angle -= rotateSpeed;
    if(keys['ArrowRight']) ship.angle += rotateSpeed;
    if(keys['ArrowUp']){
      ship.vx += Math.cos(ship.angle)*thrust;
      ship.vy += Math.sin(ship.angle)*thrust;
    }
    // move ship
    ship.x += ship.vx; ship.y += ship.vy;
    // wrap ship
    if(ship.x<0) ship.x+=canvas.width; else if(ship.x>canvas.width) ship.x-=canvas.width;
    if(ship.y<0) ship.y+=canvas.height; else if(ship.y>canvas.height) ship.y-=canvas.height;
    // update asteroids
    for(const a of asteroids){
      a.x += a.dx; a.y += a.dy;
      a.angle += a.rotSpeed;
    }
    // update stars (slow parallax opposite ship motion)
    for(const s of stars){
      s.x -= ship.vx*0.05; s.y -= ship.vy*0.05;
      // wrap stars
      if(s.x<0) s.x+=canvas.width; else if(s.x>canvas.width) s.x-=canvas.width;
      if(s.y<0) s.y+=canvas.height; else if(s.y>canvas.height) s.y-=canvas.height;
    }
    // remove off-screen asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      if(a.x<-50||a.x>canvas.width+50||a.y<-50||a.y>canvas.height+50) asteroids.splice(i,1);
    }
    // collision
    for(const a of asteroids){
      const dx = a.x - ship.x, dy = a.y - ship.y;
      const dist = Math.hypot(dx,dy);
      if(dist < a.radius + ship.radius){ gameOver=true; break; }
    }
    // spawn
    if(performance.now() - lastSpawn > asteroidSpawnInterval){ spawnAsteroid(); lastSpawn = performance.now(); }
  }

  function draw(){
    // background
    ctx.fillStyle='black';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stars
    ctx.fillStyle='white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
    }
    // ship (with glow)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship shape
    ctx.beginPath();
    ctx.moveTo(12,0);
    ctx.lineTo(-9,-7);
    ctx.lineTo(-9,7);
    ctx.closePath();
    ctx.fillStyle='cyan';
    ctx.fill();
    ctx.strokeStyle='white';
    ctx.lineWidth=0.5;
    ctx.stroke();
    ctx.restore();
    // asteroids (rough circles with shading)
    for(const a of asteroids){
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);
      ctx.fillStyle='dimgray';
      ctx.fill();
      ctx.strokeStyle='gray';
      ctx.stroke();
    }
    // score / game over
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    const elapsed = ((performance.now()-startTime)/1000).toFixed(1);
    ctx.fillText('Time: '+elapsed,10,20);
    if(gameOver){
      ctx.fillText('Game Over', canvas.width/2-40, canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame||timestamp);
    lastFrame = timestamp;
    update(dt);
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame=null;
  requestAnimationFrame(loop);
})();
