// Simple Space Debris Dodger game
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
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

  // Ship
  const ship = {x: width/2, y: height/2, size:10, speed:3};
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // Debris (asteroids)
  const debris = [];
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  // Starfield background
  const stars = [];
  for(let i=0;i<100;i++) stars.push({x:Math.random()*width, y:Math.random()*height, r:Math.random()*2+1, s:Math.random()*0.5+0.2});

  let score = 0;
  let gameOver = false;

  function update(dt){
    if(gameOver) return;
    // move ship
    if(keys['ArrowUp']) ship.y -= ship.speed;
    if(keys['ArrowDown']) ship.y += ship.speed;
    if(keys['ArrowLeft']) ship.x -= ship.speed;
    if(keys['ArrowRight']) ship.x += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));
    // spawn debris
    if(Date.now() - lastSpawn > spawnInterval){
      const side = Math.floor(Math.random()*4);
      let x,y,vx,vy;
      const speed = Math.random()*2+1;
      switch(side){
        case 0: // top
          x = Math.random()*width; y = -20; vx = (Math.random()-0.5)*2; vy = speed; break;
        case 1: // right
          x = width+20; y = Math.random()*height; vx = -speed; vy = (Math.random()-0.5)*2; break;
        case 2: // bottom
          x = Math.random()*width; y = height+20; vx = (Math.random()-0.5)*2; vy = -speed; break;
        case 3: // left
          x = -20; y = Math.random()*height; vx = speed; vy = (Math.random()-0.5)*2; break;
      }
      debris.push({x,y,vx,vy,size:15+Math.random()*10});
      playTone(300,0.08); // spawn sound
      lastSpawn = Date.now();
    }
    // move debris
    for(let i=debris.length-1;i>=0;i--){
      const d = debris[i];
      d.x+=d.vx; d.y+=d.vy;
      // remove off-screen
      if(d.x<-30||d.x>width+30||d.y<-30||d.y>height+30) debris.splice(i,1);
      // collision
      const dx = d.x-ship.x, dy = d.y-ship.y;
      if(Math.hypot(dx,dy) < d.size/2 + ship.size){
        playTone(100,0.3); // collision sound
        gameOver = true;
      }
    }
    score += dt/1000;
  }

  function draw(){
    // background gradient
    const bgGrad = ctx.createLinearGradient(0,0,width,height);
    bgGrad.addColorStop(0,'#000020');
    bgGrad.addColorStop(1,'#000030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,width,height);
    // stars (twinkling)
    stars.forEach(s=>{
      s.y+=s.s;
      if(s.y>height){s.y=0; s.x=Math.random()*width;}
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,2*Math.PI);
      ctx.fillStyle = `rgba(255,255,255,${0.5+Math.random()*0.5})`;
      ctx.fill();
    });
    // ship (gradient triangle with border)
    const shipGrad = ctx.createLinearGradient(ship.x-ship.size, ship.y-ship.size, ship.x+ship.size, ship.y+ship.size);
    shipGrad.addColorStop(0, '#00ff80');
    shipGrad.addColorStop(1, '#006640');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y-ship.size);
    ctx.lineTo(ship.x-ship.size, ship.y+ship.size);
    ctx.lineTo(ship.x+ship.size, ship.y+ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#003020';
    ctx.lineWidth = 2;
    ctx.stroke();
    // debris (gradient circles with glow)
    debris.forEach(d=>{
      const grad = ctx.createRadialGradient(d.x, d.y, d.size*0.1, d.x, d.y, d.size/2);
      grad.addColorStop(0, '#ff7040');
      grad.addColorStop(1, '#800000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x,d.y,d.size/2,0,2*Math.PI);
      ctx.fill();
      // glow effect
      ctx.shadowColor = 'rgba(255,112,64,0.7)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width/2, height/2);
    }
  }

  let lastTime = performance.now();
  function loop(){
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
