// Simple endless runner for canvas with id "game"
// Enhanced graphics: background gradient, rounded platforms, radial ball shading, spike gradient
const canvas = document.getElementById('game');
// Audio setup
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
function playTone(freq, type, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime+0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
  osc.start();
  osc.stop(audioCtx.currentTime+duration);
}
function playJump(){ playTone(400,'sine',0.1);} 
function playGameOver(){ playTone(100,'sawtooth',0.5);} 
// resume audio on first user interaction
canvas.addEventListener('pointerdown',()=>{ if(audioCtx.state==='suspended') audioCtx.resume(); },{once:true});
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player (ball)
const player = {x: 80, y: canvas.height/2, r: 20, vy: 0};
const GRAVITY = 0.5, JUMP = -12;

// Platform and spike generators
let platforms = [], spikes = [];
const PLAT_HEIGHT = 20, PLAT_MIN_W = 80, PLAT_MAX_W = 200;
const GAP_MIN = 150, GAP_MAX = 300;
let lastX = 0;

function addSegment() {
  const w = PLAT_MIN_W + Math.random() * (PLAT_MAX_W-PLAT_MIN_W);
  const y = canvas.height/2 + (Math.random()-0.5)*200;
  platforms.push({x: lastX, y: Math.min(Math.max(y, PLAT_HEIGHT), canvas.height-PLAT_HEIGHT), w, h: PLAT_HEIGHT});
  // occasional red spike on top
  if (Math.random()<0.3) {
    const sw = 20, sh = 30;
    spikes.push({x: lastX + w/2 - sw/2, y: platforms[platforms.length-1].y - sh, w: sw, h: sh});
  }
  lastX += w + GAP_MIN + Math.random()*(GAP_MAX-GAP_MIN);
}
// initial segments
for(let i=0;i<5;i++) addSegment();

function jump(){ player.vy = JUMP; playJump(); }
canvas.addEventListener('pointerdown', jump);

let gameOver = false;
// Helper: draw rounded rectangle
function drawRoundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
function loop(){
  if(gameOver) return;
  // physics
  player.vy += GRAVITY; player.y += player.vy;
  // collision with platforms (simple floor)
  platforms.forEach(p=>{
    if(player.x+player.r>p.x && player.x-player.r<p.x+p.w && player.y+player.r>p.y && player.y-player.r<p.y+p.h && player.vy>0){
      player.y = p.y - player.r; player.vy = 0;
    }
  });
  // collision with spikes
  for(const s of spikes){
    if(player.x+player.r> s.x && player.x-player.r< s.x+s.w && player.y+player.r> s.y && player.y-player.r< s.y+s.h){
      gameOver = true; break;
    }
  }
  // fail if falls off screen
  if(player.y - player.r > canvas.height) gameOver = true;
  // scroll world leftward
  const speed = 4;
  platforms.forEach(p=> p.x -= speed);
  spikes.forEach(s=> s.x -= speed);
  // remove off‑screen
  while(platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
  while(spikes.length && spikes[0].x + spikes[0].w < 0) spikes.shift();
  // add new segment if needed
  if(lastX - speed < canvas.width) { addSegment(); }
  lastX -= speed;
  // render
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#87CEEB'); // sky
  bgGrad.addColorStop(1,'#4682B4'); // deeper
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw platforms with rounded corners
  ctx.fillStyle = '#555';
  platforms.forEach(p=> drawRoundedRect(p.x, p.y, p.w, p.h, 10));
  // draw spikes with gradient
  spikes.forEach(s=> {
    const spikeGrad = ctx.createLinearGradient(s.x, s.y, s.x, s.y+s.h);
    spikeGrad.addColorStop(0,'#ff6666');
    spikeGrad.addColorStop(1,'#990000');
    ctx.fillStyle = spikeGrad;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y+s.h);
    ctx.lineTo(s.x+s.w/2, s.y);
    ctx.lineTo(s.x+s.w, s.y+s.h);
    ctx.closePath();
    ctx.fill();
  });
  // draw player with radial shading
  const ballGrad = ctx.createRadialGradient(player.x - player.r/3, player.y - player.r/3, player.r/5, player.x, player.y, player.r);
  ballGrad.addColorStop(0,'white');
  ballGrad.addColorStop(0.5,'steelblue');
  ballGrad.addColorStop(1,'black');
  ctx.fillStyle = ballGrad;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI*2);
  ctx.fill();
  if(!gameOver) requestAnimationFrame(loop);
  else { ctx.fillStyle='black'; ctx.font='30px sans-serif'; ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2); }
}
requestAnimationFrame(loop);
