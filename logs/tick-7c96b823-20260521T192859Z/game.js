// Asteroid Escape game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Audio assets
const boostSound = new Audio('boost.mp3');
const explosionSound = new Audio('explosion.mp3');
const bgMusic = new Audio('bgm.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;
bgMusic.play();

// Ship
const ship = {
  x: 50,
  y: canvas.height / 2,
  w: 30,
  h: 20,
  speed: 3,
  boostSpeed: 6,
  fuel: 100,
  maxFuel: 100,
};
let up = false, down = false, boosting = false;

// Asteroids
const asteroids = [];
let asteroidTimer = 0;
const asteroidInterval = 90; // frames

let score = 0;
let gameOver = false;

function spawnAsteroid(){
  const radius = 15 + Math.random()*15;
  const y = Math.random()*canvas.height;
  const speed = 2 + Math.random()*2;
  asteroids.push({x: canvas.width+radius, y, radius, speed});
}

function update(){
  if (gameOver) return;
  // ship movement
  if (up) ship.y -= ship.speed;
  if (down) ship.y += ship.speed;
  if (boosting && ship.fuel>0){
    ship.y -= ship.boostSpeed;
    ship.fuel -= 0.5;
  } else {
    ship.fuel = Math.min(ship.maxFuel, ship.fuel + 0.2);
  }
  ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));

  // asteroids
  asteroidTimer++;
  if (asteroidTimer > asteroidInterval){
    spawnAsteroid();
    asteroidTimer = 0;
  }
  for (let i=asteroids.length-1;i>=0;i--){
    const a = asteroids[i];
    a.x -= a.speed;
    if (a.x + a.radius < 0) asteroids.splice(i,1);
    // collision (simple rect-circle)
    const dx = Math.max(ship.x, Math.min(a.x, ship.x+ship.w));
    const dy = Math.max(ship.y, Math.min(a.y, ship.y+ship.h));
    const dist = Math.hypot(a.x-dx, a.y-dy);
    if (dist < a.radius) {gameOver = true;}
  }
  if (ship.fuel <= 0 && boosting) gameOver = true;

  score += 0.016; // approx per 60fps seconds
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // ship
  ctx.fillStyle = '#0f0';
  ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
  // boost fuel bar
  ctx.fillStyle = '#ff0';
  ctx.fillRect(10,10, ship.fuel, 5);
  // asteroids
  ctx.fillStyle = '#888';
  asteroids.forEach(a=>{ctx.beginPath();ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);ctx.fill();});
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+Math.floor(score), canvas.width-120, 20);
  if (gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// input handling
window.addEventListener('keydown',e=>{
  if (e.key==='ArrowUp') up = true;
  if (e.key==='ArrowDown') down = true;
  if (e.key===' ') boosting = true;
});
window.addEventListener('keyup',e=>{
  if (e.key==='ArrowUp') up = false;
  if (e.key==='ArrowDown') down = false;
  if (e.key===' ') boosting = false;
});

loop();