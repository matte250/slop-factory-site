// Cosmic Dodger game
// Canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain).connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Resume audio context on first user interaction
function resumeAudio(){
  if(audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('keydown', resumeAudio);
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
// starfield background
const stars = [];
function initStars(){
  for(let i=0;i<100;i++){
    stars.push({x:Math.random()*WIDTH, y:Math.random()*HEIGHT, r:Math.random()*1.5+0.5});
  }
}
initStars();

// Ship
const ship = {x: WIDTH/2, y: HEIGHT-30, w: 40, h: 20, speed: 5};
let left = false, right = false;

// Game objects
let asteroids = [];
let fuels = [];
let score = 0;
let gameOver = false;

// Input handlers
window.addEventListener('keydown', e => {if(e.key==='ArrowLeft') left=true; if(e.key==='ArrowRight') right=true;});
window.addEventListener('keyup', e => {if(e.key==='ArrowLeft') left=false; if(e.key==='ArrowRight') right=false;});

function spawnAsteroid(){
  const size = 20+Math.random()*30;
  asteroids.push({x: Math.random()*(WIDTH-size), y: -size, w:size, h:size, speed:2+Math.random()*3});
}
function spawnFuel(){
  const size = 15;
  fuels.push({x: Math.random()*(WIDTH-size), y: -size, w:size, h:size, speed:2});
}

let asteroidTimer=0, fuelTimer=0;
function update(){
  if(gameOver) return;
  // move ship
  if(left) ship.x -= ship.speed;
  if(right) ship.x += ship.speed;
  ship.x = Math.max(0, Math.min(WIDTH-ship.w, ship.x));

  // spawn
  asteroidTimer++; fuelTimer++;
  if(asteroidTimer>60){ spawnAsteroid(); asteroidTimer=0; }
  if(fuelTimer>180){ spawnFuel(); fuelTimer=0; }

  // update objects
  asteroids.forEach(a=> a.y += a.speed);
  fuels.forEach(f=> f.y += f.speed);

  // collision detection
  asteroids = asteroids.filter(a=> {
    if(a.y>HEIGHT) return false; // off screen
    // ship collision
    if(a.x < ship.x+ship.w && a.x+a.w > ship.x && a.y < ship.y+ship.h && a.y+a.h > ship.y){
      gameOver = true;
      beep(150,0.3);
    }
    return true;
  });
  fuels = fuels.filter(f=> {
    if(f.y>HEIGHT) return false;
    if(f.x < ship.x+ship.w && f.x+f.w > ship.x && f.y < ship.y+ship.h && f.y+f.h > ship.y){
      score+=10;
      beep(440,0.1);
      return false; // collected
    }
    return true;
  });
}

function draw(){
  // background gradient
  const grad = ctx.createLinearGradient(0,0,0,HEIGHT);
  grad.addColorStop(0,'#001');
  grad.addColorStop(1,'#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  // starfield
  ctx.fillStyle = '#fff';
  stars.forEach(s=> {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  });
  // ship (triangle)
  ctx.fillStyle = '#0af';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x+ship.w, ship.y);
  ctx.lineTo(ship.x+ship.w/2, ship.y-ship.h);
  ctx.closePath();
  ctx.fill();
  // asteroids (circles)
  ctx.fillStyle = '#a33';
  asteroids.forEach(a=> {
    ctx.beginPath();
    ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  // fuels (glowing circles)
  ctx.fillStyle = '#ff0';
  fuels.forEach(f=> {
    ctx.beginPath();
    ctx.arc(f.x + f.w/2, f.y + f.h/2, f.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score, 10, 20);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', WIDTH/2-80, HEIGHT/2);
  }
}
function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
loop();
