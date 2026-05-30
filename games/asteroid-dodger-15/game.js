// Simple Asteroid Dodger game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let ship = {x: canvas.width/2, y: canvas.height/2, angle: 0, vx: 0, vy: 0, radius: 10};
let asteroids = [];
let fuels = [];
let fuel = 100;
// starfield background
const starCount = 200;
const stars = [];
for(let i=0;i<starCount;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: Math.random()*1.5+0.5, speed: Math.random()*0.5+0.2});
}
// thrust particles
const particles = [];
let score = 0;
let lastAsteroid = 0;
let lastFuel = 0;

function spawnAsteroid(){
  const size = Math.random()*30+20;
  const angle = Math.random()*Math.PI*2;
  const speed = Math.random()*1.5+0.5;
  const x = Math.random()<0.5 ? 0 : canvas.width;
  const y = Math.random()*canvas.height;
  const vx = Math.cos(angle)*speed;
  const vy = Math.sin(angle)*speed;
  asteroids.push({x, y, vx, vy, size});
}
function spawnFuel(){
  const x = Math.random()*canvas.width;
  const y = Math.random()*canvas.height;
  fuels.push({x, y, radius: 8});
}

function update(dt){
  // controls
  if(keys['ArrowLeft']) ship.angle -= 0.05;
  if(keys['ArrowRight']) ship.angle += 0.05;
  if(keys['ArrowUp']){
    ship.vx += Math.cos(ship.angle)*0.1; ship.vy += Math.sin(ship.angle)*0.1;
    // generate thrust particles
    for(let i=0;i<3;i++){
      const angle = ship.angle + Math.PI + (Math.random()-0.5)*0.3;
      particles.push({
        x: ship.x - Math.cos(ship.angle)*15,
        y: ship.y - Math.sin(ship.angle)*15,
        vx: Math.cos(angle)*(Math.random()*0.5+0.2),
        vy: Math.sin(angle)*(Math.random()*0.5+0.2),
        life: 300,
        radius: Math.random()*2+1
      });
    }
  }
  ship.x += ship.vx; ship.y += ship.vy;
  // wrap around edges
  if(ship.x < 0) ship.x += canvas.width;
  if(ship.x > canvas.width) ship.x -= canvas.width;
  if(ship.y < 0) ship.y += canvas.height;
  if(ship.y > canvas.height) ship.y -= canvas.height;
  ship.vx *= 0.99; ship.vy *= 0.99; // friction

  // update particles
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.life-=dt;
    if(p.life<=0) particles.splice(i,1);
  }

  // move starfield (parallax)
  stars.forEach(s=>{ s.x -= ship.vx*0.05; s.y -= ship.vy*0.05; if(s.x<0) s.x+=canvas.width; if(s.x>canvas.width) s.x-=canvas.width; if(s.y<0) s.y+=canvas.height; if(s.y>canvas.height) s.y-=canvas.height; });

  // spawn asteroids
  if(Date.now() - lastAsteroid > 1000){ spawnAsteroid(); lastAsteroid = Date.now(); }
  asteroids.forEach(a=>{ a.x += a.vx; a.y += a.vy; });
  asteroids = asteroids.filter(a=> a.x>-50 && a.x<canvas.width+50 && a.y>-50 && a.y<canvas.height+50);

  // collisions with asteroids
  for(let i=asteroids.length-1; i>=0; i--){
    const a = asteroids[i];
    const dx = ship.x - a.x, dy = ship.y - a.y;
    if(Math.hypot(dx, dy) < ship.radius + a.size){
      alert('Game Over! Score: ' + Math.floor(score));
      document.location.reload();
    }
  }

  // spawn fuel cells
  if(Date.now() - lastFuel > 5000){ spawnFuel(); lastFuel = Date.now(); }
  for(let i=fuels.length-1; i>=0; i--){
    const f = fuels[i];
    const d = Math.hypot(ship.x - f.x, ship.y - f.y);
    if(d < ship.radius + f.radius){ fuel += 30; fuels.splice(i,1); }
  }

  fuel -= dt * 0.02;
  if(fuel <= 0){ alert('Out of fuel! Score: ' + Math.floor(score)); document.location.reload(); }
  score += dt * 0.01;
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // starfield
  ctx.fillStyle = 'white';
  stars.forEach(s=>{ ctx.beginPath(); ctx.arc(s.x,s.y,s.radius,0,Math.PI*2); ctx.fill(); });
  // thrust particles (fade out)
  particles.forEach(p=>{
    const alpha = Math.max(p.life/300,0);
    ctx.fillStyle = `rgba(255,165,0,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
    ctx.fill();
  });
  // ship
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // gradient ship
  const shipGrad = ctx.createLinearGradient(-15, -10, 15, 10);
  shipGrad.addColorStop(0,'lightgray');
  shipGrad.addColorStop(1,'white');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(15,0);
  ctx.lineTo(-10,10);
  ctx.lineTo(-5,0);
  ctx.lineTo(-10,-10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // asteroids with shading
  asteroids.forEach(a=>{
    const grad = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.size);
    grad.addColorStop(0,'lightgray');
    grad.addColorStop(1,'gray');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.size, 0, Math.PI*2);
    ctx.fill();
  });
  // fuel cells
  ctx.fillStyle = 'lime';
  fuels.forEach(f=>{ ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI*2); ctx.fill(); });
  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '14px sans-serif';
  ctx.fillText('Fuel: '+Math.floor(fuel),10,20);
  ctx.fillText('Score: '+Math.floor(score),10,40);
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let thrustOsc = null;
function playBeep(freq, dur){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.stop(audioCtx.currentTime + dur);
}

let last = performance.now();
function loop(time){ const dt = time - last; last = time; update(dt); draw(); requestAnimationFrame(loop); }
const keys = {};
window.addEventListener('keydown', e=> {
  keys[e.key]=true;
  if(e.key==='ArrowUp' && !thrustOsc){
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.value = 150;
    thrustOsc.type = 'sawtooth';
    thrustOsc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    thrustOsc.start();
    thrustOsc._gain = gain; // store for later
  }
});
window.addEventListener('keyup', e=> {
  keys[e.key]=false;
  if(e.key==='ArrowUp' && thrustOsc){
    thrustOsc._gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
  }
});
requestAnimationFrame(loop);
