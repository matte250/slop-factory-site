// Asteroid Dodge Game
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
// Starfield background
const stars = [];
for(let i = 0; i < 200; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5
  });
}

  // Ship definition
  const ship = {
    x: canvas.width/2,
    y: canvas.height - 60,
    width: 30,
    height: 40,
    speed: 5,
    color: '#0f0'
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidConfig = {
    minRadius: 15,
    maxRadius: 30,
    speed: 2,
    spawnInterval: 1500 // ms
  };

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrust(){
    if (!thrustOsc){
      audioCtx.resume();
      thrustOsc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      thrustOsc.frequency.value = 200;
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      thrustOsc.connect(gain).connect(audioCtx.destination);
      thrustOsc.start();
    }
  }
  function stopThrust(){
    if (thrustOsc){
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playExplosion(){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  let lastSpawn = 0;
  let lastTime = 0;
  let gameOver = false;

  // Input handling
  const keys = { ArrowLeft:false, ArrowRight:false };
  window.addEventListener('keydown', e=>{ if(e.key in keys) keys[e.key]=true; });
  window.addEventListener('keyup', e=>{ if(e.key in keys) keys[e.key]=false; });

  function spawnAsteroid(){
    const radius = Math.random()*(asteroidConfig.maxRadius-asteroidConfig.minRadius)+asteroidConfig.minRadius;
    const x = Math.random()*(canvas.width-2*radius)+radius;
    asteroids.push({x, y:-radius, radius, speed: asteroidConfig.speed + Math.random()*1.5});
  }

  function update(dt){
  // Move stars for subtle parallax
  const starSpeed = 0.02 * dt; // pixels per ms
  for(const s of stars){
    s.y += starSpeed;
    if(s.y > canvas.height) {
      s.y = 0;
      s.x = Math.random() * canvas.width;
    }
  }
    // Move ship
    if(keys.ArrowLeft) ship.x -= ship.speed;
    if(keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(ship.width/2, Math.min(canvas.width-ship.width/2, ship.x));
    // Thrust sound control
    if(keys.ArrowLeft || keys.ArrowRight){
      startThrust();
    } else {
      stopThrust();
    }

    // Update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.y += a.speed;
      if(a.y - a.radius > canvas.height) asteroids.splice(i,1);
    }

    // Collision detection
    for(const a of asteroids){
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const distance = Math.hypot(dx, dy);
      // Approximate ship as circle with radius = half width
      const shipRadius = ship.width/2;
        if(distance < a.radius + shipRadius){
          gameOver = true;
          // Stop thrust and play explosion sound
          stopThrust();
          playExplosion();
          break;
        }
    }
  }

  function draw(){
    ctx.fillStyle = '#000010';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw starfield
  ctx.fillStyle = '#fff';
  for(const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
    ctx.fill();
  }
    // Draw ship (triangle) with gradient
    const shipGrad = ctx.createLinearGradient(0, ship.y - ship.height/2, 0, ship.y + ship.height/2);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#003300');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.height/2);
    ctx.lineTo(ship.x - ship.width/2, ship.y + ship.height/2);
    ctx.lineTo(ship.x + ship.width/2, ship.y + ship.height/2);
    ctx.closePath();
    ctx.fill();
    // Thruster flame when moving
    if(keys.ArrowLeft || keys.ArrowRight){
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.height/2);
      ctx.lineTo(ship.x - 5, ship.y + ship.height/2 + 15);
      ctx.lineTo(ship.x + 5, ship.y + ship.height/2 + 15);
      ctx.closePath();
      ctx.fill();
    }
    // Draw asteroids with gradient shading
    for(const a of asteroids){
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
      ctx.fill();
    }
    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    }
  }

  function loop(timestamp){
    if(!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if(!gameOver){
      if(timestamp - lastSpawn > asteroidConfig.spawnInterval){
        spawnAsteroid();
        lastSpawn = timestamp;
      }
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
