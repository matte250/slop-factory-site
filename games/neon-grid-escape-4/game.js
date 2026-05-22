// Neon Grid Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400; canvas.height = 400;

// Settings
const gridSize = 40; // size of each cell
const playerSize = gridSize * 0.6;
const nodeCount = 8;
const darknessSpeed = 0.3; // pixels per frame
const gameTime = 30; // seconds

// State
let player = { x: canvas.width/2, y: canvas.height/2 };
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
  osc.start();
  osc.stop(audioCtx.currentTime + duration/1000);
}
function playCollect(){ beep(800, 100); }
function playGameOver(){ beep(200, 500); }
function playMove(){ beep(400, 50); }
let nodes = [];
let darkness = 0; // radius from edges
let timeLeft = gameTime;
let lastTime = performance.now();
let collected = 0;
let gameOver = false;

function initNodes(){
  nodes = [];
  for(let i=0;i<nodeCount;i++){
    const x = Math.random()* (canvas.width - gridSize) + gridSize/2;
    const y = Math.random()* (canvas.height - gridSize) + gridSize/2;
    nodes.push({x, y, collected:false});
  }
}
initNodes();

function drawGrid(){
  // Neon grid with glow
  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1;
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 8;
  for(let x=0;x<=canvas.width;x+=gridSize){
    ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();
  }
  for(let y=0;y<=canvas.height;y+=gridSize){
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();
  }
  // Reset shadows
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawPlayer(){
  // Neon player square with glow
  ctx.fillStyle = '#0ff';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 12;
  ctx.fillRect(player.x-playerSize/2, player.y-playerSize/2, playerSize, playerSize);
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function drawNodes(){
  // Neon nodes with glow
  nodes.forEach(n=>{
    if(!n.collected){
      const radius = gridSize*0.2;
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, radius, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

function drawDarkness(){
  const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/2 - darkness, canvas.width/2, canvas.height/2, canvas.width/2);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function update(delta){
  // darkness spreads inward from edges
  darkness += darknessSpeed * (delta/16);
  // timer
  timeLeft -= delta/1000;
  if(timeLeft<=0) {
    if(!gameOver){ playGameOver(); }
    gameOver=true;
  }
  // collision with darkness (if player is within darkness radius from any edge)
  if(player.x < darkness || player.x > canvas.width - darkness || player.y < darkness || player.y > canvas.height - darkness) {
    if(!gameOver){ playGameOver(); }
    gameOver=true;
  }
  // collect nodes
  nodes.forEach(n=>{ if(!n.collected && Math.hypot(player.x-n.x, player.y-n.y)<gridSize*0.3){ n.collected=true; collected++; playCollect(); if(collected===nodeCount){ if(!gameOver){ playGameOver(); } gameOver=true; } } });
}

function drawBackground(){
  // Dark neon background gradient
  const bgGrad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  bgGrad.addColorStop(0,'#00122b');
  bgGrad.addColorStop(1,'#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBackground();
  drawGrid();
  // Use lighter composite for neon effect
  ctx.globalCompositeOperation = 'lighter';
  drawNodes();
  drawPlayer();
  ctx.globalCompositeOperation = 'source-over';
  drawDarkness();
  // UI with neon glow
  ctx.fillStyle = '#0ff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Time: ${timeLeft.toFixed(1)}`,10,20);
  ctx.fillText(`Collected: ${collected}/${nodeCount}`,10,40);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    const msg = collected===nodeCount ? 'You Win!' : 'Game Over';
    ctx.fillText(msg, canvas.width/2, canvas.height/2);
  }
}

function loop(timestamp){
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if(!gameOver){
    update(delta);
    render();
    requestAnimationFrame(loop);
  } else {
    render();
  }
}
requestAnimationFrame(loop);

// Controls
let audioResumed = false;
window.addEventListener('keydown', e=>{
  if(!audioResumed){
    audioCtx.resume();
    audioResumed = true;
  }
  if(gameOver) return;
  const step = gridSize;
  let moved = false;
  switch(e.key){
    case 'ArrowUp': player.y = Math.max(player.y-step, gridSize/2); moved = true; break;
    case 'ArrowDown': player.y = Math.min(player.y+step, canvas.height - gridSize/2); moved = true; break;
    case 'ArrowLeft': player.x = Math.max(player.x-step, gridSize/2); moved = true; break;
    case 'ArrowRight': player.x = Math.min(player.x+step, canvas.width - gridSize/2); moved = true; break;
  }
  if(moved) playMove();
});
