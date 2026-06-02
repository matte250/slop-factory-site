// Starfield Run game with improved graphics and sound
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Audio setup
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let audioStarted = false;
function startAudio(){ if(!audioStarted){ audioCtx.resume().then(()=>{audioStarted = true;}); } }
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}
function hitSound(){ playTone(200, 0.2); }
function collectSound(){ playTone(600, 0.1); }
function gameOverSound(){ playTone(100, 0.5); }
let gameOverPlayed = false;
// ensure audio starts on first interaction
addEventListener('keydown', e=>{ startAudio(); keys[e.key]=true; });
addEventListener('keyup', e=>{ keys[e.key]=false; });

// Ship definition (triangle)
const ship = {x: canvas.width/2, y: canvas.height-60, size:30, speed:4, health:3};
let keys = {};

// Entities
let asteroids = [];
let orbs = [];
let score = 0;
let lastAst = 0, lastOrb = 0;

// Stars for background
let stars = [];
for(let i=0;i<200;i++){
  stars.push({x:Math.random()*canvas.width, y:Math.random()*canvas.height, r:Math.random()*1.5+0.5, v:0.5+Math.random()*0.5});
}

function spawnAsteroid(){
  const radius = 10+Math.random()*15;
  asteroids.push({x:Math.random()* (canvas.width-radius*2), y:-radius*2, r:radius, v:2+Math.random()*2});
}
function spawnOrb(){
  const radius = 8;
  orbs.push({x:Math.random()* (canvas.width-radius*2), y:-radius*2, r:radius, v:1.5});
}

function rectsCollide(a,b){
  // ship is a triangle approximated by bounding box
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function update(){
  // move ship
  if(keys.ArrowLeft) ship.x -= ship.speed;
  if(keys.ArrowRight) ship.x += ship.speed;
  if(keys.ArrowUp) ship.y -= ship.speed;
  if(keys.ArrowDown) ship.y += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width-ship.size, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height-ship.size, ship.y));

  // spawn
  const now = performance.now();
  if(now-lastAst>800) {spawnAsteroid(); lastAst=now;}
  if(now-lastOrb>1500) {spawnOrb(); lastOrb=now;}

  // update stars
  stars.forEach(s=>{s.y+=s.v; if(s.y>canvas.height){s.y=0; s.x=Math.random()*canvas.width;}});

  // update asteroids
  asteroids.forEach(a=>a.y+=a.v);
  asteroids = asteroids.filter(a=> a.y<canvas.height);
  // update orbs
  orbs.forEach(o=>o.y+=o.v);
  orbs = orbs.filter(o=> o.y<canvas.height);

  // collisions
  asteroids = asteroids.filter(a=>{
    const shipBox={x:ship.x, y:ship.y, w:ship.size, h:ship.size};
    if(rectsCollide(shipBox,a)) {ship.health--; hitSound(); return false;}
    return true;
  });
  orbs = orbs.filter(o=>{
    const shipBox={x:ship.x, y:ship.y, w:ship.size, h:ship.size};
    if(rectsCollide(shipBox,o)) {score+=10; collectSound(); return false;}
    return true;
  });
}

function drawShip(){
  ctx.save();
  ctx.translate(ship.x+ship.size/2, ship.y+ship.size/2);
  ctx.beginPath();
  ctx.moveTo(0, -ship.size/2);
  ctx.lineTo(ship.size/2, ship.size/2);
  ctx.lineTo(-ship.size/2, ship.size/2);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, -ship.size/2, 0, ship.size/2);
  grad.addColorStop(0, '#00ffff');
  grad.addColorStop(1, '#0066ff');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // stars background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle='white';
  stars.forEach(s=>{ctx.fillRect(s.x, s.y, s.r, s.r);});
  // ship
  drawShip();
  // asteroids as circles with gradient
  asteroids.forEach(a=>{
    const grad = ctx.createRadialGradient(a.x+a.r, a.y+a.r, a.r*0.2, a.x+a.r, a.y+a.r, a.r);
    grad.addColorStop(0, '#777777');
    grad.addColorStop(1, '#222222');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x+a.r, a.y+a.r, a.r, 0, Math.PI*2);
    ctx.fill();
  });
  // orbs glow
  orbs.forEach(o=>{
    const grad = ctx.createRadialGradient(o.x+o.r, o.y+o.r, 0, o.x+o.r, o.y+o.r, o.r);
    grad.addColorStop(0, 'rgba(255,255,0,0.9)');
    grad.addColorStop(1, 'rgba(255,255,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(o.x+o.r, o.y+o.r, o.r, 0, Math.PI*2);
    ctx.fill();
  });
  // UI
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+score,10,20);
  ctx.fillText('Health: '+ship.health,10,40);
}

function loop(){
  if(ship.health<=0){
    if(!gameOverPlayed){ gameOverSound(); gameOverPlayed = true; }
    ctx.fillStyle='red';
    ctx.font='48px sans-serif';
    ctx.fillText('Game Over',canvas.width/2-120,canvas.height/2);
    return;
  }
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
  // move ship
  if(keys.ArrowLeft) ship.x -= ship.speed;
  if(keys.ArrowRight) ship.x += ship.speed;
  if(keys.ArrowUp) ship.y -= ship.speed;
  if(keys.ArrowDown) ship.y += ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));

  // spawn
  const now = performance.now();
  if(now-lastAst>800) {spawnAsteroid(); lastAst=now;}
  if(now-lastOrb>1500) {spawnOrb(); lastOrb=now;}

  // update asteroids
  asteroids.forEach(a=>a.y+=a.v);
  asteroids = asteroids.filter(a=> a.y<canvas.height);
  // update orbs
  orbs.forEach(o=>o.y+=o.v);
  orbs = orbs.filter(o=> o.y<canvas.height);

  // collisions
  asteroids = asteroids.filter(a=>{
    if(rectsCollide(ship,a)) {ship.health--; return false;}
    return true;
  });
  orbs = orbs.filter(o=>{
    if(rectsCollide(ship,o)) {score+=10; return false;}
    return true;
  });
}

function draw(){
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars background
  ctx.fillStyle='white';
  for(let i=0;i<100;i++){
    const sx=Math.random()*canvas.width, sy=Math.random()*canvas.height;
    ctx.fillRect(sx,sy,1,1);
  }
  // ship
  ctx.fillStyle='cyan';
  ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
  // asteroids
  ctx.fillStyle='gray';
  asteroids.forEach(a=>ctx.fillRect(a.x,a.y,a.w,a.h));
  // orbs
  ctx.fillStyle='yellow';
  orbs.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
  // UI
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+score,10,20);
  ctx.fillText('Health: '+ship.health,10,40);
}

function loop(){
  if(ship.health<=0){
    ctx.fillStyle='red';
    ctx.font='48px sans-serif';
    ctx.fillText('Game Over',canvas.width/2-120,canvas.height/2);
    return;
  }
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
