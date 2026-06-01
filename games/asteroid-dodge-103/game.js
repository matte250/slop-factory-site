// Simple Asteroid Dodge game
// Assumes an HTML <canvas id="game"></canvas>
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // set full‑window size
  // Audio setup
  const AudioContext = window.AudioContext||window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustOsc = null;
  function startThrustSound(){
    if(thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = osc;
  }
  function stopThrustSound(){
    if(!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime+0.4);
  }
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Starfield
  const stars=[];
  const starCount=120;
  for(let i=0;i<starCount;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      speed: Math.random()*0.3+0.1
    });
  }

  // Ship state
  const ship = {x: canvas.width/2, y: canvas.height*0.8, radius:12, angle:0, vx:0, vy:0};
  const thrustPower = 0.1;
  const turnSpeed = 0.07;
  const keys = {};
  window.addEventListener('keydown',e=>{keys[e.code]=true; if(e.code==='ArrowUp'){startThrustSound(); audioCtx.resume();}});
  window.addEventListener('keyup',e=>{keys[e.code]=false; if(e.code==='ArrowUp'){stopThrustSound();}});

  // Asteroids
  const asteroids=[];
  const asteroidSpawnInterval=1500; // ms
  let lastSpawn=0;
  function spawnAsteroid(){
    const size = Math.random()*30+15;
    const x = Math.random()*canvas.width;
    const y = -size;
    const speed = Math.random()*1.5+0.5;
    asteroids.push({x,y,size,speed});
  }

  // Collision detection
  function circleCollide(a,b){
    const dx=a.x-b.x, dy=a.y-b.y;
    const dist=Math.hypot(dx,dy);
    return dist < a.radius + b.size;
  }

  let score=0;
  let gameOver=false;
  let lastTime=0;

  function update(dt){
    // move stars
    stars.forEach(s=>{
      s.y += s.speed * dt * 0.05; // speed scaled by dt
      if(s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random()*canvas.width;
      }
    });
    // ship controls
    if(keys['ArrowLeft']) ship.angle -= turnSpeed;
    if(keys['ArrowRight']) ship.angle += turnSpeed;
    if(keys['ArrowUp']){
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
    }
    // apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // simple friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    // wrap around edges horizontally
    if(ship.x < 0) ship.x += canvas.width;
    if(ship.x > canvas.width) ship.x -= canvas.width;
    // keep ship within vertical bounds (top bounce)
    if(ship.y < 0) ship.y = 0;
    if(ship.y > canvas.height) ship.y = canvas.height;

    // asteroids movement and spawn
    lastSpawn += dt;
    if(lastSpawn > asteroidSpawnInterval){
      spawnAsteroid();
      lastSpawn = 0;
    }
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.y += a.speed;
      if(a.y - a.size > canvas.height){
        asteroids.splice(i,1);
        score++;
        } else if(circleCollide(ship,a)){
          gameOver=true;
          playExplosionSound();
        }

    }
  }

  function draw(){
    // background gradient
    const grd = ctx.createLinearGradient(0,0,0,canvas.height);
    grd.addColorStop(0,'#000020');
    grd.addColorStop(1,'#000000');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // starfield
    stars.forEach(s=>{
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 2, 2);
    });
    // ship with stroke
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,10);
    ctx.lineTo(-10,-10);
    ctx.closePath();
    ctx.fillStyle='cyan';
    ctx.strokeStyle='white';
    ctx.lineWidth=2;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.size*0.2, a.x, a.y, a.size);
      grad.addColorStop(0,'#888');
      grad.addColorStop(1,'#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.size,0,Math.PI*2);
      ctx.fill();
    });
    // score text
    ctx.fillStyle='white';
    ctx.font='20px sans-serif';
    ctx.fillText('Score: '+score,10,30);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='40px sans-serif';
      ctx.fillText('Game Over', canvas.width/2-100, canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!lastTime) lastTime=timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
