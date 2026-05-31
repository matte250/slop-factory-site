// Simple endless runner for canvas with id "game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 200;

// Game config
const GRAVITY = 0.5;
const JUMP_STRENGTH = -10;
const SPEED = 2;
const OBSTACLE_FREQ = 120; // frames
const TOKEN_FREQ = 300;
let frame = 0;
let score = 0;
let speed = SPEED;

// Load sounds (public domain URLs or data URIs)
const jumpSound = new Audio('https://assets.codepen.io/2102846/jump.wav');
const tokenSound = new Audio('https://assets.codepen.io/2102846/coin.wav');
const gameOverSound = new Audio('https://assets.codepen.io/2102846/gameover.wav');
// Preload
jumpSound.load();
tokenSound.load();
gameOverSound.load();

// Player definition
const player = {x:50, y:canvas.height-30, w:30, h:30, vy:0, onGround:true};

// Entities
const obstacles = [];
const tokens = [];

function spawnObstacle(){
  const h = 30 + Math.random()*30;
  obstacles.push({x:canvas.width, y:canvas.height-h, w:20, h});
}
function spawnToken(){
  const size = 15;
  tokens.push({x:canvas.width, y:canvas.height-60, w:size, h:size, collected:false});
}

function drawBackground(){
  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,canvas.height);
  sky.addColorStop(0, '#87ceeb');
  sky.addColorStop(1, '#e0f6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Ground line
  ctx.strokeStyle = '#654321';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 5);
  ctx.lineTo(canvas.width, canvas.height - 5);
  ctx.stroke();
}

function drawRoundedRect(x,y,w,h,radius,fillStyle){
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
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function update(){
  frame++;
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if(player.y + player.h >= canvas.height){
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // Move obstacles and tokens
  obstacles.forEach(o=> o.x -= speed);
  tokens.forEach(t=> t.x -= speed);

  // Remove off‑screen
  while(obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();
  while(tokens.length && tokens[0].x + tokens[0].w < 0) tokens.shift();

  // Spawn
  if(frame % OBSTACLE_FREQ === 0) spawnObstacle();
  if(frame % TOKEN_FREQ === 0) spawnToken();

  // Collision detection
  for(const o of obstacles){
    if(player.x < o.x + o.w && player.x + player.w > o.x &&
       player.y < o.y + o.h && player.y + player.h > o.y){
      gameOverSound.play();
      alert('Game Over! Score: ' + Math.round(score));
      document.location.reload();
    }
  }
  for(const t of tokens){
    if(!t.collected && player.x < t.x + t.w && player.x + player.w > t.x &&
        player.y < t.y + t.h && player.y + player.h > t.y){
      t.collected = true;
      tokenSound.play();
      speed += 0.3; // speed boost
    }
  }

  // Score
  score += speed * 0.1;
}

function draw(){
  drawBackground();
  // Player (rounded green)
  drawRoundedRect(player.x, player.y, player.w, player.h, 6, '#4caf50');
  // Obstacles (red with gradient)
  obstacles.forEach(o=> {
    const grad = ctx.createLinearGradient(0, o.y, 0, o.y+o.h);
    grad.addColorStop(0, '#ff8a80');
    grad.addColorStop(1, '#e53935');
    drawRoundedRect(o.x, o.y, o.w, o.h, 3, grad);
  });
  // Tokens (gold circles with glow)
  tokens.forEach(t=> {
    if(t.collected) return;
    const radius = t.w/2;
    const cx = t.x + radius;
    const cy = t.y + radius;
    const glow = ctx.createRadialGradient(cx, cy, radius*0.2, cx, cy, radius);
    glow.addColorStop(0, '#fff176');
    glow.addColorStop(1, '#fdd835');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fillStyle = glow;
    ctx.fill();
  });
  // Score
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + Math.round(score), 10, 20);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling
window.addEventListener('keydown', e=>{ if(e.code === 'Space' && player.onGround){ jumpSound.play(); player.vy = JUMP_STRENGTH; player.onGround = false; } });
canvas.addEventListener('click',()=>{ if(player.onGround){ player.vy = JUMP_STRENGTH; player.onGround = false; } });

loop();
