// Minimal Pixel Runner game – enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Set canvas size (fallback to 800×200)
const W = canvas.width = canvas.clientWidth || 800;
const H = canvas.height = canvas.clientHeight || 200;
// Sky gradient (light blue to deeper blue)
const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
skyGrad.addColorStop(0, '#87CEFA');
skyGrad.addColorStop(1, '#1E90FF');

// Game settings
const GRAVITY = 0.6;
// Stars for background
const STAR_COUNT = 100;
const stars = [];
function initStars(){
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({x:Math.random()*W, y:Math.random()*H*0.5, r:Math.random()*1.5+0.5});
  }
}
initStars();

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJump(){ playTone(440, 0.1); }
function playHit(){ playTone(150, 0.3); }

const JUMP = -12;
const SPEED = 3;
const GROUND_H = 20;

// Player
const player = {x:50, y:H-GROUND_H-10, w:10, h:10, vy:0, onGround:true};

// Obstacles and ground segments
let obstacles = [];
let ground = [];
let offset = 0;
let score = 0;
let dead = false;

function spawnSegment() {
  const segWidth = 40;
  const isGap = Math.random()<0.2; // 20% gaps
  ground.push({x:W+offset, w:segWidth, gap:isGap});
  if (!isGap && Math.random()<0.5) { // block on solid ground
    const blockW = 15;
    const blockH = 30;
    obstacles.push({x:W+offset, y:H-GROUND_H-blockH, w:blockW, h:blockH});
  }
  offset += segWidth;
}

function update() {
  if (dead) return;
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  // ground collision
  const groundY = H - GROUND_H;
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Move obstacles & ground
  for (let g of ground) g.x -= SPEED;
  for (let o of obstacles) o.x -= SPEED;

  // Remove off‑screen
  ground = ground.filter(g=>g.x+g.w>0);
  obstacles = obstacles.filter(o=>o.x+o.w>0);

  // Spawn new segments as needed
  while (offset < W + 200) spawnSegment();

  // Collision with blocks
  for (let o of obstacles) {
    if (player.x < o.x+o.w && player.x+player.w > o.x &&
        player.y < o.y+o.h && player.y+player.h > o.y) {
      dead = true;
    }
  }

  // Falling into a gap
  const aboveGround = ground.find(g=> player.x+player.w/2 >= g.x && player.x+player.w/2 <= g.x+g.w);
  if (aboveGround && aboveGround.gap && player.onGround) dead = true;

  // Scoring
  score += 0.01;
}

function draw() {
  // Sky background
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Ground (brown)
  ctx.fillStyle = '#8B4513';
  for (let g of ground) {
    if (!g.gap) ctx.fillRect(g.x, H - GROUND_H, g.w, GROUND_H);
  }

  // Obstacles (dark red)
  ctx.fillStyle = '#8B0000';
  for (let o of obstacles) ctx.fillRect(o.x, o.y, o.w, o.h);

  // Player (gold circle)
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
  ctx.fill();

  // Score (white)
  ctx.fillStyle = '#FFF';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (dead) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }
}

function loop(){
  update();
  draw();
  if(!dead) requestAnimationFrame(loop);
}

// Control
window.addEventListener('keydown', e=>{ if(e.code==='Space' && player.onGround){ player.vy = JUMP; playJump(); } });

loop();
