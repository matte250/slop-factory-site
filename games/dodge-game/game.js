// Simple dodge game with enhanced graphics and sounds for canvas#game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq=440,dur=0.2){
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
const w = canvas.width, h = canvas.height;

// player
const player = {w:20,h:20,x: w/2-10, y: h-30, speed:4};
let left=false,right=false;

// circles
const circles=[];
let spawnTimer=0, gameOver=false;

function spawn(){
  const r=10+Math.random()*15;
  circles.push({x:Math.random()*(w-2*r), y:-r, r, v:2+Math.random()*3});
  // play spawn sound
  playBeep(300,0.08);
}
function update(){
  if(gameOver) return;
  // move player
  if(left) player.x-=player.speed;
  if(right) player.x+=player.speed;
  player.x = Math.max(0, Math.min(w-player.w, player.x));
  // spawn circles
  spawnTimer--; if(spawnTimer<=0){spawn(); spawnTimer=60;}
  // update circles
  for(let i=circles.length-1;i>=0;i--){
    const c=circles[i];
    c.y+=c.v;
    // collision
    if(c.y + c.r >= player.y && c.x+ c.r > player.x && c.x - c.r < player.x+player.w){
      gameOver=true;
      // play collision sound
      playBeep(120,0.3);
    }
    // remove offscreen
    if(c.y - c.r > h) circles.splice(i,1);
  }
}
function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,w,h);
  bgGrad.addColorStop(0,'#00172d');
  bgGrad.addColorStop(1,'#003366');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,w,h);

  // player with rounded corners and shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,255,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#00ff00';
  roundedRect(ctx, player.x, player.y, player.w, player.h, 4);
  ctx.fill();
  ctx.restore();

  // circles with radial gradient and slight glow
  for(const c of circles){
    const grad = ctx.createRadialGradient(c.x + c.r, c.y + c.r, c.r*0.2, c.x + c.r, c.y + c.r, c.r);
    grad.addColorStop(0,'rgba(255,100,100,0.9)');
    grad.addColorStop(1,'rgba(150,0,0,0.5)');
    ctx.save();
    ctx.shadowColor = 'rgba(255,0,0,0.5)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x + c.r, c.y + c.r, c.r, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  if(gameOver){
    ctx.fillStyle='white';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over', w/2, h/2);
  }
}

// helper to draw rounded rectangle
function roundedRect(ctx, x, y, width, height, radius){
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
// input handling
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft') left=true; if(e.key==='ArrowRight') right=true;});
window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft') left=false; if(e.key==='ArrowRight') right=false;});
// start
requestAnimationFrame(loop);
