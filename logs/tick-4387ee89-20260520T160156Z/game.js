// Simple Space Debris Dodge game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Sound effects
const collisionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short silent placeholder beep
const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
bgMusic.loop = true;
bgMusic.volume = 0.2;
bgMusic.play();
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Ship (drawn as a triangle)
const ship = {x: canvas.width/2, y: canvas.height-50, w:30, h:30, speed:4, shield:3};
const keys = {};
window.addEventListener('keydown',e=>keys[e.key]=true);
window.addEventListener('keyup',e=>keys[e.key]=false);

// Debris pool
let debris = [];
let particles = [];
function spawnDebris(){
  const size = Math.random()*20+10;
  debris.push({x: Math.random()*canvas.width, y:-size, w:size, h:size, speed:2+Math.random()*3});
}
function spawnParticle(x, y, color){
  const count = 5 + Math.random()*5|0;
  for(let i=0;i<count;i++){
    particles.push({
      x: x,
      y: y,
      vx: (Math.random()-0.5)*2,
      vy: (Math.random()-0.5)*2,
      size: Math.random()*2+1,
      color: color,
      life: 30,
      maxLife: 30
    });
  }
}
let spawnTimer=0;

let score=0, lastTime=0;
function update(dt){
  // Move ship
  if(keys.ArrowLeft) ship.x-=ship.speed;
  if(keys.ArrowRight) ship.x+=ship.speed;
  if(keys.ArrowUp) ship.y-=ship.speed;
  if(keys.ArrowDown) ship.y+=ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));

  // Spawn debris
  spawnTimer+=dt;
  if(spawnTimer>500){ spawnDebris(); spawnTimer=0; }

  // Move debris
  debris.forEach(d=> d.y+=d.speed);
  // Remove off‑screen
  debris = debris.filter(d=> d.y<canvas.height+ d.h);

  // Update particles (move & fade)
  particles.forEach(p=> {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  particles = particles.filter(p=> p.life>0);

  // Collision detection
  debris.forEach(d=>{
    if(!(d.x>ship.x+ship.w || d.x+d.w<ship.x || d.y>ship.y+ship.h || d.y+d.h<ship.y)){
      ship.shield--;
      // play collision sound
      collisionSound.currentTime = 0;
      collisionSound.play();
      // create explosion particles
      spawnParticle(d.x + d.w/2, d.y + d.h/2, 'orange');
      d.y=canvas.height+1; // remove this debris
    }
  });

  // Update score
  score+=dt/1000;
}

function draw(){
  // Background gradient
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#001d3a');
  grad.addColorStop(1,'#000014');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Ship (triangle)
  ctx.fillStyle='cyan';
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w/2, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();

  // Debris (circles)
  ctx.fillStyle='gray';
  debris.forEach(d=> {
    ctx.beginPath();
    ctx.arc(d.x + d.w/2, d.y + d.h/2, d.w/2, 0, Math.PI*2);
    ctx.fill();
  });

  // Particles
  particles.forEach(p=> {
    ctx.globalAlpha = Math.max(p.life/ p.maxLife, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // UI
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText(`Score: ${Math.floor(score)}`,10,20);
  ctx.fillText(`Shield: ${ship.shield}`,10,40);
}

function loop(timestamp){
  const dt = timestamp - (lastTime||timestamp);
  lastTime = timestamp;
  update(dt);
  draw();
  if(ship.shield>0) requestAnimationFrame(loop);
  else { ctx.fillStyle='red'; ctx.fillText('Game Over', canvas.width/2-40, canvas.height/2); }
}
requestAnimationFrame(loop);
