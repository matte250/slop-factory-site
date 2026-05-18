// Minimal Neon Runner game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 200;

// Player
const player = {x:50, y:canvas.height-40, w:30, h:30, vy:0, onGround:true, slide:false};
const GRAVITY = 0.8, JUMP_SPEED = -15;

// Audio context and helper
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
function playJump(){ playTone(400,0.1); }
function playSlide(){ playTone(200,0.1); }
function playCollision(){ playTone(80,0.5); }

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
const OBSTACLE_FREQ = 120; // frames
const STAR_SPEED = 0.5; // star downward speed

let score = 0;
let gameOver = false;
// star field for background
const STAR_COUNT = 80;
const stars = [];
for(let i=0;i<STAR_COUNT;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*1.5+0.5});
}

function reset() {
  player.y = canvas.height-40; player.vy=0; player.onGround=true; player.slide=false;
  obstacles=[]; obstacleTimer=0; score=0; gameOver=false;
}

function spawnObstacle(){
  const type = Math.random()<0.5 ? 'low' : 'high';
  const obs = {x:canvas.width, w:20, h:type==='low'?30:60, y: type==='low' ? canvas.height-30 : canvas.height-90};
  obstacles.push(obs);
}

function update(){
  if(gameOver) return;
  // player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if(player.y >= canvas.height-40){player.y = canvas.height-40; player.vy=0; player.onGround=true;}

  // obstacles
  obstacleTimer++;
  if(obstacleTimer > OBSTACLE_FREQ){spawnObstacle(); obstacleTimer=0;}
  obstacles.forEach(o=> o.x -= 4);
  obstacles = obstacles.filter(o=> o.x+o.w>0);

  // collision
  for(const o of obstacles){
    const ph = player.slide ? 15 : player.h;
    const py = player.slide ? player.y+15 : player.y;
    if(player.x < o.x+o.w && player.x+player.w > o.x && py < o.y+o.h && py+ph > o.y){
      gameOver = true;
      playCollision();
    }
  }
  // star field motion
  stars.forEach(s=>{
    s.y += STAR_SPEED;
    if(s.y > canvas.height){s.y = 0; s.x = Math.random()*canvas.width;}
  });
  if(!gameOver) score++;
}

// helper to draw rounded neon rectangles
function drawRoundedRect(x,y,w,h,radius,fill){
  ctx.beginPath();
  ctx.moveTo(x+radius, y);
  ctx.lineTo(x+w-radius, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+radius);
  ctx.lineTo(x+w, y+h-radius);
  ctx.quadraticCurveTo(x+w, y+h, x+w-radius, y+h);
  ctx.lineTo(x+radius, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-radius);
  ctx.lineTo(x, y+radius);
  ctx.quadraticCurveTo(x, y, x+radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // star field
  ctx.fillStyle = '#fff';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0, '#0a0a2a');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // neon glow settings
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;

  // player neon as rounded rect
  const ph = player.slide ? 15 : player.h;
  const py = player.slide ? player.y+15 : player.y;
  drawRoundedRect(player.x, py, player.w, ph, 6, '#0ff');

  // obstacles neon (red glow) as rounded rects
  ctx.shadowColor = '#f00';
  obstacles.forEach(o=> drawRoundedRect(o.x, o.y, o.w, o.h, 4, '#f00'));

  // reset shadow for UI text
  ctx.shadowBlur = 0;

  // score UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score, 10, 20);

  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-60, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// input
window.addEventListener('keydown', e=>{
  // ensure audio context is running
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if(e.key === 'ArrowUp' && player.onGround){player.vy = JUMP_SPEED; player.onGround=false; playJump();}
  if(e.key === 'ArrowDown' && player.onGround){player.slide = true; playSlide();}
});
window.addEventListener('keyup', e=>{if(e.key === 'ArrowDown') player.slide = false;});

reset();
loop();
