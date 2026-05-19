// Canvas Escape game
// Target canvas with id "game"
const canvas = document.getElementById('game');
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playCollision(){ playTone(150, 0.3); }
function playScore(){ playTone(440, 0.1); }
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Player square
const player = {x: canvas.width/2, y: canvas.height-50, size: 20, speed: 4, trail: []};
let keys = {};
window.addEventListener('keydown', e=>keys[e.key]=true);
window.addEventListener('keyup', e=>keys[e.key]=false);
// Resume audio context on first user interaction
function resumeAudio(){ audioCtx.resume(); }
window.addEventListener('click', resumeAudio, {once:true});
window.addEventListener('keydown', resumeAudio, {once:true});

// Obstacles (circles)
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 90; // frames
let gameSpeed = 2;
let score = 0;
let gameOver = false;

// Starfield background
const stars = [];
const maxStars = 100;
function spawnStar(){
  const x = Math.random() * canvas.width;
  const y = -5;
  const size = Math.random() * 2 + 1;
  const speed = Math.random() * 0.5 + 0.2;
  stars.push({x, y, size, speed});
}
function updateStars(){
  // move stars
  for(let i = stars.length - 1; i >= 0; i--){
    const s = stars[i];
    s.y += s.speed * gameSpeed;
    if(s.y > canvas.height){
      stars.splice(i,1);
    }
  }
  // maintain count
  while(stars.length < maxStars){
    spawnStar();
  }
}

function spawnObstacle(){
  const radius = 15 + Math.random()*15;
  const x = Math.random()*(canvas.width-2*radius)+radius;
  const hue = Math.floor(Math.random()*360);
  const color = `hsl(${hue},70%,60%)`;
  obstacles.push({x, y:-radius, r:radius, color});
}

function update(){
  if(gameOver) return;
  // move player
  if(keys.ArrowLeft||keys.a) player.x -= player.speed;
  if(keys.ArrowRight||keys.d) player.x += player.speed;
  if(keys.ArrowUp||keys.w) player.y -= player.speed;
  if(keys.ArrowDown||keys.s) player.y += player.speed;
  // keep inside canvas
  player.x = Math.max(0, Math.min(canvas.width-player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height-player.size, player.y));

  // obstacles
  obstacleTimer++;
  if(obstacleTimer > obstacleInterval){
    spawnObstacle();
    obstacleTimer = 0;
  }
  // move obstacles down
  for(let i=obstacles.length-1;i>=0;i--){
    const o = obstacles[i];
    o.y += gameSpeed;
    // remove off-screen
    if(o.y - o.r > canvas.height){
    obstacles.splice(i,1);
    score++;
    playScore();
  }
    // collision
    const closestX = Math.max(o.x - o.r, Math.min(player.x+player.size/2, o.x + o.r));
    const closestY = Math.max(o.y - o.r, Math.min(player.y+player.size/2, o.y + o.r));
    const distX = (player.x+player.size/2) - closestX;
    const distY = (player.y+player.size/2) - closestY;
    if(Math.hypot(distX, distY) < o.r){
      playCollision();
      gameOver = true;
    }
  }
  // gradually increase speed
  gameSpeed += 0.0005;
}

function draw(){
  // background gradient
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0, '#0d0d2b');
  bgGrad.addColorStop(1, '#1a1a40');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // player trail (fading squares)
  ctx.save();
  ctx.globalAlpha = 0.3;
  for(let i=player.trail.length-1;i>=0;i--){
    const p = player.trail[i];
    const alpha = (i+1)/player.trail.length * 0.3;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#4682b4';
    ctx.fillRect(p.x, p.y, player.size, player.size);
  }
  ctx.restore();

  // player with rounded corners and slight glow
  ctx.save();
  ctx.shadowColor = 'rgba(70,130,180,0.6)';
  ctx.shadowBlur = 8;
  // radial gradient for player
  const pGrad = ctx.createRadialGradient(
    player.x + player.size/2,
    player.y + player.size/2,
    player.size*0.2,
    player.x + player.size/2,
    player.y + player.size/2,
    player.size/2
  );
  pGrad.addColorStop(0, '#6fa8dc');
  pGrad.addColorStop(1, '#4682b4');
  ctx.fillStyle = pGrad;
  const radius = 4;
  ctx.beginPath();
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.size - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.size, player.y, player.x + player.size, player.y + radius);
  ctx.lineTo(player.x + player.size, player.y + player.size - radius);
  ctx.quadraticCurveTo(player.x + player.size, player.y + player.size, player.x + player.size - radius, player.y + player.size);
  ctx.lineTo(player.x + radius, player.y + player.size);
  ctx.quadraticCurveTo(player.x, player.y + player.size, player.x, player.y + player.size - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // draw stars (background)
  ctx.fillStyle = 'white';
  stars.forEach(s=>{
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  // obstacles with stored colors and subtle shadow
  obstacles.forEach(o=>{
    ctx.fillStyle = o.color;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.r, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });
  // UI
  ctx.fillStyle = 'white';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score,10,20);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ffdd57';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
loop();
