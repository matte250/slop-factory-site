// Simple endless runner / space shooter based on IDEA.md
// Canvas must exist with id="game"
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio(){
    if(audioCtx.state !== 'running') audioCtx.resume();
    audioInitialized = true;
  }
  function playTone(freq,dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playThrust(){
    playTone(300,0.05);
  }
  function playExplosion(){
    playTone(80,0.4);
  }
  // Generate static star field
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({
      x: Math.random()*width,
      y: Math.random()*height
    });
  }

  // Ship definition
  const ship = {
    x: width/2,
    y: height-60,
    w: 30,
    h: 30,
    speed: 4,
    fuel: 100,
    shield: 0,
    color: '#0ff'
  };

  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frame = 0;

  function spawnAsteroid(){
    const size = Math.random()*30+20;
    const x = Math.random()*(width-size);
    const speed = Math.random()*2+1;
    asteroids.push({x, y:-size, size, speed});
  }

  function update(){
    // controls
    const moving = (keys.ArrowLeft||keys.a||keys.ArrowRight||keys.d||keys.ArrowUp||keys.w||keys.ArrowDown||keys.s);
    if(keys.ArrowLeft||keys.a) ship.x -= ship.speed;
    if(keys.ArrowRight||keys.d) ship.x += ship.speed;
    if(keys.ArrowUp||keys.w) ship.y -= ship.speed;
    if(keys.ArrowDown||keys.s) ship.y += ship.speed;
    // play thrust sound on movement
    if(moving){
      if(!audioInitialized) initAudio();
      playThrust();
    }
    // keep inside canvas
    ship.x = Math.max(0, Math.min(width-ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height-ship.h, ship.y));
    // fuel consumption
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    // spawn asteroids
    if(frame%asteroidSpawnRate===0) spawnAsteroid();
    // move asteroids
    for(let i=0;i<asteroids.length;i++){
      const a = asteroids[i];
      a.y += a.speed;
    }
    // remove off‑screen
    while(asteroids.length && asteroids[0].y>height) asteroids.shift();
    // collision detection
    for(const a of asteroids){
      if(ship.x < a.x + a.size && ship.x + ship.w > a.x &&
         ship.y < a.y + a.size && ship.y + ship.h > a.y){
        // hit – end game
        if(!audioInitialized) initAudio();
        playExplosion();
        cancelAnimationFrame(rid);
        alert('Game Over!');
        return;
      }
    }
    if(ship.fuel<=0){
      if(!audioInitialized) initAudio();
      playExplosion();
      cancelAnimationFrame(rid);
      alert('Out of fuel!');
      return;
    }
    frame++;
  }

function draw(){
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,height);
  bgGrad.addColorStop(0,"#001d3d");
  bgGrad.addColorStop(1,"#000814");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,width,height);
  // Star field
  for(const s of stars){
    ctx.fillStyle = '#fff';
    ctx.fillRect(s.x,s.y,1,1);
  }
  // Ship as triangle
  ctx.save();
  ctx.translate(ship.x+ship.w/2, ship.y+ship.h/2);
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(0,-ship.h/2);
  ctx.lineTo(ship.w/2,ship.h/2);
  ctx.lineTo(-ship.w/2,ship.h/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Asteroids with radial gradient
  for(const a of asteroids){
    const grad = ctx.createRadialGradient(a.x+a.size/2, a.y+a.size/2, a.size*0.2, a.x+a.size/2, a.y+a.size/2, a.size/2);
    grad.addColorStop(0,"#555");
    grad.addColorStop(1,"#111");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x+a.size/2, a.y+a.size/2, a.size/2,0,Math.PI*2);
    ctx.fill();
  }
  // HUD
  ctx.fillStyle = '#0ff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Fuel: '+ship.fuel.toFixed(0),10,20);
}

  function loop(){
    update();
    draw();
    rid = requestAnimationFrame(loop);
  }
  let rid = requestAnimationFrame(loop);
})();
