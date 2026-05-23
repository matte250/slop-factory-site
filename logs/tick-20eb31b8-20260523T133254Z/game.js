// Asteroid Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Starfield background
const STAR_COUNT = 100;
const stars = [];
for(let i=0;i<STAR_COUNT;i++){
  stars.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*1.5+0.5
  });
}

function drawStars(){
  ctx.fillStyle = 'white';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, 2*Math.PI);
    ctx.fill();
  });
}

// Audio assets
const bgMusic = new Audio('bg-music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
const collisionSound = new Audio('collision.wav');
let bgStarted = false;

// Ship definition
const ship = {x: canvas.width/2, y: canvas.height-30, w:20, h:30, speed:4};
let keys = {};
addEventListener('keydown',e=>keys[e.key]=true);
addEventListener('keyup',e=>keys[e.key]=false);

function drawShip(){
  ctx.fillStyle='cyan';
  ctx.strokeStyle='blue';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x-ship.w/2, ship.y+ship.h);
  ctx.lineTo(ship.x+ship.w/2, ship.y+ship.h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Asteroids
let asteroids=[];
let lastSpawn=0;
let spawnInterval=1000; // ms
let startTime=Date.now();
let gameOver=false;

function spawnAsteroid(){
  const size = 10+Math.random()*20;
  const x = Math.random()*canvas.width;
  const y = -size;
  const speed = 1+Math.random()*2 + (Date.now()-startTime)/60000; // increase over time
  asteroids.push({x,y,r:size,speedY:speed});
}

function update(dt){
  // ship movement
  if(keys.ArrowLeft||keys.a) ship.x-=ship.speed;
  if(keys.ArrowRight||keys.d) ship.x+=ship.speed;
  ship.x = Math.max(ship.w/2, Math.min(canvas.width-ship.w/2, ship.x));
  // asteroids
  asteroids.forEach(a=>a.y+=a.speedY);
  asteroids = asteroids.filter(a=>a.y - a.r < canvas.height);
  // spawn
  if(Date.now()-lastSpawn>spawnInterval){spawnAsteroid();lastSpawn=Date.now();}
  // collision
  for(let a of asteroids){
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    const dist = Math.hypot(dx, dy);
    if(dist < a.r + ship.w/2){
      gameOver=true;
      collisionSound.play();
      break;
    }
  }
}

function draw(){
  // background
  ctx.fillStyle='black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  drawStars();
  // ship
  drawShip();
  // asteroids with gradient
  asteroids.forEach(a=>{
    const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
    grad.addColorStop(0, 'lightgray');
    grad.addColorStop(1, 'dimgray');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, 2*Math.PI);
    ctx.fill();
  });
  // score
  ctx.fillStyle='white';
  ctx.shadowColor='black';
  ctx.shadowOffsetX=1; ctx.shadowOffsetY=1; ctx.shadowBlur=2;
  ctx.font='16px sans-serif';
  const seconds = Math.floor((Date.now()-startTime)/1000);
  ctx.fillText('Time: '+seconds+'s',10,20);
  ctx.shadowColor='transparent';
}

let lastTime=0;
function loop(timestamp){
  // start background music on first frame after user interaction
  if(!bgStarted && (keys.ArrowLeft || keys.ArrowRight || keys.a || keys.d)){
    bgMusic.play();
    bgStarted = true;
  }
  if(gameOver){
    ctx.fillStyle='red';
    ctx.font='40px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-100, canvas.height/2);
    return;
  }
  const dt = timestamp-lastTime;
  lastTime=timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
