// Escape the Grid game – targets <canvas id="game"></canvas>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 400;
canvas.height = canvas.clientHeight || 600;

// player
const player = {x: canvas.width/2-10, y: canvas.height-40, w:20, h:20, speed:4};

// walls
const walls = [];
let wallTimer = 0;
let wallInterval = 90; // frames
let speed = 2; // scroll speed
let score = 0;
let gameOver = false;

// input handling
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

const keys = {};
window.addEventListener('keydown', e=>keys[e.key]=true);
window.addEventListener('keyup', e=>keys[e.key]=false);

function spawnWall(){
  const gap = 80; // width of gap
  const wallW = canvas.width;
  const wallH = 20;
  const gapX = Math.random()*(canvas.width-gap);
  walls.push({x:0, y:-wallH, w:gapX, h:wallH}); // left block
  walls.push({x:gapX+gap, y:-wallH, w:canvas.width-(gapX+gap), h:wallH}); // right block
  // play a low tone for wall spawn
  playTone(150, 0.1);
}

function update(){
  if(gameOver) return;
  // player movement (grid aligned to 20px)
  if(keys['ArrowLeft'])  player.x -= player.speed;
  if(keys['ArrowRight']) player.x += player.speed;
  if(keys['ArrowUp'])    player.y -= player.speed;
  if(keys['ArrowDown'])  player.y += player.speed;

  // keep player within canvas bounds
  player.x = Math.max(0, Math.min(canvas.width-player.w, player.x));
  player.y = Math.max(0, Math.min(canvas.height-player.h, player.y));

  // spawn walls
  wallTimer++;
  if(wallTimer>=wallInterval){
    spawnWall();
    wallTimer=0;
    // gradually increase difficulty
    if(wallInterval>30) wallInterval-=1;
    speed+=0.02;
  }

  // move walls down
  for(let i=walls.length-1;i>=0;i--){
    walls[i].y+=speed;
    // remove off‑screen walls
    if(walls[i].y>canvas.height) walls.splice(i,1);
  }

  // collision detection
  for(const w of walls){
    if( rectsCollide(player, w) ){
      playTone(300, 0.2); // collision sound
      gameOver = true;
    }
  }
  if(player.x<0||player.y<0||player.x+player.w>canvas.width||player.y+player.h>canvas.height){
    playTone(300, 0.2);
    gameOver = true;
  }

  if(!gameOver) score++;
}

function rectsCollide(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0, '#111');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // helper for rounded rectangles
  function roundedRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  // draw player – neon green with glow
  ctx.save();
  ctx.shadowColor = '#0f0';
  ctx.shadowBlur = 10;
  roundedRect(player.x, player.y, player.w, player.h, 4);
  ctx.fillStyle = '#0f0';
  ctx.fill();
  ctx.restore();

  // draw walls – dark red bars with slight gradient
  for(const w of walls){
    const wallGrad = ctx.createLinearGradient(0, w.y, 0, w.y + w.h);
    wallGrad.addColorStop(0, '#550000');
    wallGrad.addColorStop(1, '#220000');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(w.x, w.y, w.w, w.h);
  }

  // draw score – crisp white with subtle shadow
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 2;
  ctx.fillText('Score: '+score, 10, 10);
  ctx.shadowBlur = 0;

  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
