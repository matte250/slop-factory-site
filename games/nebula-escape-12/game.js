// Minimalist Nebula Escape game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;
  // ---- audio ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration/1000);
    osc.start(now);
    osc.stop(now + duration/1000);
  }
  function playThrust(){ playTone(200, 100); }
  function playPickup(){ playTone(600, 100); }
  function playExplosion(){ playTone(100, 300); }

  // ---- utility ----
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  // ---- entities ----
  const ship = {x: W/2, y: H/2, r: 10, vx:0, vy:0, speed:0.2};
  const asteroids = [];
  const fuels = [];
  let timer = 30; // seconds
  let lastTime = performance.now();
  let gameOver = false;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => {keys[e.key] = true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) playThrust();});
  window.addEventListener('keyup', e => {keys[e.key] = false;});

  function spawnAsteroid(){
    const angle = rand(0, Math.PI*2);
    const radius = rand(15,30);
    const speed = rand(0.5, 1.5);
    // spawn at random edge
    let x, y;
    const edge = Math.floor(rand(0,4));
    if(edge===0){x=0; y=rand(0,H);} // left
    else if(edge===1){x=W; y=rand(0,H);} // right
    else if(edge===2){x=rand(0,W); y=0;} // top
    else {x=rand(0,W); y=H;} // bottom
    const vx = Math.cos(angle)*speed;
    const vy = Math.sin(angle)*speed;
    asteroids.push({x,y,radius,vx,vy});
  }

  function spawnFuel(){
    const x = rand(20, W-20);
    const y = rand(20, H-20);
    fuels.push({x,y,r:8});
  }

  // initial spawns
  for(let i=0;i<5;i++) spawnAsteroid();
  spawnFuel();
  // generate background stars
  const stars = [];
  for(let i=0;i<100;i++){
    stars.push({
      x: rand(0, W),
      y: rand(0, H),
      offset: rand(0, Math.PI*2)
    });
  }

  function update(dt){
    // ship movement
    if(keys['ArrowUp']) ship.vy -= ship.speed;
    if(keys['ArrowDown']) ship.vy += ship.speed;
    if(keys['ArrowLeft']) ship.vx -= ship.speed;
    if(keys['ArrowRight']) ship.vx += ship.speed;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around edges
    if(ship.x<0) ship.x+=W; if(ship.x>W) ship.x-=W;
    if(ship.y<0) ship.y+=H; if(ship.y>H) ship.y-=H;
    // dampening
    ship.vx *= 0.99; ship.vy *= 0.99;

    // asteroids
    asteroids.forEach(a=>{a.x+=a.vx*dt; a.y+=a.vy*dt;});
    // remove off‑screen asteroids & respawn
    for(let i=asteroids.length-1;i>=0;i--){
      const a=asteroids[i];
      if(a.x<-50||a.x>W+50||a.y<-50||a.y>H+50){asteroids.splice(i,1);spawnAsteroid();}
    }
    // fuels timeout
    // collision ship‑asteroid
    for(const a of asteroids){
      if(dist(ship.x,ship.y,a.x,a.y) < ship.r + a.radius){playExplosion(); gameOver=true;}
    }
    // collision ship‑fuel
    for(let i=fuels.length-1;i>=0;i--){
      const f=fuels[i];
      if(dist(ship.x,ship.y,f.x,f.y) < ship.r + f.r){
        timer += 5; // add 5 seconds
        fuels.splice(i,1);
        spawnFuel();
        playPickup();
      }
    }
    // timer decrement
    timer -= dt/1000;
    if(timer<=0) gameOver=true;
  }

  // ---- rendering helpers ----
function drawStars(){
  const t = performance.now() / 1000;
  ctx.fillStyle = 'white';
  stars.forEach(s=>{
    const alpha = 0.5 + 0.5 * Math.sin(t + s.offset);
    ctx.globalAlpha = alpha;
    ctx.fillRect(s.x, s.y, 1, 1);
  });
  ctx.globalAlpha = 1;
}

function drawShip(){
  // thrust flame if accelerating
  const thrust = keys['ArrowUp']||keys['ArrowDown']||keys['ArrowLeft']||keys['ArrowRight'];
  ctx.save();
  ctx.translate(ship.x, ship.y);
  const angle = Math.atan2(ship.vy, ship.vx) || 0;
  ctx.rotate(angle);
  // flame
  if(thrust){
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(0, ship.r);
    ctx.lineTo(ship.r/2, ship.r + 12);
    ctx.lineTo(-ship.r/2, ship.r + 12);
    ctx.closePath();
    ctx.fill();
  }
  // ship body
  ctx.fillStyle='white';
  ctx.beginPath();
  ctx.moveTo(0,-ship.r);
  ctx.lineTo(ship.r/2, ship.r);
  ctx.lineTo(-ship.r/2, ship.r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawAsteroid(a){
  const grad = ctx.createRadialGradient(a.x, a.y, a.radius*0.2, a.x, a.y, a.radius);
  grad.addColorStop(0, '#777');
  grad.addColorStop(1, '#222');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
  ctx.fill();
}

function drawFuel(f){
  const grad = ctx.createRadialGradient(f.x, f.y, f.r*0.2, f.x, f.y, f.r);
  grad.addColorStop(0, '#aff');
  grad.addColorStop(1, '#0a0');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
  ctx.fill();
}

function draw(){
  // space background
  const bg = ctx.createLinearGradient(0,0,W,0);
  bg.addColorStop(0,'#001');
  bg.addColorStop(1,'#000');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,W,H);

  drawStars();
  drawShip();
  asteroids.forEach(drawAsteroid);
  fuels.forEach(drawFuel);

  // timer display
  ctx.fillStyle='yellow';
  ctx.font='20px sans-serif';
  ctx.fillText('Time: '+Math.max(0, timer).toFixed(1),10,30);
  if(gameOver){
    ctx.fillStyle='red';
    ctx.font='40px sans-serif';
    ctx.fillText('Game Over', W/2-100, H/2);
  }
}

  function loop(now){
    const dt = now - lastTime;
    lastTime = now;
    if(!gameOver){
      update(dt);
    }
    draw();
    if(!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
