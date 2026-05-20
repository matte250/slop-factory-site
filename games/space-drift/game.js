// Simple Space Drift game
// Canvas with id="game"
(function(){
  const canvas = document.getElementById('game');
  if(!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Ship
  const ship = {
    x: width/2, y: height/2,
    vx: 0, vy: 0,
    radius: 10,
    fuel: 100,
    thrust: 0.2,
    maxSpeed: 5
  };

  // starfield background
  const stars = [];
  for(let i=0;i<120;i++){
    stars.push({x: Math.random()*width, y: Math.random()*height, r: Math.random()*1.2+0.3});
  }

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInit = false;
  function initAudio(){
    if(audioCtx.state === 'suspended') audioCtx.resume();
    audioInit = true;
  }
  function playTone(freq, dur){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // ensure audio starts after user interaction
  window.addEventListener('keydown', function resume(){
    if(!audioInit){ initAudio(); }
    window.removeEventListener('keydown', resume);
  });

  const orbs = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  function spawnOrb(){
    orbs.push({x: Math.random()*width, y: Math.random()*height, r:5});
  }
  function spawnAsteroid(){
    const angle = Math.random()*2*Math.PI;
    const speed = 1 + Math.random()*1.5;
    asteroids.push({
      x: Math.random()*width,
      y: Math.random()*height,
      vx: Math.cos(angle)*speed,
      vy: Math.sin(angle)*speed,
      r: 15 + Math.random()*10
    });
  }

  // Initial spawns
  for(let i=0;i<5;i++) spawnOrb();
  for(let i=0;i<3;i++) spawnAsteroid();

  const keys = {};
  window.addEventListener('keydown',e=>keys[e.key]=true);
  window.addEventListener('keyup',e=>keys[e.key]=false);

  function update(){
    if(gameOver) return;
    // fuel consumption
    ship.fuel -= 0.02;
    if(ship.fuel<=0){ gameOver=true; return; }

    // controls – arrow keys
    if(keys['ArrowUp']){ ship.vy -= ship.thrust; }
    if(keys['ArrowDown']){ ship.vy += ship.thrust; }
    if(keys['ArrowLeft']){ ship.vx -= ship.thrust; }
    if(keys['ArrowRight']){ ship.vx += ship.thrust; }

    // limit speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if(speed>ship.maxSpeed){ ship.vx*=ship.maxSpeed/speed; ship.vy*=ship.maxSpeed/speed; }

    // move ship
    ship.x = (ship.x + ship.vx + width) % width;
    ship.y = (ship.y + ship.vy + height) % height;

    // move asteroids
    for(const a of asteroids){
      a.x = (a.x + a.vx + width) % width;
      a.y = (a.y + a.vy + height) % height;
    }

    // check collisions with orbs
    for(let i=orbs.length-1;i>=0;i--){
      const o = orbs[i];
      const d = Math.hypot(ship.x-o.x, ship.y-o.y);
if(d < ship.radius+o.r){
          score++; ship.fuel = Math.min(100, ship.fuel+10);
          orbs.splice(i,1);
          spawnOrb();
          playTone(800, 0.1); // orb collection sound
        }
    }

    // check collisions with asteroids
    for(const a of asteroids){
      const d = Math.hypot(ship.x-a.x, ship.y-a.y);
      if(d < ship.radius+a.r){ playTone(200, 0.3); gameOver=true; break; }
    }
  }

  function draw(){
    // background gradient
    const bg = ctx.createLinearGradient(0,0,0,height);
    bg.addColorStop(0,'#001020');
    bg.addColorStop(1,'#000');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,width,height);
    // starfield
    ctx.fillStyle = 'white';
    for(const s of stars){
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 2*Math.PI);
      ctx.fill();
    }
    // ship – draw as triangle pointing in direction of movement
    const angle = Math.atan2(ship.vy, ship.vx) || -Math.PI/2;
    const shipSize = ship.radius;
    ctx.fillStyle='white';
    ctx.beginPath();
    ctx.moveTo(
      ship.x + Math.cos(angle) * shipSize,
      ship.y + Math.sin(angle) * shipSize
    );
    ctx.lineTo(
      ship.x + Math.cos(angle + Math.PI*0.8) * shipSize*0.6,
      ship.y + Math.sin(angle + Math.PI*0.8) * shipSize*0.6
    );
    ctx.lineTo(
      ship.x + Math.cos(angle - Math.PI*0.8) * shipSize*0.6,
      ship.y + Math.sin(angle - Math.PI*0.8) * shipSize*0.6
    );
    ctx.closePath();
    ctx.fill();
    // orbs – glowing with radial gradient
    for(const o of orbs){
      const grad = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*3);
      grad.addColorStop(0,'rgba(0,255,255,0.8)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x,o.y,o.r*3,0,2*Math.PI);
      ctx.fill();
    }
    // asteroids – darker with slight shading
    for(const a of asteroids){
      ctx.fillStyle='rgba(100,100,100,0.7)';
      ctx.beginPath();
      ctx.arc(a.x,a.y,a.r,0,2*Math.PI);
      ctx.fill();
    }
    // UI overlay
    ctx.fillStyle='yellow';
    ctx.font='14px monospace';
    ctx.fillText('Score: '+score,10,20);
    ctx.fillText('Fuel: '+Math.floor(ship.fuel),10,40);
    if(gameOver){
      ctx.fillStyle='red';
      ctx.font='30px monospace';
      ctx.fillText('Game Over', width/2-80, height/2);
    }
  }

  function loop(){
    update();
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }
  loop();
})();
