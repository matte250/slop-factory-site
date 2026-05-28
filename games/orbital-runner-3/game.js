// Simple Orbital Runner game
// Canvas with id="game" must exist in the HTML.
(function(){
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
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

  // Game state
  const ship = { x: width/2, y: height/2, size: 10, speed: 2, vx:0, vy:0, fuel: 100 };
  const asteroids = [];
  const fuelCells = [];
  const asteroidCount = 8;
  const fuelCellCount = 3;

  // Initialize asteroids with random positions and velocities
  for(let i=0;i<asteroidCount;i++){
    asteroids.push({
      x: Math.random()*width,
      y: Math.random()*height,
      r: 15+Math.random()*10,
      vx: (Math.random()-0.5)*1.5,
      vy: (Math.random()-0.5)*1.5
    });
  }
  // Initialize background stars for parallax effect
  const stars = [];
  const starCount = 80;
  for(let i=0;i<starCount;i++){
    stars.push({
      x: Math.random()*width,
      y: Math.random()*height,
      radius: Math.random()*1.5+0.5
    });
  }
  // Initialize fuel cells
  for(let i=0;i<fuelCellCount;i++){
    fuelCells.push({
      x: Math.random()*width,
      y: Math.random()*height,
      r: 8,
      collected: false
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function update(){
    // Ship thrust with sound
    if(keys['ArrowUp']||keys['w']){ ship.vy -= ship.speed*0.1; playTone(300,0.05); }
    if(keys['ArrowDown']||keys['s']){ ship.vy += ship.speed*0.1; playTone(300,0.05); }
    if(keys['ArrowLeft']||keys['a']){ ship.vx -= ship.speed*0.1; playTone(300,0.05); }
    if(keys['ArrowRight']||keys['d']){ ship.vx += ship.speed*0.1; playTone(300,0.05); }
    // Apply velocity
    ship.x += ship.vx; ship.y += ship.vy;
    // Dampen motion
    ship.vx *= 0.99; ship.vy *= 0.99;
    // Keep inside bounds (wrap)
    if(ship.x<0) ship.x+=width; if(ship.x>width) ship.x-=width;
    if(ship.y<0) ship.y+=height; if(ship.y>height) ship.y-=height;
    // Fuel consumption
    ship.fuel -= 0.05;
    // Update asteroids
    asteroids.forEach(a=>{a.x+=a.vx; a.y+=a.vy; if(a.x<0)a.x+=width; if(a.x>width)a.x-=width; if(a.y<0)a.y+=height; if(a.y>height)a.y-=height;});
    // Check collisions with asteroids
    for(const a of asteroids){
        const dx=ship.x-a.x, dy=ship.y-a.y;
        if(Math.hypot(dx,dy)<a.r+ship.size){ playTone(100,0.3); gameOver(); return; }
    }
    // Check fuel cells
    for(const f of fuelCells){
      if(f.collected) continue;
      const dx=ship.x-f.x, dy=ship.y-f.y;
        if(Math.hypot(dx,dy)<f.r+ship.size){ ship.fuel+=30; f.collected=true; playTone(600,0.1); }
    }
    // Lose if out of fuel
    if(ship.fuel<=0){ gameOver(); return; }
  }

function draw(){
    // Space background
    ctx.fillStyle = '#02010a';
    ctx.fillRect(0,0,width,height);
    // Stars (parallax)
    ctx.fillStyle = 'white';
    stars.forEach(s=>{
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
      ctx.fill();
    });
    // Ship – draw as rotated triangle pointing in movement direction
    const shipAngle = Math.atan2(ship.vy, ship.vx) || 0;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size/2);
    ctx.lineTo(-ship.size, -ship.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with gradient shading
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Fuel cells with glowing effect
    fuelCells.forEach(f=>{
      if(f.collected) return;
      const grad = ctx.createRadialGradient(f.x, f.y, f.r*0.3, f.x, f.y, f.r);
      grad.addColorStop(0, '#ffea00');
      grad.addColorStop(1, '#b8860b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle='white';
    ctx.font='14px sans-serif';
    ctx.fillText('Fuel: '+Math.floor(ship.fuel),10,20);
  }

  let rafId;
  function loop(){
    update();
    draw();
    rafId=requestAnimationFrame(loop);
  }

  function gameOver(){
    cancelAnimationFrame(rafId);
    ctx.fillStyle='red';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over', width/2, height/2);
  }

  // Start game
  loop();
})();
