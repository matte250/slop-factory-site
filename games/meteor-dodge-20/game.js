// Meteor Dodge game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, dur){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Ship
const ship = {w: 60, h: 20, x: canvas.width/2-30, y: canvas.height-30, speed: 5, move: 0};

// Stars (static background)
const stars = [];
for(let i=0;i<100;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height});
}

// Meteors
const meteors = [];
function spawnMeteor(){
  const radius = 15 + Math.random()*10;
  meteors.push({x: Math.random()*canvas.width, y: -radius, r: radius, speed: 2+Math.random()*3});
  // spawn sound
  playBeep(300, 0.05);
}
let lastSpawn = 0;
let startTime = performance.now();
let gameOver = false;
let score = 0;

// Input
document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a') ship.move=-1; if(e.key==='ArrowRight'||e.key==='d') ship.move=1;});
document.addEventListener('keyup',e=>{if((e.key==='ArrowLeft'||e.key==='a')&&ship.move===-1) ship.move=0; if((e.key==='ArrowRight'||e.key==='d')&&ship.move===1) ship.move=0;});
// resume audio on user interaction
window.addEventListener('click',()=>audioCtx.resume());
window.addEventListener('keydown',()=>audioCtx.resume());

function update(dt){
  // move ship
  ship.x += ship.move * ship.speed;
  ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
  // spawn meteors
  if(performance.now()-lastSpawn>800){spawnMeteor(); lastSpawn=performance.now();}
  // update meteors
  for(let i=meteors.length-1;i>=0;i--){
    const m=meteors[i];
    m.y+=m.speed;
    // collision with ship
    if(m.y + m.r > ship.y && m.x > ship.x && m.x < ship.x+ship.w){playBeep(100,0.3); gameOver=true;}
    // meteor hits bottom
    if(m.y - m.r > canvas.height){playBeep(80,0.4); gameOver=true;}
    // remove off-screen
    if(m.y - m.r > canvas.height) meteors.splice(i,1);
  }
  // score
  score = Math.floor((performance.now()-startTime)/1000);
}

function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001020');
  bgGrad.addColorStop(1,'#000000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // star field (static stars)
  ctx.fillStyle = 'white';
  stars.forEach(s=>{ctx.fillRect(s.x, s.y, 1, 1);});

  // ship (triangle)
  ctx.fillStyle='cyan';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y+ship.h);
  ctx.lineTo(ship.x+ship.w/2, ship.y);
  ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
  ctx.closePath();
  ctx.fill();

  // meteors with glow
  meteors.forEach(m=>{
    const grad = ctx.createRadialGradient(m.x, m.y, m.r*0.2, m.x, m.y, m.r);
    grad.addColorStop(0, 'rgba(255,150,0,0.8)');
    grad.addColorStop(1, 'rgba(150,30,0,0.2)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, 2*Math.PI);
    ctx.fill();
  });

  // score
  ctx.fillStyle='yellow';
  ctx.font='20px sans-serif';
  ctx.fillText('Score: '+score,10,30);
}

function loop(timestamp){
  if(gameOver){ctx.fillStyle='red';ctx.font='40px sans-serif';ctx.fillText('Game Over',canvas.width/2-100,canvas.height/2);return;}
  const dt = timestamp - (lastTime||timestamp);
  lastTime=timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
let lastTime;
requestAnimationFrame(loop);
