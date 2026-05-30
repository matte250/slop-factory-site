// Minimal Space Junk Collector game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Enable glowing effect
ctx.shadowBlur = 8;
ctx.shadowColor = 'rgba(255,255,255,0.7)';

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type='sine', duration=0.1){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Resume audio on first user interaction
window.addEventListener('click',()=>{if(audioCtx.state==='suspended') audioCtx.resume();});
window.addEventListener('keydown',()=>{if(audioCtx.state==='suspended') audioCtx.resume();});

// Ship (triangle shape)
const ship = {x: canvas.width/2, y: canvas.height/2, r: 12, speed: 2, dx:0, dy:0};
let offTimer = 0;
let score = 0;
let gameOver = false;

// Stars background
const stars = [];
for(let i=0;i<100;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.5+0.5});
}

// Entities
const junk = [];
const ast = [];

// Input handling
const keys = {};
window.addEventListener('keydown', e=>{keys[e.key]=true});
window.addEventListener('keyup', e=>{keys[e.key]=false});

function spawn(type){
  const r = type==="junk"?6:14;
  const obj = {
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r,
    dx: (Math.random()-0.5)*(type==="junk"?0.5:2),
    dy: (Math.random()-0.5)*(type==="junk"?0.5:2),
    type
  };
  (type==='junk'?junk:ast).push(obj);
}
setInterval(()=>spawn('junk'),2000);
setInterval(()=>spawn('asteroid'),3000);

function update(){
  if(gameOver) return;
  // move ship
  ship.dx = (keys['ArrowLeft']||keys['a']? -1:0)+(keys['ArrowRight']||keys['d']? 1:0);
  ship.dy = (keys['ArrowUp']||keys['w']? -1:0)+(keys['ArrowDown']||keys['s']? 1:0);
  ship.x += ship.dx*ship.speed;
  ship.y += ship.dy*ship.speed;

  // off‑screen check
  if(ship.x<0||ship.x>canvas.width||ship.y<0||ship.y>canvas.height){
    offTimer++;
    if(offTimer>120) endGame();
  }else offTimer=0;

  // move entities
  const move = arr=>arr.forEach(o=>{o.x+=o.dx; o.y+=o.dy;});
  move(junk); move(ast);

  // collisions
  junk.forEach((j,i)=>{if(dist(ship,j)<ship.r+j.r){score++; playSound(800,'sine',0.08); junk.splice(i,1);}});
  ast.forEach(a=>{if(dist(ship,a)<ship.r+a.r){playSound(200,'sawtooth',0.2); endGame();}});

  // draw background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle = 'white';
  stars.forEach(s=>{ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,2*Math.PI);ctx.fill();});
  // ship as triangle
  drawShip(ship.x, ship.y, ship.r);
  // junk as glowing circles
  junk.forEach(j=>drawGlowingCircle(j.x,j.y,j.r,'lime'));
  // asteroids as red polygons
  ast.forEach(a=>drawAsteroid(a.x,a.y,a.r));
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+score,10,20);

  requestAnimationFrame(update);
}

function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
// Draw ship as a simple triangle pointing up
function drawShip(x,y,r){
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x - r, y + r);
  ctx.lineTo(x + r, y + r);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
}
// Glowing circle for junk
function drawGlowingCircle(x,y,r,col){
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = col;
  ctx.beginPath();
  ctx.arc(x,y,r,0,2*Math.PI);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// Asteroid as irregular polygon
function drawAsteroid(x,y,r){
  const sides = 6 + Math.floor(Math.random()*4);
  ctx.beginPath();
  for(let i=0;i<sides;i++){
    const angle = (i/sides)*2*Math.PI + Math.random()*0.3;
    const radius = r * (0.7 + Math.random()*0.6);
    const vx = x + Math.cos(angle)*radius;
    const vy = y + Math.sin(angle)*radius;
    if(i===0) ctx.moveTo(vx,vy); else ctx.lineTo(vx,vy);
  }
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();
}
function endGame(){gameOver=true; ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='white'; ctx.font='30px sans-serif'; ctx.textAlign='center'; ctx.fillText('Game Over – Score: '+score,canvas.width/2,canvas.height/2);}

requestAnimationFrame(update);
