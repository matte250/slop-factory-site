// Simple endless‑runner based on IDEA.md
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width = canvas.clientWidth || 800;
const H = canvas.height = canvas.clientHeight || 400;

// Player
const player = {x: 80, y: H-40, w: 30, h: 30, vy: 0, onGround: true, sliding: false};
const GRAV = 0.8, JUMP = -15, SLIDE_H = 15;

// Obstacles (blocks with a gap)
let obstacles = [];
const OB_SPEED = 4, OB_SPACING = 200;
let lastObsX = W;

// Bits (collectibles)
let bits = [];
const BIT_SPACING = 150;
let lastBitX = W;

let score = 0;
let gameOver = false;
let gameOverPlayed = false;

function spawnObstacle() {
  const gapY = Math.random() * (H - 120) + 60; // gap position
  const gapH = 80; // gap height
  obstacles.push({x: lastObsX + OB_SPACING, w: 30, gapY, gapH});
  lastObsX += OB_SPACING;
}
function spawnBit() {
  const y = Math.random() * (H - 40) + 20;
  bits.push({x: lastBitX + BIT_SPACING, y, r: 8, collected: false});
  lastBitX += BIT_SPACING;
}

function update() {
  if (gameOver) return;
  // player physics
  player.vy += GRAV;
  player.y += player.vy;
  if (player.y + player.h >= H) { // ground
    player.y = H - player.h;
    player.vy = 0;
    player.onGround = true;
  } else player.onGround = false;

  // slide reduces height
  if (player.sliding && player.onGround) player.h = SLIDE_H; else player.h = 30;

  // move obstacles
  for (let i = obstacles.length -1; i >=0; i--) {
    const o = obstacles[i];
    o.x -= OB_SPEED;
    // collision detection
    if (player.x < o.x + o.w && player.x + player.w > o.x) {
      // check if inside gap
      if (player.y < o.gapY || player.y + player.h > o.gapY + o.gapH) {
        gameOver = true;
      }
    }
    if (o.x + o.w < 0) obstacles.splice(i,1);
  }
  // spawn obstacles
  if (lastObsX - obstacles[obstacles.length-1]?.x < OB_SPACING) spawnObstacle();

  // check for game over sound
  checkGameOver();

  // move bits
  updateBits();
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,W,H);

  // Helper for rounded rect
  function roundedRect(x,y,w,h,r,fill){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // Player with glow
  const playerGrad = ctx.createRadialGradient(
    player.x+player.w/2, player.y+player.h/2, player.w/4,
    player.x+player.w/2, player.y+player.h/2, player.w
  );
  playerGrad.addColorStop(0, '#6f6');
  playerGrad.addColorStop(1, '#0f0');
  roundedRect(player.x, player.y, player.w, player.h, 5, playerGrad);

  // Obstacles – dark metal with lighter edges
  obstacles.forEach(o=>{
    ctx.fillStyle = '#222';
    roundedRect(o.x,0,o.w,o.gapY,3,ctx.fillStyle);
    roundedRect(o.x,o.gapY+o.gapH,o.w,H-(o.gapY+o.gapH),3,ctx.fillStyle);
  });

  // Bits – glowing particles
  bits.forEach(b=>{
    if(b.collected) return;
    const grad = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.r);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, '#aa0');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.x,b.y,b.r,0,2*Math.PI);
    ctx.fill();
  });

  // Score text
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score,10,20);

  // Game Over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '36px sans-serif';
    ctx.fillText('Game Over', W/2-80, H/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
function playJump() { playTone(300, 0.1); }
function playCollect() { playTone(600, 0.08); }
function playGameOver() { playTone(100, 0.5); }

// Ensure audio context resumes on user interaction
function resumeAudio(){ if (audioCtx.state === 'suspended') audioCtx.resume(); }

document.addEventListener('keydown', e=>{ resumeAudio(); if (e.code==='Space' && player.onGround) {player.vy = JUMP; playJump();} if (e.code==='ArrowDown') player.sliding = true;});
document.addEventListener('keyup', e=>{if (e.code==='ArrowDown') player.sliding = false;});

// Play sound when collecting a bit
function checkBitCollection(b){
  if (!b.collected && Math.hypot(b.x - player.x, b.y - (player.y+player.h/2)) < b.r + player.w/2) {
    b.collected = true; score++; playCollect();
  }
}

// Modified bit handling in update (replace original loop)
function updateBits(){
  for (let i = bits.length -1; i >=0; i--) {
    const b = bits[i];
    b.x -= OB_SPEED;
    checkBitCollection(b);
    if (b.x + b.r < 0) bits.splice(i,1);
  }
  if (lastBitX - (bits[bits.length-1]?.x||0) < BIT_SPACING) spawnBit();
}

// Game over sound trigger inside update
function checkGameOver(){
  if (gameOver && !gameOverPlayed) {
    playGameOver();
    gameOverPlayed = true;
  }
}

// Replace original update function sections accordingly (will be handled below)

// init first obstacle/bit and start
spawnObstacle();
spawnBit();
loop();
