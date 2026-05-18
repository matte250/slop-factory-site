const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
canvas.width=800;canvas.height=400;
// sound assets
const jumpSound = new Audio('https://cdn.jsdelivr.net/gh/jshjohnson/AudioFiles/jump.wav');
const crashSound = new Audio('https://cdn.jsdelivr.net/gh/jshjohnson/AudioFiles/crash.wav');
const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/jshjohnson/AudioFiles/bg.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
bgMusic.play();
let player={x:100,y:canvas.height-50,w:30,h:30,vy:0,onGround:false};
const keys={};
document.addEventListener('keydown',e=>keys[e.key]=true);
document.addEventListener('keyup',e=>keys[e.key]=false);
let barriers=[];let frame=0;let speed=2;let anim;
function spawnBarrier(){
  const gap=80;
  const gapY=Math.random()*(canvas.height-gap);
  // Top barrier
  barriers.push({x:canvas.width,y:0,w:30,h:gapY,angle:0,angularSpeed:(Math.random()>0.5?1:-1)*0.03});
  // Bottom barrier
  barriers.push({x:canvas.width,y:gapY+gap,w:30,h:canvas.height-(gapY+gap),angle:0,angularSpeed:(Math.random()>0.5?1:-1)*0.03});
}
function update(){
  if((keys['ArrowLeft']||keys['a'])&&player.x>0)player.x-=4;
  if((keys['ArrowRight']||keys['d'])&&player.x+player.w<canvas.width)player.x+=4;
  if((keys['ArrowUp']||keys['w']||keys[' '])&&player.onGround){player.vy=-8;player.onGround=false;jumpSound.currentTime=0;jumpSound.play();}
  player.vy+=0.4;player.y+=player.vy;
  if(player.y+player.h>=canvas.height){player.y=canvas.height-player.h;player.vy=0;player.onGround=true;}
  if(frame%120===0)spawnBarrier();
  // move and rotate barriers
  barriers.forEach(b=>{b.x-=speed;b.angle+=b.angularSpeed;});
  barriers=barriers.filter(b=>b.x+b.w>0);
  // collision detection (approximate using bounding box)
  for(let b of barriers){
    // compute barrier's AABB after rotation (simple approximation: use original w/h)
    if(player.x<b.x+b.w&&player.x+player.w>b.x&&player.y<b.y+b.h&&player.y+player.h>b.y){
      cancelAnimationFrame(anim);
      crashSound.currentTime=0;
      crashSound.play();
      alert('Game Over');
      return;}
  }
  // draw background gradient
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bgGrad=ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001');
  bgGrad.addColorStop(1,'#004');
  ctx.fillStyle=bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw player with neon glow
  ctx.save();
  ctx.fillStyle='#0ff';
  ctx.shadowColor='#0ff';
  ctx.shadowBlur=15;
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.restore();
  // draw rotating barriers with neon glow
  ctx.save();
  ctx.fillStyle='#f0f';
  ctx.shadowColor='#f0f';
  ctx.shadowBlur=12;
  barriers.forEach(b=>{
    ctx.save();
    ctx.translate(b.x + b.w/2, b.y + b.h/2);
    ctx.rotate(b.angle);
    ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
    ctx.restore();
  });
  ctx.restore();
  frame++;anim=requestAnimationFrame(update);
}
anim=requestAnimationFrame(update);
