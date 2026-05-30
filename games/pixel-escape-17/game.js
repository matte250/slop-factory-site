// Simple Pixel Escape game with improved graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 500;
canvas.height = 350;

// Player
const player = {x:50, y:canvas.height/2-5, size:10, speed:3};

// Obstacles
let obstacles = [];
const obstacleWidth = 20;
const obstacleGap = 100; // distance between obstacles
let frameCount = 0;
let score = 0;
let previousScore = 0;
let gameOver = false;

function spawnObstacle(){
  const height = Math.random()* (canvas.height-40) + 20;
  const y = Math.random()<0.5 ? 0 : canvas.height - height;
  const hue = Math.floor(Math.random()*360);
  const color = `hsl(${hue}, 70%, 50%)`;
  obstacles.push({x:canvas.width, y, width:obstacleWidth, height, color});
}

function update(){
  if(gameOver) return;
  frameCount++;
  // move player
  if(keys['ArrowUp']) player.y = Math.max(0, player.y - player.speed);
  if(keys['ArrowDown']) player.y = Math.min(canvas.height-player.size, player.y + player.speed);
  // spawn obstacles
  if(frameCount % 60===0) spawnObstacle();
  // move obstacles
  obstacles.forEach(o=> o.x -= 2);
  // remove offscreen
  obstacles = obstacles.filter(o=> o.x+o.width>0);
  // collision detection
  for(const o of obstacles){
    if(player.x < o.x+o.width && player.x+player.size > o.x &&
       player.y < o.y+o.height && player.y+player.size > o.y){
      gameOver = true;
      playCollisionSound();
    }
  }
  // update score
  score = Math.floor(frameCount/60);
  if(score > previousScore){
    playScoreSound();
    previousScore = score;
  }
}

function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0, '#001d3d'); // dark blue
  bgGrad.addColorStop(1, '#0a9396'); // teal
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // player as a glowing circle
  const playerGrad = ctx.createRadialGradient(
    player.x+player.size/2, player.y+player.size/2, 2,
    player.x+player.size/2, player.y+player.size/2, player.size
  );
  playerGrad.addColorStop(0, '#ffea00'); // bright center
  playerGrad.addColorStop(1, '#ff8000'); // outer glow
  ctx.fillStyle = playerGrad;
  ctx.beginPath();
  ctx.arc(player.x+player.size/2, player.y+player.size/2, player.size/2, 0, Math.PI*2);
  ctx.fill();

  // obstacles with stored pastel colors
  obstacles.forEach(o=>{
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x,o.y,o.width,o.height);
  });

  // score text with drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.shadowBlur = 4;
  ctx.fillStyle='white';
  ctx.font='18px sans-serif';
  ctx.fillText('Score: '+score,10,25);
  ctx.shadowColor = 'transparent'; // reset shadow

  if(gameOver){
    ctx.fillStyle='rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='white';
    ctx.font='32px sans-serif';
    ctx.textAlign='center';
    ctx.fillText('Game Over',canvas.width/2,canvas.height/2);
    ctx.textAlign='start';
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start(audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration + 0.02);
}
function playCollisionSound(){
  playBeep(150, 0.3);
}
function playScoreSound(){
  playBeep(440, 0.08);
}
// Input handling
const keys = {};
window.addEventListener('keydown',e=>{keys[e.key]=true;});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

// start
requestAnimationFrame(loop);
