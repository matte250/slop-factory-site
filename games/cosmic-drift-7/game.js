// Simple top‑down space drift game targeting <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
      osc.stop(audioCtx.currentTime + 0.12);
    }, dur);
  };
  let thrustOsc = null;
  const startThrustSound = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 80;
    thrustOsc.type = 'square';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.start();
  };
  const stopThrustSound = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  };
  const playCollectSound = () => playTone(600, 80);
  const playExplosionSound = () => playTone(150, 200);
  const playGameOverSound = () => playTone(80, 500);

  // --- player ship ---
  const ship = {x: W/2, y: H/2, angle: 0, vx: 0, vy: 0, size: 12, fuel: 100, alive:true, score:0};
  let gameOverPlayed = false;
  const THRUST = 0.07; // acceleration per frame when thrusting
  const ROT_SPEED = 0.07; // rad per frame when turning
  let thrusting = false, turningLeft = false, turningRight = false;

  // --- visual helpers ---
  // star field background
  const stars = Array.from({length: 100}, () => ({x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.5}));

  // thrust particles
  const particles = []; // {x,y,life,dx,dy}


  // --- asteroids & orbs ---
  const asteroids = [];
  const orbs = [];
  const AST_SPAWN_RATE = 0.02; // chance per frame
  const ORB_SPAWN_RATE = 0.01;
  const MAX_AST = 20;
  const MAX_ORB = 5;

  // --- input handling ---
  window.addEventListener('keydown', e => {
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowUp') {
      thrusting = true;
      startThrustSound();
    }
    if (e.code === 'ArrowLeft') turningLeft = true;
    if (e.code === 'ArrowRight') turningRight = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp') {
      thrusting = false;
      stopThrustSound();
    }
    if (e.code === 'ArrowLeft') turningLeft = false;
    if (e.code === 'ArrowRight') turningRight = false;
  });

  // --- helper functions ---
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (x1,y1,x2,y2) => Math.hypot(x2-x1, y2-y1);

  function spawnAsteroid(){
    const side = Math.floor(rand(0,4));
    let x,y,dx,dy;
    const r = rand(15,35);
    switch(side){
      case 0: x=0; y=rand(0,H); dx=rand(0.5,2); dy=rand(-1,1); break; // left
      case 1: x=W; y=rand(0,H); dx=rand(-2,-0.5); dy=rand(-1,1); break; // right
      case 2: x=rand(0,W); y=0; dx=rand(-1,1); dy=rand(0.5,2); break; // top
      default: x=rand(0,W); y=H; dx=rand(-1,1); dy=rand(-2,-0.5); break; // bottom
    }
    asteroids.push({x, y, dx, dy, r});
  }

  function spawnOrb(){
    const x = rand(0,W), y = rand(0,H);
    orbs.push({x, y, r:8});
  }

  function update(){
    if(!ship.alive) return;
    // rotate
    if(turningLeft) ship.angle -= ROT_SPEED;
    if(turningRight) ship.angle += ROT_SPEED;
    // thrust
    if(thrusting && ship.fuel>0){
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
      ship.fuel = Math.max(0, ship.fuel - 0.1);
      // create thrust particles
      const px = ship.x - Math.cos(ship.angle) * ship.size;
      const py = ship.y - Math.sin(ship.angle) * ship.size;
      for(let i=0;i<2;i++){
        particles.push({
          x: px + (Math.random()-0.5)*4,
          y: py + (Math.random()-0.5)*4,
          dx: -Math.cos(ship.angle)*(Math.random()*0.5+0.2) + (Math.random()-0.5)*0.2,
          dy: -Math.sin(ship.angle)*(Math.random()*0.5+0.2) + (Math.random()-0.5)*0.2,
          life: 30
        });
      }
    }
    // drift forward constantly (simple damping)
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x = (ship.x + ship.vx + W) % W;
    ship.y = (ship.y + ship.vy + H) % H;

    // spawn entities
    if(asteroids.length < MAX_AST && Math.random()<AST_SPAWN_RATE) spawnAsteroid();
    if(orbs.length < MAX_ORB && Math.random()<ORB_SPAWN_RATE) spawnOrb();

    // update asteroids
    for(let i=asteroids.length-1;i>=0;i--){
      const a = asteroids[i];
      a.x = (a.x + a.dx + W) % W;
      a.y = (a.y + a.dy + H) % H;
      // collision with ship
      if(dist(a.x,a.y,ship.x,ship.y) < a.r + ship.size){
        ship.alive = false;
        playExplosionSound();
        break;
      }
    }
    // update orbs
    for(let i=orbs.length-1;i>=0;i--){
      const o = orbs[i];
      // collision with ship
      if(dist(o.x,o.y,ship.x,ship.y) < o.r + ship.size){
        ship.fuel = Math.min(100, ship.fuel + 20);
        ship.score = (ship.score||0) + 10;
        playCollectSound();
        orbs.splice(i,1);
      }
    }
    // update particles
    for(let i=particles.length-1;i>=0;i--){
      const p = particles[i];
      p.x += p.dx; p.y += p.dy;
      p.life--;
      if(p.life<=0) particles.splice(i,1);
    }
  }

  function draw(){
    // background star field
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#444';
    stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();});

    // thrust particles
    ctx.fillStyle = 'rgba(255,165,0,0.8)'; // orange flame
    particles.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();});

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // gradient hull
    const grad = ctx.createLinearGradient(-ship.size,0,ship.size,0);
    grad.addColorStop(0, ship.alive ? '#0f0' : '#f00');
    grad.addColorStop(1, ship.alive ? '#060' : '#600');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.size,0);
    ctx.lineTo(-ship.size/2,-ship.size/2);
    ctx.lineTo(-ship.size/2,ship.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // asteroids with simple shading
    asteroids.forEach(a=>{
      const radGrad = ctx.createRadialGradient(a.x,a.y,a.r*0.3,a.x,a.y,a.r);
      radGrad.addColorStop(0,'#aaa');
      radGrad.addColorStop(1,'#555');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
      ctx.fill();
    });

    // orbs (glowing)
    orbs.forEach(o=>{
      ctx.fillStyle = 'rgba(255,255,0,0.9)';
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fuel: '+ship.fuel.toFixed(0),10,20);
    ctx.fillText('Score: '+(ship.score||0),10,40);
    if(!ship.alive){
      // ensure thrust sound stops
      stopThrustSound();
      if(!gameOverPlayed){
        playGameOverSound();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,W,H);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '36px sans-serif';
      ctx.fillText('Game Over',W/2,H/2);
    }
  }

  function loop(){
    update();
    draw();
    if(ship.alive) requestAnimationFrame(loop);
  }

  // start
  requestAnimationFrame(loop);
})();
