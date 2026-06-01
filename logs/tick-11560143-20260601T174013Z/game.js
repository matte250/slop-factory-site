// Game based on IDEA.md – Space Drift
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  // Simple sound engine using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio starts after first user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, {once: true});
  function playSound(freq, duration, type='sine', volume=0.1){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    setTimeout(()=>{ osc.stop(); }, duration);
  }
  // Convenience wrappers
  function beep(freq, duration){ playSound(freq, duration, 'sine', 0.1); }
  function explosion(){ playSound(150, 400, 'triangle', 0.2); }
  function spawnAsteroidSound(){ playSound(300, 80, 'square', 0.05); }
  function fuelLow(){ playSound(100, 200, 'sawtooth', 0.08); }
  // full‑window canvas
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Input handling
  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // Ship definition
  const ship = {
    x: canvas.width/2,
    y: canvas.height/2,
    angle: 0,
    radius: 10,
    speed: 0,
    maxSpeed: 4,
    thrust: 0.1,
    drag: 0.02
  };

  // Stars background with twinkle
  const stars = [];
  for(let i=0;i<100;i++) stars.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    size: Math.random()*2+1,
    alpha: Math.random()*0.5+0.5
  });

  // Asteroids
  const asteroids = [];
  function spawnAsteroid(){
    const edge = Math.floor(Math.random()*4);
    let x,y,vx,vy;
    const radius = Math.random()*15+10;
    const speed = Math.random()*1.5+0.5;
    if(edge===0){ x=0; y=Math.random()*canvas.height; vx=speed; vy=(Math.random()-0.5)*speed; }
    else if(edge===1){ x=canvas.width; y=Math.random()*canvas.height; vx=-speed; vy=(Math.random()-0.5)*speed; }
    else if(edge===2){ x=Math.random()*canvas.width; y=0; vx=(Math.random()-0.5)*speed; vy=speed; }
    else { x=Math.random()*canvas.width; y=canvas.height; vx=(Math.random()-0.5)*speed; vy=-speed; }
    asteroids.push({x,y,vx,vy,radius});
    spawnAsteroidSound(); // audio cue
  }
  // initial asteroids
  for(let i=0;i=0;i<5;i++) spawnAsteroid();

  let score=0;
  let fuel=100; // percent
  let lastTime=0;
  const fuelDrainRate=0.02; // per ms

  function update(dt){
    // twinkle stars
    stars.forEach(s=>{
      s.alpha += (Math.random()-0.5)*0.05;
      if(s.alpha<0.3) s.alpha=0.3;
      if(s.alpha>1) s.alpha=1;
    });
    // input
    if(keys['ArrowUp']||keys['w']){
      ship.speed = Math.min(ship.maxSpeed, ship.speed + ship.thrust);
      beep(600, 80); // thrust sound
    }
    if(keys['ArrowDown']||keys['s']) ship.speed = Math.max(0, ship.speed - ship.thrust);
    if(keys['ArrowLeft']||keys['a']) ship.angle -= 0.05;
    if(keys['ArrowRight']||keys['d']) ship.angle += 0.05;

    // apply drag
    ship.speed *= 1-ship.drag;
    // move ship
    ship.x += Math.cos(ship.angle)*ship.speed;
    ship.y += Math.sin(ship.angle)*ship.speed;
    // wrap around edges
    if(ship.x<0) ship.x+=canvas.width; if(ship.x>canvas.width) ship.x-=canvas.width;
    if(ship.y<0) ship.y+=canvas.height; if(ship.y>canvas.height) ship.y-=canvas.height;

    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      a.x+=a.vx; a.y+=a.vy;
      // wrap
      if(a.x<0) a.x+=canvas.width; if(a.x>canvas.width) a.x-=canvas.width;
      if(a.y<0) a.y+=canvas.height; if(a.y>canvas.height) a.y-=canvas.height;
      // collision with ship
      const dx=a.x-ship.x, dy=a.y-ship.y;
      const dist=Math.hypot(dx,dy);
      if(dist<a.radius+ship.radius){
        // collision - explosion sound then game over
        explosion();
        alert('Game Over! Score: '+Math.floor(score));
        document.location.reload();
        return;
      }
    }
    // spawn new asteroids over time
    if(Math.random()<dt*0.001) spawnAsteroid();

    // fuel consumption
    fuel -= dt*fuelDrainRate;
    if(fuel<=0){ alert('Out of fuel! Score: '+Math.floor(score)); document.location.reload(); return; }
    // low fuel warning sound (once per low threshold)
    if(fuel<20 && !window._lowFuelWarned){
      fuelLow();
      window._lowFuelWarned = true;
    }
    if(fuel>=20){ window._lowFuelWarned = false; }

    score += dt*0.01; // increase score over time
  }

  function draw(){
    // background gradient (deep space)
    const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
    bgGrad.addColorStop(0,'#0b001e');
    bgGrad.addColorStop(1,'#001');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    // stars with twinkle effect
    stars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x,s.y,s.size,s.size);
    });
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(15,0);
    ctx.lineTo(-10,10);
    ctx.lineTo(-10,-10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with radial gradient
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle='white';
    ctx.font='16px sans-serif';
    ctx.fillText('Score: '+Math.floor(score),10,20);
    ctx.fillText('Fuel: '+Math.floor(fuel)+'%',10,40);
  }

  function loop(timestamp){
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
