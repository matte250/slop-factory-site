// Canvas Escape game with enhanced graphics
const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas with id "game" not found');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 400;
canvas.height = canvas.clientHeight || 600;

// star field for background
const starCount = 80;
const stars = [];
function initStars(){
  for(let i=0;i<starCount;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*2+0.5
    });
  }
}
initStars();

// Player
const player = {x: canvas.width/2-15, y: canvas.height-60, w:30, h:30, vx:0, vy:0};
const speed = 4;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
  osc.stop(audioCtx.currentTime + duration/1000);
}
function playBoost(){ playTone(400, 120); }
function playCollision(){ playTone(100, 300); }
function playGameOver(){ playTone(60, 500); }
const boost = -8;
const gravity = 0.3;

// Obstacles
let obstacles = [];
function addObstacle(){
  const w = 50+Math.random()*100;
  const gap = 80+Math.random()*120;
  const x = Math.random()*(canvas.width-w);
  obstacles.push({x, y:-gap, w, h:gap, speed:2+Math.random()*2});
}
let obstacleTimer=0;

function update(){
  // player movement
  if (keys['ArrowLeft']) player.vx = -speed;
  else if (keys['ArrowRight']) player.vx = speed;
  else player.vx = 0;
  if (keys['Space']){
    player.vy = boost;
    playBoost();
  }

  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;
  // bounds
  if (player.x<0) player.x=0;
  if (player.x+player.w>canvas.width) player.x=canvas.width-player.w;
  // lose if falls below screen
  if (player.y+player.h>canvas.height) gameOver();

  // obstacles move down
  obstacles.forEach(o=>{o.y+=o.speed});
  // remove off‑screen
  obstacles = obstacles.filter(o=>o.y<canvas.height);

  // spawn
  obstacleTimer++; if(obstacleTimer>120){obstacleTimer=0; addObstacle();}

  // collision detection
  for (let o of obstacles){
    if (player.x < o.x+o.w && player.x+player.w > o.x &&
        player.y < o.y+o.h && player.y+player.h > o.y) {
      playCollision();
      gameOver();
    }
  }
}

function draw(){
  // background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  // player with radial gradient
  const pGrad = ctx.createRadialGradient(
    player.x + player.w/2, player.y + player.h/2, 5,
    player.x + player.w/2, player.y + player.h/2, player.w/2);
  pGrad.addColorStop(0, '#00ffff');
  pGrad.addColorStop(1, '#0066ff');
  ctx.fillStyle = pGrad;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // obstacles with gradient and rotation
  obstacles.forEach(o=>{
    ctx.save();
    ctx.translate(o.x + o.w/2, o.y + o.h/2);
    const angle = (Date.now() / 1000) % (Math.PI*2);
    ctx.rotate(angle);
    const oGrad = ctx.createLinearGradient(-o.w/2, 0, o.w/2, 0);
    oGrad.addColorStop(0, '#ff6600');
    oGrad.addColorStop(1, '#990000');
    ctx.fillStyle = oGrad;
    ctx.fillRect(-o.w/2, -o.h/2, o.w, o.h);
    ctx.restore();
  });
}

let animationId;
function loop(){
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}
function gameOver(){
  cancelAnimationFrame(animationId);
  playGameOver();
  alert('Game Over');
  // reset
  player.x = canvas.width/2-15; player.y = canvas.height-60; player.vx=0; player.vy=0;
  obstacles=[]; obstacleTimer=0; animationId=requestAnimationFrame(loop);
}

const keys={};
window.addEventListener('keydown',e=>{keys[e.key]=true;});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

animationId = requestAnimationFrame(loop);
