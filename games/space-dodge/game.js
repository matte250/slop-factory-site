// Simple Space Dodge game with improved graphics and sounds
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Starfield background
  const starCount = 100;
  const stars = [];
  for(let i=0;i<starCount;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, speed: 0.2 + Math.random()*0.5});
  }
  function updateStars(){
    for(const s of stars){
      s.y += s.speed;
      if(s.y > height){ s.y = 0; s.x = Math.random()*width; }
    }
  }
  function drawStars(){
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#555';
    for(const s of stars){
      ctx.fillRect(s.x, s.y, 2, 2);
    }
  }

  // Audio setup (Web Audio API)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playTone(freq, type='sine', duration=0.1){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision(){
    // low, sharp sound on collision
    playTone(120, 'sawtooth', 0.2);
  }

  // Ship (triangle)
  const ship = {x: width/2, y: height/2, r: 12, speed: 3};
  const keys = {};
  window.addEventListener('keydown',e=>{ keys[e.key]=true; playTone(400,'triangle',0.05); });
  window.addEventListener('keyup',e=>{ keys[e.key]=false; });

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  let score = 0;
  let gameOver = false;
  let lastTime = performance.now();

  function spawnAsteroid(){
    const side = Math.floor(Math.random()*4); //0 top,1 right,2 bottom,3 left
    let x,y,vx,vy;
    const speed = 1 + Math.random()*2;
    if(side===0){ x=Math.random()*width; y=0; vx= (Math.random()-0.5)*speed; vy= speed; }
    else if(side===1){ x=width; y=Math.random()*height; vx= -speed; vy= (Math.random()-0.5)*speed; }
    else if(side===2){ x=Math.random()*width; y=height; vx= (Math.random()-0.5)*speed; vy= -speed; }
    else { x=0; y=Math.random()*height; vx= speed; vy= (Math.random()-0.5)*speed; }
    asteroids.push({x,y,vx,vy,r:8+Math.random()*12});
  }

  function update(dt){
    // update starfield background
    updateStars();
    // ship movement
    if(keys['ArrowUp']||keys['w']) ship.y-=ship.speed;
    if(keys['ArrowDown']||keys['s']) ship.y+=ship.speed;
    if(keys['ArrowLeft']||keys['a']) ship.x-=ship.speed;
    if(keys['ArrowRight']||keys['d']) ship.x+=ship.speed;
    // keep within bounds
    if(ship.x<0||ship.x>width||ship.y<0||ship.y>height){ gameOver=true; }
    // asteroids
    for(let a of asteroids){
      a.x+=a.vx; a.y+=a.vy;
      // collision with ship
      const dx=a.x-ship.x, dy=a.y-ship.y;
      if(Math.hypot(dx,dy)<a.r+ship.r){ playCollision(); gameOver=true; }
    }
    // remove off‑screen asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      if(a.x< -50||a.x>width+50||a.y< -50||a.y>height+50) asteroids.splice(i,1);
    }
    // spawn
    if(performance.now()-lastSpawn>asteroidSpawnInterval){ spawnAsteroid(); lastSpawn=performance.now(); }
    if(!gameOver) score+=dt/1000;
  }

  function draw(){
    // draw background and stars
    drawStars();
    // ship (triangle)
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // asteroids (rocky look)
    ctx.fillStyle='lightgray';
    for(let a of asteroids){
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    }
    // score overlay
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='30px sans-serif';
      ctx.fillText('Game Over', width/2-80, height/2);
    }
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){ update(dt); }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
