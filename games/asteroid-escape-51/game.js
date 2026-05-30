const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration / 1000);
}
canvas.width=canvas.clientWidth;
canvas.height=canvas.clientHeight;

let ship={x:canvas.width/2-10,y:canvas.height-40,w:20,h:20,speed:5,vx:0,vy:0,thrust:-7};
let asteroids=[];
const starCount=80;
const stars=[];
function initStars(){
  for(let i=0;i<starCount;i++){
    stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*2+1});
  }
}
initStars();
let keys={};
let score=0,gameOver=false;
let spawnInterval=1000,lastSpawn=0,lastTime=0;

let gameOverSoundPlayed = false;
function update(dt){
  // move stars for parallax effect
  for(const s of stars){
    s.y+=0.2*dt/16; // slower than asteroids
    if(s.y>canvas.height) {s.y=0; s.x=Math.random()*canvas.width;}
  }
 if(gameOver) return;
 if(keys['ArrowLeft']) ship.x-=ship.speed;
 if(keys['ArrowRight']) ship.x+=ship.speed;
 if(keys['ArrowUp']){ ship.vy=ship.thrust; ship.thrusting=true; } else { ship.thrusting=false; }
 ship.vy+=0.3; // gravity
 ship.y+=ship.vy;
 // bounds
 ship.x=Math.max(0,Math.min(canvas.width-ship.w,ship.x));
 if(ship.y<0){ship.y=0;ship.vy=0;}
 if(ship.y>canvas.height-ship.h){ship.y=canvas.height-ship.h;ship.vy=0;}
 // spawn
if(performance.now()-lastSpawn>spawnInterval){
    asteroids.push({x:Math.random()*(canvas.width-20),y:-20,w:20,h:20,speed:100+score*0.5});
    // spawn sound
    playTone(150,120);
    lastSpawn=performance.now();
    spawnInterval=Math.max(200,spawnInterval*0.99);
  }
 // asteroids update
 for(let i=asteroids.length-1;i>=0;i--){
   const a=asteroids[i];
   a.y+=a.speed*dt/1000;
   if(a.y>canvas.height){gameOver=true;}
   // collision
   if(!(ship.x+ship.w<a.x||ship.x>a.x+a.w||ship.y+ship.h<a.y||ship.y>a.y+a.h)) gameOver=true;
   if(a.y>canvas.height) asteroids.splice(i,1);
 }
  // play game over sound once
  if (gameOver && !gameOverSoundPlayed) {
    playTone(80, 400);
    gameOverSoundPlayed = true;
  }
  score+=dt/1000;
}

function draw(){
  // background gradient
  const bgGrad=ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001020');
  bgGrad.addColorStop(1,'#000000');
  ctx.fillStyle=bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // draw stars
  ctx.fillStyle='white';
  for(const s of stars){
    ctx.globalAlpha = 0.5 + Math.random()*0.5;
    ctx.fillRect(s.x,s.y,s.size,s.size);
  }
  ctx.globalAlpha = 1;


// draw asteroids as glowing circles
  for(const a of asteroids){
    const grad=ctx.createRadialGradient(a.x+a.w/2,a.y+a.h/2,a.w/4,a.x+a.w/2,a.y+a.h/2,a.w/2);
    grad.addColorStop(0,'rgba(200,200,200,0.9)');
    grad.addColorStop(1,'rgba(80,80,80,0.5)');
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.arc(a.x+a.w/2, a.y+a.h/2, a.w/2, 0, Math.PI*2);
    ctx.fill();
  }
  // draw ship (with optional thrust flame)
  ctx.fillStyle='cyan';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w/2, ship.y);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  if(ship.thrusting){
    ctx.fillStyle='orange';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w*0.25, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w*0.75, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w/2, ship.y + ship.h + 10);
    ctx.closePath();
    ctx.fill();
  }
 ctx.fillStyle='yellow';
 ctx.font='16px sans-serif';
 ctx.fillText('Score: '+Math.floor(score),10,20);
 if(gameOver){
   ctx.fillStyle='red';
   ctx.font='30px sans-serif';
   ctx.fillText('Game Over',canvas.width/2-80,canvas.height/2);
 }
}

function loop(ts){
 if(!lastTime) lastTime=ts;
 const dt=ts-lastTime; lastTime=ts;
 update(dt);
 draw();
 if(!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.addEventListener('keydown',e=>{
  keys[e.key]=true;
  // resume audio context on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if(e.key==='ArrowUp'){
    playTone(300,80); // thrust sound
  }
});
window.addEventListener('keyup',e=>keys[e.key]=false);
