// Neon Dodge game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// enable additive blending for neon glow
ctx.globalCompositeOperation = 'lighter';

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration=0.1){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.start(now);
  osc.stop(now + duration);
}

// Player
const player = {x: 50, y: canvas.height/2, w: 20, h: 20, vy: 0, gravity: 0.5, jumpStrength: -10, slideHeight: 10};
let isSliding = false;

// Obstacles
const obstacles = [];
const obstacleFreq = 120; // frames
let frame = 0;
let score = 0;

function spawnObstacle(){
  const size = 30 + Math.random()*40;
  const gap = 80; // vertical gap for sliding/jumping
  const type = Math.random()<0.5?'top':'bottom';
  if(type==='top'){
    obstacles.push({x: canvas.width, y:0, w:size, h:canvas.height/2 - gap/2});
    obstacles.push({x: canvas.width, y:canvas.height/2 + gap/2, w:size, h:canvas.height/2 - gap/2});
  }else{
    obstacles.push({x: canvas.width, y:canvas.height/2 - gap/2, w:size, h:canvas.height/2 - gap/2});
    obstacles.push({x: canvas.width, y:canvas.height/2 + gap/2, w:size, h:canvas.height/2 - gap/2});
  }
}

function update(){
  // player physics
  player.vy += player.gravity;
  player.y += player.vy;
  if(isSliding){
    player.h = 10; // slide height
  }else{
    player.h = 20;
  }
  // floor/ceiling
  if(player.y+player.h>canvas.height){
    player.y = canvas.height-player.h; player.vy=0;
  }
  if(player.y<0){ player.y=0; player.vy=0; }

  // obstacles
  if(frame%obstacleFreq===0) spawnObstacle();
  obstacles.forEach(o=> o.x -= 4);
  // remove off‑screen
  while(obstacles.length && obstacles[0].x+obstacles[0].w<0) obstacles.shift();

  // collision
  for(const o of obstacles){
    if(player.x<o.x+o.w && player.x+player.w>o.x && player.y<o.y+o.h && player.y+player.h>o.y){
      playTone(150,0.3); // hit sound
      alert('Game Over! Score: '+Math.floor(score));
      document.location.reload();
      return;
    }
  }

  score += 0.5;
  frame++;
}

function draw(){
  // background gradient (dark to deep blue)
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001');
  bgGrad.addColorStop(1,'#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // helper for neon rounded rect
  const drawNeon = (x,y,w,h,color)=>{
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x+4,y);
    ctx.lineTo(x+w-4,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+4);
    ctx.lineTo(x+w,y+h-4);
    ctx.quadraticCurveTo(x+w,y+h,x+w-4,y+h);
    ctx.lineTo(x+4,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-4);
    ctx.lineTo(x,y+4);
    ctx.quadraticCurveTo(x,y,x+4,y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0; // reset for next draws
  };

  // player neon
  drawNeon(player.x, player.y, player.w, player.h, '#0ff');
  // obstacles neon
  obstacles.forEach(o=> drawNeon(o.x,o.y,o.w,o.h, '#f0f'));

  // score text with slight glow
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#fff';
  ctx.font = '20px monospace';
  ctx.fillText('Score: '+Math.floor(score),10,30);
  ctx.shadowBlur = 0;
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// input
window.addEventListener('keydown',e=>{
  if(e.code==='ArrowUp' || e.code==='Space'){
    player.vy = player.jumpStrength;
    playTone(440,0.08); // jump beep
  }
  if(e.code==='ArrowDown'){
    isSliding = true;
    playTone(330,0.07); // slide beep
  }
});
window.addEventListener('keyup',e=>{
  if(e.code==='ArrowDown') isSliding = false;
});

// start
requestAnimationFrame(loop);
