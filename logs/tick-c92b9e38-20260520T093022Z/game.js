// Simple Space Salvage game – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound(){
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 100;
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound(){
    if (thrustOsc){
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playBeep(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ---- Game objects ----
  const ship = {x: W/2, y: H/2, r: 12, speed: 0, angle: 0, fuel: 100};
  const cargos = [];
  const asteroids = [];
  const keys = {};
  const maxCargos = 5, maxAsteroids = 3;
  const stars = [];
  for(let i=0;i<100;i++) stars.push({x: rand(0,W), y: rand(0,H), size: rand(0.5,2)});

  const rand = (min, max) => Math.random() * (max - min) + min;

  function spawnCargo(){
    cargos.push({x: rand(0,W), y: rand(0,H), r:8, collected:false});
  }
  function spawnAsteroid(){
    const a = {x: rand(0,W), y: rand(0,H), r:20, vx: rand(-1,1), vy: rand(-1,1)};
    asteroids.push(a);
  }
  for(let i=0;i<maxCargos;i++) spawnCargo();
  for(let i=0;i<maxAsteroids;i++) spawnAsteroid();

  // ---- Input ----
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // ---- Game loop ----
  const trail = [];
  function update(){
    // record ship trail
    trail.push({x: ship.x, y: ship.y, age: 0});
    if(trail.length>30) trail.shift();
    // increment ages
    trail.forEach(p=>p.age++);
    // ship movement
    const thrust = 0.2;
    if(keys.ArrowUp){ ship.speed += thrust; ship.fuel -= 0.05; startThrustSound(); }
    else if(keys.ArrowDown){ ship.speed -= thrust; ship.fuel -= 0.02; }
    else { stopThrustSound(); }
    if(keys.ArrowLeft) ship.angle -= 0.05;
    if(keys.ArrowRight) ship.angle += 0.05;
    // constrain speed
    ship.speed = Math.max(Math.min(ship.speed, 4), -2);
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // wrap around edges
    if(ship.x<0) ship.x+=W; if(ship.x>W) ship.x-=W;
    if(ship.y<0) ship.y+=H; if(ship.y>H) ship.y-=H;

    // asteroids motion
    asteroids.forEach(a=>{
      a.x += a.vx; a.y += a.vy;
      if(a.x<0||a.x>W) a.vx*=-1; if(a.y<0||a.y>H) a.vy*=-1;
    });

    // cargo collection
    cargos.forEach(c=>{
      if(!c.collected && dist(c, ship) < ship.r + c.r){
        c.collected = true;
        ship.fuel = Math.min(ship.fuel + 20, 100);
        playBeep(600, 0.1);
      }
    });
    // respawn collected cargo
    cargos.forEach((c,i)=>{ if(c.collected){ cargos.splice(i,1); spawnCargo(); } });

    // collision with asteroids
    for(const a of asteroids){ if(dist(a, ship) < ship.r + a.r){ gameOver('Hit asteroid'); return; } }
    if(ship.fuel <= 0){ gameOver('Out of fuel'); return; }
    draw();
    requestAnimationFrame(update);
  }

  function draw(){
    // background gradient (space)
    const bg = ctx.createLinearGradient(0,0,W,H);
    bg.addColorStop(0,'#000020');
    bg.addColorStop(1,'#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='white';
    stars.forEach(s=>{ ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill(); });
    // draw ship trail
    ctx.fillStyle='rgba(0,200,255,0.3)';
    trail.forEach(p=>{
      const alpha = Math.max(0, 1 - p.age/30);
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-15,0,15,0);
    shipGrad.addColorStop(0,'#00aaff');
    shipGrad.addColorStop(1,'#ffffff');
    ctx.fillStyle=shipGrad;
    ctx.beginPath();
    ctx.moveTo(15,0); ctx.lineTo(-10,8); ctx.lineTo(-10,-8); ctx.closePath();
    ctx.fill();
    ctx.restore();
    // cargos
    cargos.forEach(c=>{
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
      grad.addColorStop(0, '#aaff00');
      grad.addColorStop(1, '#006600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // asteroids with shading
    asteroids.forEach(a=>{
      const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle='yellow';
    ctx.font='16px sans-serif';
    ctx.fillText('Fuel: '+ship.fuel.toFixed(0),10,20);
  }

  function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y); }
  function gameOver(msg){
    // play collision/failure sound
    playBeep(200, 0.3);
    ctx.fillStyle='red';
    ctx.font='30px sans-serif';
    ctx.fillText('Game Over: '+msg, W/2-150, H/2);
  }

  requestAnimationFrame(update);
})();
