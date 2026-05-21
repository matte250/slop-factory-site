// Simple Asteroid Shield game with improved graphics and sound effects
const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
function playTone(freq,dur){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.0001,audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2,audioCtx.currentTime+0.01);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime+dur);
}
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const cx = canvas.width/2, cy = canvas.height/2;
const planetR = 20, shieldR = 80, shieldArc = Math.PI/6; // 30° arc
let shieldAngle = 0;
let health = 5;
const asteroids = [];
// starfield background – generated once
const stars = Array.from({length: 100},()=>({
  x: Math.random()*canvas.width,
  y: Math.random()*canvas.height,
  r: Math.random()*1.5+0.5,
  opacity: Math.random()*0.5+0.5
}));
function spawnAsteroid(){
  const side = Math.floor(Math.random()*4);
  let x,y,dx,dy;
  const speed = 1.5 + Math.random()*1.5;
  if(side===0){x=0; y=Math.random()*canvas.height;}
  else if(side===1){x=canvas.width; y=Math.random()*canvas.height;}
  else if(side===2){x=Math.random()*canvas.width; y=0;}
  else {x=Math.random()*canvas.width; y=canvas.height;}
  const angle = Math.atan2(cy-y, cx-x);
  dx = Math.cos(angle)*speed;
  dy = Math.sin(angle)*speed;
  asteroids.push({x,y,dx,dy,r:8});
}
function update(){
  // move asteroids
  for(let i=asteroids.length-1;i>=0;i--){
    const a = asteroids[i];
    a.x+=a.dx; a.y+=a.dy;
    const dist = Math.hypot(a.x-cx, a.y-cy);
    const angle = Math.atan2(a.y-cy, a.x-cx);
    // shield collision
    if(dist<=shieldR && Math.abs(((angle-shieldAngle+Math.PI)%(2*Math.PI))-Math.PI)<=shieldArc/2){
      // play deflection sound
      playTone(600,0.08);
      asteroids.splice(i,1); continue;
    }
    // planet collision
    if(dist<=planetR){
      // play hit sound
      playTone(200,0.2);
      health--; asteroids.splice(i,1);
    }
    // out of bounds
    if(a.x<-20||a.x>canvas.width+20||a.y<-20||a.y>canvas.height+20){
      asteroids.splice(i,1);
    }
  }
  // spawn new asteroids
  if(Math.random()<0.02) spawnAsteroid();
}
function draw(){
  // background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle='white';
  for(const s of stars){
    ctx.globalAlpha = s.opacity;
    ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,2*Math.PI); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // planet with gradient
  const planetGrad = ctx.createRadialGradient(cx,cy,planetR*0.2,cx,cy,planetR);
  planetGrad.addColorStop(0,'#4caf50');
  planetGrad.addColorStop(1,'#1b5e20');
  ctx.fillStyle=planetGrad;
  ctx.beginPath(); ctx.arc(cx,cy,planetR,0,2*Math.PI); ctx.fill();
  // shield with glow
  ctx.save();
  ctx.strokeStyle='rgba(0,255,255,0.7)';
  ctx.lineWidth=8;
  ctx.shadowColor='cyan';
  ctx.shadowBlur=15;
  ctx.beginPath();
  ctx.arc(cx,cy,shieldR,shieldAngle-shieldArc/2,shieldAngle+shieldArc/2);
  ctx.stroke();
  ctx.restore();
  // asteroids with gradient
  for(const a of asteroids){
    const grad = ctx.createRadialGradient(a.x,a.y,a.r*0.2,a.x,a.y,a.r);
    grad.addColorStop(0,'#b0b0b0');
    grad.addColorStop(1,'#606060');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,2*Math.PI); ctx.fill();
  }
  // health text
  ctx.fillStyle='red';
  ctx.font='16px sans-serif';
  ctx.fillText('Health: '+health,10,20);
}
function loop(){
  if(health<=0){
    ctx.fillStyle='black';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over',cx,cy+10);
    return;
  }
  update();
  draw();
  requestAnimationFrame(loop);
}
canvas.addEventListener('mousemove',e=>{
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  shieldAngle = Math.atan2(my-cy, mx-cx);
});
loop();
