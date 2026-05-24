// Simple Asteroid Escape game targeting <canvas id="game"></canvas>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 400;
// simple audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, ms){
  // Ensure the audio context is running (required after user gesture)
  if (audioCtx.state !== 'running') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  setTimeout(()=>{
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.1);
  }, ms);
}
function playLaser(){playTone(600, 80);}
function playExplosion(){playTone(150, 200);}

// ship
const ship = {x:50, y:canvas.height/2, w:30, h:20, speed:4};
let lasers = [], asteroids = [], stars = [];
let score = 0, fuel = 100, ammo = 10;
const keys = {};

// stars background
function initStars(){for(let i=0;i<50;i++) stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*2+1});}
function updateStars(){for(let s of stars){s.x-=1; if(s.x<0){s.x=canvas.width; s.y=Math.random()*canvas.height;}}}
function drawStars(){
  for(let s of stars){
    ctx.fillStyle=`rgba(255,255,255,${Math.random()*0.5+0.5})`;
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,2*Math.PI);
    ctx.fill();
  }
}

function drawShip(){
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.fillStyle='cyan';
  ctx.beginPath();
  ctx.moveTo(-ship.w/2, -ship.h/2);
  ctx.lineTo(ship.w, 0);
  ctx.lineTo(-ship.w/2, ship.h/2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
function drawLasers(){ctx.fillStyle='red'; for(let l of lasers) ctx.fillRect(l.x, l.y-2, 10,4);}
function drawAsteroids(){
  for(let a of asteroids){
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    // radial gradient for a shiny look
    const grad = ctx.createRadialGradient(0,0,a.r*0.2,0,0,a.r);
    grad.addColorStop(0,'#888');
    grad.addColorStop(1,'#222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0,0,a.r,0,2*Math.PI);
    ctx.fill();
    ctx.restore();
    // update rotation
    a.angle += a.rotSpeed;
  }
}
function drawHUD(){ctx.fillStyle='white'; ctx.font='12px sans-serif'; ctx.fillText(`Score: ${score}`,10,15); ctx.fillText(`Fuel: ${fuel.toFixed(0)}`,10,30); ctx.fillText(`Ammo: ${ammo}`,10,45);}

function spawnAsteroid(){
  const r=Math.random()*20+10;
  asteroids.push({
    x:canvas.width+r,
    y:Math.random()*canvas.height,
    r,
    speed:Math.random()*2+1,
    angle:Math.random()*Math.PI*2,
    rotSpeed:(Math.random()-0.5)*0.04,
    passed:false
  });
}

function update(){
  if(fuel<=0){gameOver();return;}
  fuel-=0.02;
  if(keys['ArrowUp']) ship.y-=ship.speed;
  if(keys['ArrowDown']) ship.y+=ship.speed;
  ship.y=Math.max(ship.h/2, Math.min(canvas.height-ship.h/2, ship.y));
  // lasers
  lasers = lasers.filter(l=>l.x<canvas.width);
  for(let l of lasers) l.x+=6;
  // asteroids
  asteroids = asteroids.filter(a=>a.x+a.r>0);
  for(let a of asteroids){
    a.x-=a.speed;
    // collision ship
    if(Math.hypot(a.x-ship.x, a.y-ship.y) < a.r + ship.w/2){gameOver();return;}
    // laser hit
    for(let i=lasers.length-1;i>=0;i--){
      const l=lasers[i];
      if(Math.hypot(a.x-l.x, a.y-l.y) < a.r){score+=10; lasers.splice(i,1); a.x=-100; playExplosion();}
    }
    // avoided
    if(!a.passed && a.x < ship.x){score+=5; a.passed=true;}
  }
  if(Math.random()<0.02) spawnAsteroid();
  updateStars();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawStars(); drawShip(); drawLasers(); drawAsteroids(); drawHUD();
}

function loop(){update(); draw(); requestAnimationFrame(loop);}
function gameOver(){
  ctx.fillStyle='black'; ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='red'; ctx.font='30px sans-serif'; ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
  ctx.fillStyle='white'; ctx.font='20px sans-serif'; ctx.fillText(`Score: ${score}`, canvas.width/2-50, canvas.height/2+30);
}

document.addEventListener('keydown',e=>{keys[e.key]=true; if(e.key===' ' && ammo>0){ammo--; lasers.push({x:ship.x+ship.w, y:ship.y}); playLaser();}});

document.addEventListener('keyup',e=>keys[e.key]=false);

initStars(); requestAnimationFrame(loop);
