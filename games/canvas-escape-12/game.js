// Canvas Escape – enhanced graphics version
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
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
let frameCount = 0;
let lastThrustSound = 0;

// ship state and visual helpers
const ship = {x: canvas.width/2, y: canvas.height/2, angle: 0, vx: 0, vy: 0};
const asteroids = [];
const powerUps = [];
let score = 0;
let gameOver = false;
// particle arrays for thruster and explosions
const particles = [];
// generate simple starfield background
const stars = Array.from({length: 200},()=>({x:Math.random()*canvas.width,y:Math.random()*canvas.height, size:Math.random()*2+0.5}));

function spawnAsteroid(){
  const r = Math.random()*20+10;
  const side = Math.floor(Math.random()*4);
  let x, y, vx, vy;
  if(side===0){x=0; y=Math.random()*canvas.height; vx=Math.random()*2+1; vy=0;}
  else if(side===1){x=canvas.width; y=Math.random()*canvas.height; vx=-(Math.random()*2+1); vy=0;}
  else if(side===2){x=Math.random()*canvas.width; y=0; vx=0; vy=Math.random()*2+1;}
  else {x=Math.random()*canvas.width; y=canvas.height; vx=0; vy=-(Math.random()*2+1);}
  // store gradient colors for richer look
  const hue = Math.random()*360;
  const color = `hsl(${hue},70%,50%)`;
  asteroids.push({x,y,vx,vy,r,color});
}
function spawnPowerUp(){
  const x = Math.random()*canvas.width;
  const y = Math.random()*canvas.height;
  const r = 8;
  powerUps.push({x,y,r});
}
setInterval(spawnAsteroid,1500);
setInterval(spawnPowerUp,5000);

const keys = {};
window.addEventListener('keydown',e=>{keys[e.key]=true;});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

function update(){
  if(gameOver) return;
  // ship rotation & thrust
  if(keys['ArrowLeft']) ship.angle -= 0.07;
  if(keys['ArrowRight']) ship.angle += 0.07;
  const thrusting = keys['ArrowUp'];
  if(thrusting){
    ship.vx += Math.cos(ship.angle)*0.2;
    ship.vy += Math.sin(ship.angle)*0.2;
    // emit thruster particles
    for(let i=0;i<2;i++){
      const angle = ship.angle + Math.PI + (Math.random()-0.5)*0.3;
      const speed = Math.random()*1.5+0.5;
      particles.push({
        x: ship.x - Math.cos(ship.angle)*12,
        y: ship.y - Math.sin(ship.angle)*12,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        radius: Math.random()*2+1,
        color: 'orange',
        life: 30,
        maxLife: 30
      });
    }
    // play thrust sound at limited rate
    if(frameCount - lastThrustSound > 5){
      playTone(200, 80);
      lastThrustSound = frameCount;
    }
  }
  ship.x += ship.vx; ship.y += ship.vy;
  // wrap around edges
  if(ship.x<0) ship.x+=canvas.width;
  if(ship.x>canvas.width) ship.x-=canvas.width;
  if(ship.y<0) ship.y+=canvas.height;
  if(ship.y>canvas.height) ship.y-=canvas.height;

  // update particles (fade and move)
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.life--;
    if(p.life<=0) particles.splice(i,1);
  }

  // move asteroids and detect collisions
  for(let i=asteroids.length-1;i>=0;i--){
    const a = asteroids[i];
    a.x += a.vx; a.y += a.vy;
    if(a.x<-50||a.x>canvas.width+50||a.y<-50||a.y>canvas.height+50){
      asteroids.splice(i,1);
      continue;
    }
    const dx = a.x - ship.x, dy = a.y - ship.y;
    if(Math.hypot(dx,dy) < a.r + 10){
      gameOver = true;
      playTone(80, 300); // explosion / crash sound
      break;
    }
  }

  // power‑up collection
  for(let i=powerUps.length-1;i>=0;i--){
    const p = powerUps[i];
    const dx = p.x - ship.x, dy = p.y - ship.y;
    if(Math.hypot(dx,dy) < p.r + 10){
      score += 10;
      powerUps.splice(i,1);
      playTone(600, 100); // collect sound
    }
  }
}

function draw(){
  // background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle='white';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
    ctx.fill();
  });
  // particles (thruster / explosion)
  particles.forEach(p=>{
    ctx.globalAlpha = p.life/ p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.radius,0,Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // ship
  ctx.save();
  ctx.translate(ship.x,ship.y);
  ctx.rotate(ship.angle);
  // ship body
  ctx.beginPath();
  ctx.moveTo(15,0);
  ctx.lineTo(-10,7);
  ctx.lineTo(-10,-7);
  ctx.closePath();
  ctx.fillStyle='white';
  ctx.fill();
  // thrust flame when accelerating
  if(keys['ArrowUp']){
    ctx.beginPath();
    ctx.moveTo(-10,5);
    ctx.lineTo(-18,0);
    ctx.lineTo(-10,-5);
    ctx.closePath();
    ctx.fillStyle='orange';
    ctx.fill();
  }
  ctx.restore();
  // asteroids
  asteroids.forEach(a=>{
    ctx.beginPath();
    ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
    ctx.fillStyle = a.color || 'gray';
    ctx.fill();
  });
  // power‑ups
  powerUps.forEach(p=>{
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle='yellow';
    ctx.fill();
  });
  // HUD
  ctx.fillStyle='white';
  ctx.font='16px monospace';
  ctx.fillText('Score: '+score,10,20);
  if(gameOver){
    ctx.textAlign='center';
    ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
  }
}

function loop(){
  frameCount++; // track frames for throttling sound
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
// resume AudioContext on first user interaction
window.addEventListener('click',()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); },{once:true});
requestAnimationFrame(loop);
