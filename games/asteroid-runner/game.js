// Asteroid Runner – minimal implementation
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 600;

// Stars for background
const stars = [];
const STAR_COUNT = 100;
for(let i=0;i<STAR_COUNT;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1});
}
function updateStars(){
  for(const s of stars){
    s.y += 0.5; // moving down
    if(s.y>canvas.height) { s.y=0; s.x=Math.random()*canvas.width; }
  }
}

// Ship state
const ship = {x: canvas.width/2, y: canvas.height-50, angle: 0, vx:0, vy:0, radius:10};
let laserCharges = 5;
const lasers = [];
const asteroids = [];
let lastAsteroid = 0;
let gameOver = false;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
  osc.start();
  osc.stop(audioCtx.currentTime+duration);
}
function playLaser(){ playTone(800, 0.1); }
function playExplosion(){ playTone(200, 0.3); }
function playGameOver(){ playTone(100, 0.5); }
// Resume audio on user interaction
window.addEventListener('click',()=>audioCtx.resume(),{once:true});
window.addEventListener('keydown',()=>audioCtx.resume(),{once:true});

// Input handling
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key]=true; if(e.key===' ' && laserCharges>0){fireLaser(); laserCharges--;}});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

function fireLaser(){
  const speed = 6;
  lasers.push({x: ship.x, y: ship.y, dx: Math.cos(ship.angle)*speed, dy: Math.sin(ship.angle)*speed, ttl: 60});
  playLaser();
}

function spawnAsteroid(){
  const r = 15+Math.random()*15;
  const x = Math.random()*canvas.width;
  const speed = 1+Math.random()*1.5;
  const angle = Math.random()*Math.PI*2;
  const rotSpeed = (Math.random()-0.5)*0.02; // small rotation
  asteroids.push({x, y:-r, r, dx:0, dy:speed, angle, rotSpeed});
}

function update(){
  if(gameOver) return;
  // Ship controls
  if(keys['ArrowLeft']) ship.angle -= 0.07;
  if(keys['ArrowRight']) ship.angle += 0.07;
  if(keys['ArrowUp']){ // thrust
    const thrust = 0.2;
    ship.vx += Math.cos(ship.angle)*thrust;
    ship.vy += Math.sin(ship.angle)*thrust;
  }
  // Apply velocity
  ship.x += ship.vx; ship.y += ship.vy;
  // friction
  ship.vx *= 0.99; ship.vy *= 0.99;
  // Keep inside bounds
  if(ship.x<0) ship.x+=canvas.width; if(ship.x>canvas.width) ship.x-=canvas.width;
  if(ship.y<0) ship.y+=canvas.height; if(ship.y>canvas.height) ship.y-=canvas.height;

  // Update stars background
  updateStars();

  // Lasers
  for(let i=lasers.length-1;i>=0;i--){
    const l=lasers[i];
    l.x+=l.dx; l.y+=l.dy; l.ttl--;
    if(l.ttl<=0) lasers.splice(i,1);
  }

  // Asteroids
  const now = Date.now();
  if(now-lastAsteroid>1000){spawnAsteroid(); lastAsteroid=now;}
  for(let i=asteroids.length-1;i>=0;i--){
    const a=asteroids[i];
    a.x+=a.dx; a.y+=a.dy;
    a.angle += a.rotSpeed || 0; // rotate asteroid
    if(a.y - a.r > canvas.height){asteroids.splice(i,1); continue;}
    // ship collision
    const dx=ship.x-a.x, dy=ship.y-a.y;
    if(Math.hypot(dx,dy)<a.r+ship.radius){gameOver=true;}
    // laser collision
    for(let j=lasers.length-1;j>=0;j--){
      const l=lasers[j];
      const dxl=l.x-a.x, dyl=l.y-a.y;
      if(Math.hypot(dxl,dyl)<a.r){asteroids.splice(i,1); lasers.splice(j,1); break;}
    }
  }
}

function draw(){
  // Black background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Stars background
  ctx.fillStyle='white';
  stars.forEach(s=>{ctx.beginPath(); ctx.arc(s.x,s.y,s.size,0,Math.PI*2); ctx.fill();});
  // Ship with gradient
  const shipGrad = ctx.createLinearGradient(-10,-10,15,0);
  shipGrad.addColorStop(0,'cyan');
  shipGrad.addColorStop(1,'white');
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(15,0);
  ctx.lineTo(-10,10);
  ctx.lineTo(-10,-10);
  ctx.closePath();
  ctx.fillStyle=shipGrad;
  ctx.fill();
  ctx.restore();
  // Lasers with glow
  const laserGrad = ctx.createRadialGradient(0,0,0,0,0,4);
  laserGrad.addColorStop(0,'rgba(255,0,0,0.9)');
  laserGrad.addColorStop(1,'rgba(255,0,0,0)');
  ctx.strokeStyle='rgba(255,0,0,0.8)';
  ctx.lineWidth=3;
  lasers.forEach(l=>{ctx.beginPath(); ctx.moveTo(l.x,l.y); ctx.lineTo(l.x-l.dx*2,l.y-l.dy*2); ctx.stroke();});
  // Asteroids with radial gradient
  asteroids.forEach(a=>{
    const grad = ctx.createRadialGradient(a.x,a.y, a.r*0.3, a.x,a.y, a.r);
    grad.addColorStop(0,'darkgray');
    grad.addColorStop(1,'black');
    ctx.beginPath();
    ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
    ctx.fillStyle=grad;
    ctx.fill();
    // optional rotation visual – draw a line
    ctx.save();
    ctx.translate(a.x,a.y);
    ctx.rotate(a.angle);
    ctx.strokeStyle='rgba(255,255,255,0.3)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(a.r,0);
    ctx.stroke();
    ctx.restore();
  });
  // UI
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Laser: '+laserCharges,10,20);
  if(gameOver){
    ctx.fillStyle='red';
    ctx.font='48px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-120, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
loop();
