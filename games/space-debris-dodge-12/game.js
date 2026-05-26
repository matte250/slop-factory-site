// Simple Space Debris Dodge game
// Canvas element must have id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playExplosion(){ playTone(120, 0.3); }
function playScore(){ playTone(600, 0.1); }


// ----- Settings -----
const STAR_COUNT = 100;
const DEBRIS_FREQ = 0.02; // chance per frame
const SHIP_SIZE = 20;
const DEBRIS_SIZE = 30;

// ----- State -----
let stars = [];
let debris = [];
let particles = [];
let score = 0;
let gameOver = false;

// Ship starts in middle bottom
let ship = {x: canvas.width/2, y: canvas.height - SHIP_SIZE*2, w: SHIP_SIZE, h: SHIP_SIZE};

// Initialize stars
for(let i=0;i<STAR_COUNT;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: Math.random()*2+1, speed: Math.random()*0.5+0.2});
}

// Input handling (mouse move & arrow keys)
function handleMove(e){
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  ship.x = Math.max(0, Math.min(canvas.width - ship.w, x - ship.w/2));
  // unlock audio on interaction
  if(audioCtx.state === 'suspended') audioCtx.resume();
}
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('keydown', e=>{
  if(e.key==='ArrowLeft') ship.x = Math.max(0, ship.x-10);
  if(e.key==='ArrowRight') ship.x = Math.min(canvas.width-ship.w, ship.x+10);
  if(audioCtx.state === 'suspended') audioCtx.resume();
});

function update(){
  if(gameOver) return;
  // move stars
  for(let s of stars){
    s.y += s.speed;
    if(s.y>canvas.height) { s.y=0; s.x=Math.random()*canvas.width; }
  }
  // possibly add debris
  if(Math.random()<DEBRIS_FREQ){
    const x = Math.random()*(canvas.width- DEBRIS_SIZE);
    debris.push({x, y:-DEBRIS_SIZE, w:DEBRIS_SIZE, h:DEBRIS_SIZE, speed:2+Math.random()*3, hue: Math.random()*30});
  }
  // move debris
  for(let i=debris.length-1;i>=0;i--){
    const d = debris[i];
    d.y += d.speed;
    // check collision (simple box)
    if(d.x < ship.x+ship.w && d.x+d.w > ship.x && d.y < ship.y+ship.h && d.y+d.h > ship.y){
      // create explosion particles
      for(let i=0;i<30;i++){
        particles.push({
          x: ship.x + ship.w/2,
          y: ship.y + ship.h/2,
          vx: (Math.random()-0.5)*4,
          vy: (Math.random()-0.5)*4,
          radius: Math.random()*3+2,
          life: 30,
          hue: Math.random()*30 + 200 // reddish
        });
      }
      playExplosion();
      gameOver = true;
    }
    // remove if offscreen
    if(d.y>canvas.height) { debris.splice(i,1); score++; playScore(); }
  }
  // update particles
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if(p.life <= 0){
      particles.splice(i,1);
    }
  }
}

function draw(){
  // clear and draw space background gradient
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001d3a');
  bgGrad.addColorStop(1,'#00080f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars with glow effect
  for(let s of stars){
    ctx.beginPath();
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r*2);
    grad.addColorStop(0, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.arc(s.x, s.y, s.r*2, 0, Math.PI*2);
    ctx.fill();
  }
  // ship (glowing triangle)
  const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y+ship.h);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#004400');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y+ship.h);
  ctx.lineTo(ship.x+ship.w/2, ship.y);
  ctx.lineTo(ship.x+ship.w, ship.y+ship.h);
  ctx.closePath();
  ctx.fill();
  // subtle glow
  ctx.shadowColor = 'rgba(0,255,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;
  // debris (colored glowing circles)
  for(let d of debris){
    const grad = ctx.createRadialGradient(d.x + d.w/2, d.y + d.h/2, 0, d.x + d.w/2, d.y + d.h/2, d.w);
    const hue = d.hue !== undefined ? d.hue : 0;
    grad.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.9)`);
    grad.addColorStop(1, `hsla(${hue}, 70%, 30%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(d.x + d.w/2, d.y + d.h/2, d.w/2, 0, Math.PI*2);
    ctx.fill();
  }
  // explosion particles
  for(let p of particles){
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    grad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, ${p.life/30})`);
    grad.addColorStop(1, `hsla(${p.hue}, 80%, 30%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
    ctx.fill();
  }
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score, 10,20);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
// start
requestAnimationFrame(loop);
