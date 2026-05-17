// Minimal endless runner for canvas#game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 200;

// player
const player = {x:50,y:canvas.height-20,w:10,h:10,vy:0,dy:0,slide:false};
const GRAV=0.6, JUMP=-12, SLIDE_TIME=30;
let slideTimer=0;

// obstacles
const obstacles=[];
let frame=0, speed=2, score=0;

function spawn(){
  const w = 10+Math.random()*20;
  const h = 10+Math.random()*30;
  obstacles.push({x:canvas.width, y:canvas.height-h, w, h});
}

function update(){
  // player physics
  if (!player.slide){
    player.vy+=GRAV;
    player.y+=player.vy;
    if (player.y>canvas.height-player.h){player.y=canvas.height-player.h;player.vy=0;}
  } else {
    if (--slideTimer<=0) player.slide=false;
    player.y=canvas.height-player.h*0.5;
  }
  // obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];
    o.x-=speed;
    // collision
    if (o.x<player.x+player.w && o.x+o.w>player.x &&
        o.y<player.y+player.h && o.y+o.h>player.y){
      // game over sound
      playTone(110,0.4);
      setTimeout(()=>{alert('Game Over! Score: '+score); document.location.reload();},200);
      return;
    }
    if(o.x+o.w<0) {obstacles.splice(i,1);score++;}
  }
  if(frame%80===0) spawn();
  frame++;
}

function draw(){
  // background gradient
  const bg = ctx.createLinearGradient(0,0,0,canvas.height);
  bg.addColorStop(0,'#e0f7ff'); // sky
  bg.addColorStop(1,'#90c9e0'); // horizon
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // ground line
  ctx.fillStyle = '#444';
  ctx.fillRect(0,canvas.height-5,canvas.width,5);

  // player (rounded rectangle for better look)
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.h);
  ctx.arcTo(player.x, player.y, player.x + player.w, player.y, player.w/2);
  ctx.arcTo(player.x + player.w, player.y, player.x + player.w, player.y + player.h, player.w/2);
  ctx.arcTo(player.x + player.w, player.y + player.h, player.x, player.y + player.h, player.w/2);
  ctx.arcTo(player.x, player.y + player.h, player.x, player.y, player.w/2);
  ctx.closePath();
  ctx.fill();

  // obstacles (rounded rectangles with subtle shading)
  obstacles.forEach(o=>{
    const grad = ctx.createLinearGradient(0,o.y,0,o.y+o.h);
    grad.addColorStop(0,'#b22222');
    grad.addColorStop(1,'#ff5555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(o.x, o.y + o.h);
    ctx.arcTo(o.x, o.y, o.x + o.w, o.y, o.w/4);
    ctx.arcTo(o.x + o.w, o.y, o.x + o.w, o.y + o.h, o.w/4);
    ctx.arcTo(o.x + o.w, o.y + o.h, o.x, o.y + o.h, o.w/4);
    ctx.arcTo(o.x, o.y + o.h, o.x, o.y, o.w/4);
    ctx.closePath();
    ctx.fill();
  });

  // score text
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score,10,30);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// controls
window.addEventListener('keydown', async e=>{
  // Ensure audio context is running
  if (audioCtx.state !== 'running') await audioCtx.resume();
  if(e.code==='Space' && player.vy===0){
    player.vy=JUMP;
    playTone(440,0.1); // jump sound
  }
  if(e.code==='ArrowDown' && !player.slide){
    player.slide=true;slideTimer=SLIDE_TIME;
    playTone(220,0.1); // slide sound
  }
});

loop();
