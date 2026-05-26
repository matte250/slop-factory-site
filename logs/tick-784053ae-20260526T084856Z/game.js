// Minimal Cosmic Dodge game
// Canvas with id="game" must exist in the page.
(function(){
  const canvas=document.getElementById('game');
  const ctx=canvas.getContext('2d');
  const width=canvas.width=canvas.clientWidth||800;
  const height=canvas.height=canvas.clientHeight||600;

  // ship state
  const ship={x:width/2,y:height/2,angle:0,dx:0,dy:0,radius:10};
  const thrust=0.1, friction=0.99, turnSpeed=0.07;

  // asteroids
  const asteroids=[];
  const asteroidSize=30;
  function spawnAsteroid(){
    const edge=Math.random()*4|0; // 0 top,1 right,2 bottom,3 left
    let x,y,vx,vy;
    if(edge===0){x=Math.random()*width; y=-asteroidSize; vx=(Math.random()-0.5)*2; vy=Math.random()*2+1;}
    else if(edge===1){x=width+asteroidSize; y=Math.random()*height; vx=- (Math.random()*2+1); vy=(Math.random()-0.5)*2;}
    else if(edge===2){x=Math.random()*width; y=height+asteroidSize; vx=(Math.random()-0.5)*2; vy=-(Math.random()*2+1);}
    else {x=-asteroidSize; y=Math.random()*height; vx=Math.random()*2+1; vy=(Math.random()-0.5)*2;}
    // play a short ping when asteroid appears
    if (typeof playBeep === 'function') playBeep(300,0.05);
    asteroids.push({x,y,vx,vy,radius:asteroidSize*Math.random()*0.5+0.5});
  }

  // input handling
  const keys={};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  window.addEventListener('keydown',e=>{
    keys[e.code]=true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // thrust sound
    if (e.code==='ArrowUp' || e.code==='KeyW') {
      playBeep(440, 0.08);
    }
  });
  window.addEventListener('keyup',e=>keys[e.code]=false);

  function update(){
    // ship rotation
    if(keys['ArrowLeft']||keys['KeyA']) ship.angle-=turnSpeed;
    if(keys['ArrowRight']||keys['KeyD']) ship.angle+=turnSpeed;
    // thrust forward
    if(keys['ArrowUp']||keys['KeyW']){ship.dx+=Math.cos(ship.angle)*thrust; ship.dy+=Math.sin(ship.angle)*thrust;}
    // apply friction
    ship.dx*=friction; ship.dy*=friction;
    ship.x+=ship.dx; ship.y+=ship.dy;
    // wrap ship
    if(ship.x<0) ship.x+=width; if(ship.x>width) ship.x-=width;
    if(ship.y<0) ship.y+=height; if(ship.y>height) ship.y-=height;
    // asteroids movement
    asteroids.forEach(a=>{a.x+=a.vx; a.y+=a.vy; if(a.x< -asteroidSize) a.x=width+asteroidSize; if(a.x>width+asteroidSize) a.x=-asteroidSize; if(a.y< -asteroidSize) a.y=height+asteroidSize; if(a.y>height+asteroidSize) a.y=-asteroidSize;});
    // collision detection
    for(const a of asteroids){
      const dx=ship.x-a.x, dy=ship.y-a.y;
      if(Math.hypot(dx,dy)<ship.radius+a.radius){
        // Game over – stop animation
        playBeep(200,0.3);
        cancelAnimationFrame(anim);
        ctx.fillStyle='red';
        ctx.font='48px sans-serif';
        ctx.fillText('Game Over', width/2-120, height/2);
        return;
      }
    }
  }

  function draw(){
    ctx.clearRect(0,0,width,height);
    // draw background stars
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // draw ship with thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-8, -8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    // thrust flame when accelerating
    if (keys['ArrowUp'] || keys['KeyW']) {
      ctx.beginPath();
      ctx.moveTo(-8, 5);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, -5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // draw asteroids
    ctx.fillStyle='gray';
    asteroids.forEach(a=>{ctx.beginPath();ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);ctx.fill();});
  }

  function loop(){
    update();
    draw();
    anim=requestAnimationFrame(loop);
  }

  // start spawning asteroids
  setInterval(spawnAsteroid,1000);
  let anim=requestAnimationFrame(loop);
})();
