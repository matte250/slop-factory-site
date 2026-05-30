// Color Shift Runner – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
let audioCtx;
function initAudio(){
  if(!audioCtx){
    audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  }
}
function playTone(freq, duration=0.1){
  initAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
  osc.stop(audioCtx.currentTime+duration);
}
// resume audio on first interaction
window.addEventListener('click',()=>{initAudio();}, {once:true});
// Helper: draw rounded rectangle
function drawRoundedRect(x,y,w,h,r,fillStyle){
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
  ctx.fillStyle = fillStyle;
  ctx.fill();
}
// Particle system for visual flair
let particles = [];
function spawnParticle(x,y,color){
  for(let i=0;i<8;i++){
    const angle = Math.random()*2*Math.PI;
    const speed = Math.random()*1.5+0.5;
    particles.push({x, y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, size: Math.random()*3+2, life:30, color});
  }
}
function updateParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--; p.size *= 0.96;
    if(p.life<=0) particles.splice(i,1);
  }
}
function drawParticles(){
  particles.forEach(p=>{
    ctx.save();
    ctx.globalAlpha = p.life/30;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
  });
}
canvas.width = canvas.clientWidth || 400;
canvas.height = canvas.clientHeight || 600;

const colors = ['red','green','blue'];
// map color index to tone frequency
const colorFreqs = [261.6, 329.6, 392.0]; // C4, E4, G4
let player = {x: canvas.width/2-15, y: canvas.height-60, w:30, h:30, c:0};
let obstacles = [];
let score = 0;
let speed = 2; // player upward speed (obstacle downward speed)
let spawnTimer = 0;
let gameOver = false;

function cycleColor(){
  player.c = (player.c+1)%colors.length;
  playTone(colorFreqs[player.c]);
}
window.addEventListener('keydown', e=>{ if(e.key==='c') cycleColor(); });

function spawnObstacle(){
  const w = 30 + Math.random()*30; // width 30‑60
  const x = Math.random()*(canvas.width-w);
  const colorIdx = Math.floor(Math.random()*colors.length);
  obstacles.push({x, y:-30, w, h:30, c:colorIdx});
}

function rectIntersect(a,b){
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function update(){
  if(gameOver) return;
  // move player upward (simulated by moving obstacles down)
  player.y -= speed;
  if(player.y < 0) player.y = 0; // keep within top
  // update obstacles
  for(let i=obstacles.length-1;i>=0;i--){
    const o = obstacles[i];
    o.y += speed; // descend
    // collision check
    if(rectIntersect(player,o)){
      if(o.c !== player.c){
        // mismatched color collision – trigger explosion particles and sound
        spawnParticle(o.x+o.w/2, o.y+o.h/2, colors[o.c]);
        playTone(150,0.2); // low tone for loss
        gameOver = true; break;
      }
    }
    // passed player
    if(o.y > canvas.height){
      score++; 
      // celebration particles when obstacle cleared
      spawnParticle(o.x+o.w/2, o.y+o.h/2, colors[o.c]);
      obstacles.splice(i,1);
    }
  }
  // particle update
  updateParticles();
  // spawn logic
  spawnTimer += 1/60;
  if(spawnTimer > 1 + Math.random()){ spawnObstacle(); spawnTimer = 0; }
}

function draw(){
  // gradient background
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#111');
  bgGrad.addColorStop(1,'#333');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // particles
  drawParticles();

  // player (rounded)
  drawRoundedRect(player.x,player.y,player.w,player.h,5,colors[player.c]);

  // obstacles (rounded)
  obstacles.forEach(o=>{
    drawRoundedRect(o.x,o.y,o.w,o.h,4,colors[o.c]);
  });

  // score (drop shadow)
  ctx.fillStyle='rgba(0,0,0,0.7)';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+score,11,21);
  ctx.fillStyle='white';
  ctx.fillText('Score: '+score,10,20);

  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='white';
    ctx.font='30px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.textAlign='start';
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}

// start
loop();
