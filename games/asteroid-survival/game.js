// Asteroid Survival – enhanced graphics
// Canvas must have id="game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas){ console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  // --- State -----------------------------------------------------
  const ship = {x:w/2, y:h/2, angle:0, vx:0, vy:0, size:12, fuel:100};
  const keys = {};
  const asteroids = [];
  const orbs = [];
  const stars = [];
  let frames = 0;

  // --- Input ------------------------------------------------------
  // Track keys for controls
  window.addEventListener('keydown',e=>{
    // Resume audio context on first interaction
    if(audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key]=true;
  });
  window.addEventListener('keyup',e=>keys[e.key]=false);

  // --- Audio Setup ------------------------------------------------
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Simple beep helper for short effects
  function beep(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  // Thrust sound (continuous while thrusting)
  let thrustOsc = null;
  function startThrust(){
    if(thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 200;
    thrustOsc.type = 'square';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
    thrustOsc.start();
  }
  function stopThrust(){
    if(!thrustOsc) return;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
  }

  // --- Helpers ----------------------------------------------------
  function rand(min,max){return Math.random()*(max-min)+min;}
  function spawnAsteroid(){
    const side = Math.floor(rand(0,4));
    const pos = [
      {x:0, y:rand(0,h)},
      {x:w, y:rand(0,h)},
      {x:rand(0,w), y:0},
      {x:rand(0,w), y:h}
    ][side];
    const speed = rand(0.4,1.5);
    const angle = Math.atan2(ship.y-pos.y, ship.x-pos.x);
    asteroids.push({x:pos.x, y:pos.y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, r:rand(12,28)});
  }
  function spawnOrb(){
    orbs.push({x:rand(0,w), y:rand(0,h), r:5});
  }
  function initStars(count=150){
    for(let i=0;i<count;i++) stars.push({x:rand(0,w), y:rand(0,h), r:rand(0.5,1.5)});
  }
  initStars();

  // --- Game Loop -------------------------------------------------
  function update(){
    // Controls
    if(keys['a']) ship.angle -= 0.045;
    if(keys['d']) ship.angle += 0.045;
    if(keys['w'] && ship.fuel>0){
      const thrust = 0.12;
      ship.vx += Math.cos(ship.angle)*thrust;
      ship.vy += Math.sin(ship.angle)*thrust;
      ship.fuel = Math.max(0, ship.fuel-0.07);
      startThrust();
    } else {
      stopThrust();
    }
    // Motion
    ship.x += ship.vx; ship.y += ship.vy;
    // Wrap
    if(ship.x<0) ship.x+=w; if(ship.x>w) ship.x-=w;
    if(ship.y<0) ship.y+=h; if(ship.y>h) ship.y-=h;
    // Friction
    ship.vx *= 0.99; ship.vy *= 0.99;
    // Asteroids movement
    asteroids.forEach(a=>{a.x+=a.vx; a.y+=a.vy; if(a.x<0) a.x+=w; if(a.x>w) a.x-=w; if(a.y<0) a.y+=h; if(a.y>w) a.y-=h;});
    // Collisions – ship vs asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      const dx=ship.x-a.x, dy=ship.y-a.y;
      if(Math.hypot(dx,dy)<a.r+ship.size){
        alert('Game Over!');
        document.location.reload();
        return;
      }
    }
    // Collisions – ship vs orbs
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];
      const dx=ship.x-o.x, dy=ship.y-o.y;
      if(Math.hypot(dx,dy)<o.r+ship.size){
        ship.fuel = Math.min(ship.fuel+30,100);
        orbs.splice(i,1);
      }
    }
    // Spawn entities
    if(frames%110===0) spawnAsteroid(); // ~2s
    if(frames%280===0) spawnOrb();
    frames++;

    // --- Rendering ------------------------------------------------
    // Space background
    ctx.fillStyle = '#000010';
    ctx.fillRect(0,0,w,h);
    // Stars (tiny glows)
    ctx.fillStyle = 'white';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});
    // Ship – gradient triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    grad.addColorStop(0, '#ffdd55');
    grad.addColorStop(1, '#ff6600');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.size,0);
    ctx.lineTo(-ship.size/2, ship.size/2);
    ctx.lineTo(-ship.size/2, -ship.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids – filled with radial gradient for rock look
    asteroids.forEach(a=>{
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
      radGrad.addColorStop(0, '#777777');
      radGrad.addColorStop(1, '#222222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
    });
    // Orbs – glowing yellow
    ctx.fillStyle = 'yellow';
    orbs.forEach(o=>{ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();});
    // Fuel bar – background + fill
    ctx.fillStyle = '#444';
    ctx.fillRect(10,10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10,10, ship.fuel, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10,10,100,10);
    requestAnimationFrame(update);
  }
  update();
})();
