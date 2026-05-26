// Asteroid Collector game with improved graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// ----- Game data -----
const ship = {x: canvas.width/2, y: canvas.height/2, vx:0, vy:0, r:12};
const keys = {};
const accel = 0.2, friction = 0.98, maxSpeed = 5;
const asteroidCount = 5;
const asteroids = [];
const crystalCount = 8;
const crystals = [];
// star field with varying size & brightness
const starCount = 150;
const stars = []; // each star: {x, y, size, alpha}
let collected = 0;
let startTime = null;
const duration = 60000; // 60s
let gameOver = false;
let win = false;
// audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.value = 0.07;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

function rand(min,max){return Math.random()*(max-min)+min;}
function init(){
  for(let i=0;i<asteroidCount;i++){
    asteroids.push({x:rand(0,canvas.width), y:rand(0,canvas.height), vx:rand(-2,2), vy:rand(-2,2), r:20});
  }
  // generate star field
  for(let i=0;i<starCount;i++){
    stars.push({
      x: rand(0, canvas.width),
      y: rand(0, canvas.height),
      size: rand(1,3),
      alpha: rand(0.5,1)
    });
  }
  for(let i=0;i<crystalCount;i++){
    crystals.push({x:rand(30,canvas.width-30), y:rand(30,canvas.height-30), r:8, collected:false});
  }
  startTime = performance.now();
  requestAnimationFrame(loop);
}

function loop(ts){
  if(gameOver){drawEnd();return;}
  const dt = ts - (startTime||ts);
  // timer
  const elapsed = ts - startTime;
  if(elapsed>=duration){gameOver=true; win=false;}
  // controls
  if(keys['ArrowUp']) ship.vy -= accel;
  if(keys['ArrowDown']) ship.vy += accel;
  if(keys['ArrowLeft']) ship.vx -= accel;
  if(keys['ArrowRight']) ship.vx += accel;
  // limit speed
  const speed = Math.hypot(ship.vx, ship.vy);
  if(speed>maxSpeed){ship.vx*=maxSpeed/speed; ship.vy*=maxSpeed/speed;}
  // apply friction
  ship.vx*=friction; ship.vy*=friction;
  ship.x += ship.vx; ship.y += ship.vy;
  // keep ship inside
  if(ship.x<0) ship.x=0; if(ship.x>canvas.width) ship.x=canvas.width;
  if(ship.y<0) ship.y=0; if(ship.y>canvas.height) ship.y=canvas.height;
  // asteroids move & bounce
  asteroids.forEach(a=>{
    a.x+=a.vx; a.y+=a.vy;
    if(a.x<a.r||a.x>canvas.width-a.r) a.vx*=-1;
    if(a.y<a.r||a.y>canvas.height-a.r) a.vy*=-1;
  });
  // collisions ship-asteroid
  for(const a of asteroids){
    if(dist(ship.x,ship.y,a.x,a.y)<ship.r+a.r){gameOver=true; win=false; beep(200,0.2); break;}
  }
  // ship-crystal
  for(const c of crystals){
    if(!c.collected && dist(ship.x,ship.y,c.x,c.y)<ship.r+c.r){
      c.collected=true; 
      collected++;
      beep(800,0.1); // crystal collect sound
    }
  }
  if(collected===crystalCount){gameOver=true; win=true;}
  // render
   // background
   ctx.fillStyle='black';
   ctx.fillRect(0,0,canvas.width,canvas.height);
// stars (twinkling)
    stars.forEach(s=>{
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
// ship (triangle pointing direction)
   ctx.fillStyle='white';
   const angle = Math.atan2(ship.vy, ship.vx) || 0;
   ctx.save();
   ctx.translate(ship.x, ship.y);
   ctx.rotate(angle);
   ctx.beginPath();
   ctx.moveTo(ship.r, 0);
   ctx.lineTo(-ship.r, ship.r/2);
   ctx.lineTo(-ship.r, -ship.r/2);
   ctx.closePath();
   ctx.fill();
   ctx.restore();
// asteroids with gradient shading
   asteroids.forEach(a=>{
     const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
     grad.addColorStop(0, '#888');
     grad.addColorStop(1, '#222');
     ctx.fillStyle = grad;
     ctx.beginPath();
     ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
     ctx.fill();
   });
// crystals with glow
   crystals.forEach(c=>{
     if(c.collected) return;
     const grad = ctx.createRadialGradient(c.x, c.y, c.r*0.2, c.x, c.y, c.r);
     grad.addColorStop(0, '#aaffff');
     grad.addColorStop(1, '#0066ff');
     ctx.fillStyle = grad;
     ctx.beginPath();
     ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
     ctx.fill();
   });
  // UI
  ctx.fillStyle='yellow';
  ctx.font='16px sans-serif';
  ctx.fillText(`Time: ${Math.max(0,Math.ceil((duration-elapsed)/1000))}`,10,20);
  ctx.fillText(`Collected: ${collected}/${crystalCount}`,10,40);
  requestAnimationFrame(loop);
}
function drawEnd(){
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='white';
  ctx.font='30px sans-serif';
  const msg = win? 'You Win!' : 'Game Over';
  const txt = ctx.measureText(msg);
  ctx.fillText(msg, (canvas.width-txt.width)/2, canvas.height/2);
}
function dist(x1,y1,x2,y2){return Math.hypot(x2-x1,y2-y1);}
window.addEventListener('keydown',e=>{ if (audioCtx.state==='suspended') audioCtx.resume(); keys[e.key]=true; });
window.addEventListener('keyup',e=>keys[e.key]=false);
init();
