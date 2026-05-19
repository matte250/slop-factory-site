// Simple Cosmic Courier game
// Targets a <canvas id="game"></canvas> element.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas, abort.
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // star field for background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  function drawBackground(){
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  // Ship with orientation
  const ship = {x: width/2, y: height/2, size: 20, speed: 4, angle: 0};
  const keys = {ArrowUp:false, ArrowDown:false, ArrowLeft:false, ArrowRight:false};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  document.addEventListener('keydown', e => {if (keys.hasOwnProperty(e.key)) keys[e.key]=true;});
  document.addEventListener('keyup', e => {if (keys.hasOwnProperty(e.key)) keys[e.key]=false;});

  // Asteroids and packages
  let asteroids = [];
  let packageObj = null;
  const asteroidSpawnInterval = 1500; // ms
  const packageSpawnInterval = 5000; // ms
  const timerMax = 30; // seconds per package
  let timer = timerMax;
  let lastAsteroid = 0, lastPackage = 0, lastTime = performance.now();
  let gameOver = false;

  function spawnAsteroid(){
    const size = 15 + Math.random()*25;
    const side = Math.floor(Math.random()*4);
    let x, y, vx, vy;
    // spawn from edges moving inward
    switch(side){
      case 0: // left
        x = -size; y = Math.random()*height; vx = 1+Math.random()*2; vy = (Math.random()-0.5)*2; break;
      case 1: // right
        x = width+size; y = Math.random()*height; vx = -(1+Math.random()*2); vy = (Math.random()-0.5)*2; break;
      case 2: // top
        x = Math.random()*width; y = -size; vx = (Math.random()-0.5)*2; vy = 1+Math.random()*2; break;
      case 3: // bottom
        x = Math.random()*width; y = height+size; vx = (Math.random()-0.5)*2; vy = -(1+Math.random()*2); break;
    }
    const rot = Math.random()*Math.PI*2;
    const rotSpeed = (Math.random()-0.5)*0.02;
    asteroids.push({x, y, vx, vy, size, rot, rotSpeed});
  }

  function spawnPackage(){
    const size = 12;
    const x = size + Math.random()*(width-2*size);
    const y = size + Math.random()*(height-2*size);
    packageObj = {x, y, size, collected:false};
    timer = timerMax;
  }

  function update(dt){
    // move ship and set orientation
    if (keys.ArrowUp) { ship.y -= ship.speed; ship.angle = -Math.PI/2; }
    if (keys.ArrowDown) { ship.y += ship.speed; ship.angle = Math.PI/2; }
    if (keys.ArrowLeft) { ship.x -= ship.speed; ship.angle = Math.PI; }
    if (keys.ArrowRight) { ship.x += ship.speed; ship.angle = 0; }
    // keep within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // asteroids (move and rotate)
    asteroids.forEach(a=>{a.x+=a.vx; a.y+=a.vy; a.rot = (a.rot||0) + (a.rotSpeed||0);});
    asteroids = asteroids.filter(a=>a.x>-a.size && a.x<width+a.size && a.y>-a.size && a.y<height+a.size);

    // collisions with asteroids
    for (const a of asteroids){
      const dx = a.x-ship.x, dy=a.y-ship.y;
      const dist = Math.hypot(dx, dy);
        if (dist < a.size + ship.size/2){ playBeep(200,300); gameOver=true; return; }
    }

    // package collection
    if (packageObj && !packageObj.collected){
      const dx = packageObj.x-ship.x, dy=packageObj.y-ship.y;
      if (Math.hypot(dx,dy) < packageObj.size + ship.size/2){
        packageObj.collected = true;
        playBeep(600,200); // collection sound
        // spawn next after short delay
        setTimeout(spawnPackage, 500);
      }
    }

    // timer countdown
    if (!gameOver && packageObj && !packageObj.collected){
      timer -= dt/1000;
      if (timer <= 0){ gameOver=true; }
    }
  }

  function draw(){
    // background (star field)
    drawBackground();
    // ship with orientation (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.size/2, 0);
    ctx.lineTo(-ship.size/2, ship.size/3);
    ctx.lineTo(-ship.size/2, -ship.size/3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids (rotating rocks)
    ctx.fillStyle = 'gray';
    for (const a of asteroids){
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot || 0);
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    // package (glowing)
    if (packageObj && !packageObj.collected){
      const grad = ctx.createRadialGradient(packageObj.x, packageObj.y, 0, packageObj.x, packageObj.y, packageObj.size);
      grad.addColorStop(0, 'yellow');
      grad.addColorStop(1, 'orange');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(packageObj.x, packageObj.y, packageObj.size, 0, Math.PI*2);
      ctx.fill();
    }
    // timer UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: '+timer.toFixed(1), 10, 20);
    if (gameOver){
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width/2-120, height/2);
    }
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver){
      if (timestamp - lastAsteroid > asteroidSpawnInterval) { spawnAsteroid(); lastAsteroid = timestamp; }
      if (!packageObj && timestamp - lastPackage > packageSpawnInterval){ spawnPackage(); lastPackage = timestamp; }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
