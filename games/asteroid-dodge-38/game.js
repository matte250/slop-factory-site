// Simple Asteroid Dodge game
// Canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player ship
  const ship = {x: width/2, y: height-30, w: 20, h: 30, speed: 4, boost: -8, vy:0, boosting:false};

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e=>{ keys[e.key]=true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e=>keys[e.key]=false);

  // Asteroids
  const asteroids = [];
  const asteroidSpawnRate = 90; // frames
  let frameCount = 0;

  // Stars for background
  const stars = [];
  for(let i=0;i<100;i++) stars.push({x:Math.random()*width, y:Math.random()*height, r:Math.random()*2+1, speed:Math.random()*0.5+0.2});

  function update(){
    // Move ship
    if(keys['ArrowLeft']) ship.x -= ship.speed;
    if(keys['ArrowRight']) ship.x += ship.speed;
    // keep inside bounds
    ship.x = Math.max(ship.w/2, Math.min(width-ship.w/2, ship.x));
    // Boost upward
    if(keys['ArrowUp'] && !ship.boosting){
      ship.vy = ship.boost;
      ship.boosting = true;
      playBeep(800, 0.1); // boost sound
    }
    ship.vy += 0.3; // gravity
    ship.y += ship.vy;
    if(ship.y > height-30){ ship.y = height-30; ship.vy=0; ship.boosting=false; }
    if(ship.y < 0){ ship.y = 0; ship.vy=0; }
    // Stars
    stars.forEach(s=>{ s.y += s.speed; if(s.y>height){ s.y=0; s.x=Math.random()*width; } });
    // Asteroids
if(frameCount % asteroidSpawnRate === 0){
  const size = Math.random()*20+10;
  asteroids.push({x: Math.random()*width, y:-size, r:size, speed: Math.random()*2+1});
  playBeep(400, 0.05); // asteroid spawn sound
}
    asteroids.forEach(a=>{ a.y += a.speed; });
    // Remove off‑screen
    while(asteroids.length && asteroids[0].y - asteroids[0].r > height) asteroids.shift();
    // Collision
    for(const a of asteroids){
      const dx = a.x - ship.x;
      const dy = a.y - (ship.y - ship.h/2);
      const dist = Math.hypot(dx, dy);
      if(dist < a.r + Math.max(ship.w, ship.h)/2){
        cancelAnimationFrame(raf);
        alert('Game Over');
        return;
      }
    }
    frameCount++;
  }

  function draw(){
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000011');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling)
    stars.forEach(s=>{
      ctx.fillStyle = s.r > 1.5 ? '#fff' : '#bbb';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2 * Math.PI);
      ctx.fill();
    });
    // ship (triangle) with optional boost flame
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h/2);
    ctx.lineTo(ship.x - ship.w/2, ship.y + ship.h/2);
    ctx.lineTo(ship.x + ship.w/2, ship.y + ship.h/2);
    ctx.closePath();
    ctx.fill();
    if (ship.boosting) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h/2);
      ctx.lineTo(ship.x - ship.w/4, ship.y + ship.h/2 + 10);
      ctx.lineTo(ship.x + ship.w/4, ship.y + ship.h/2 + 10);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  function loop(){
    update();
    draw();
    raf = requestAnimationFrame(loop);
  }
  let raf = requestAnimationFrame(loop);
})();
