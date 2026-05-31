// Simple Pixel Pilots game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playThrustSound(){playTone(300,0.08);}
function playCollisionSound(){playTone(100,0.4);}
// starfield
const STAR_COUNT = 80;
const stars = Array.from({length: STAR_COUNT},()=>({
  x: Math.random()*canvas.width,
  y: Math.random()*canvas.height
}));

// Ship
const ship = {x: 50, y: canvas.height/2, w: 20, h: 12, vy: 0};
const GRAVITY = 0.4;
const THRUST = -8;
let isThrusting = false; // visual flag

// Asteroids
let asteroids = [];
const ASTEROID_FREQ = 120; // frames
let frame = 0;
let score = 0;
let gameOver = false;

function reset() {
  ship.y = canvas.height/2; ship.vy = 0; asteroids = []; frame = 0; score = 0; gameOver = false;
}

function spawnAsteroid() {
  const size = 20 + Math.random()*30;
  const y = Math.random()* (canvas.height - size);
  const speed = 2 + Math.random()*2;
  asteroids.push({x: canvas.width, y, w: size, h: size, speed});
}

function update() {
  if (gameOver) return;
  // ship physics
  ship.vy += GRAVITY;
  ship.y += ship.vy;
  // bounds
  if (ship.y + ship.h > canvas.height || ship.y < 0) { gameOver = true; playCollisionSound(); return; }
  // asteroids
  if (frame % ASTEROID_FREQ === 0) spawnAsteroid();
  asteroids.forEach(a => a.x -= a.speed);
  asteroids = asteroids.filter(a => a.x + a.w > 0);
  // collision
  for (const a of asteroids) {
    if (ship.x < a.x + a.w && ship.x + ship.w > a.x && ship.y < a.y + a.h && ship.y + ship.h > a.y) {gameOver = true; break;}
  }
  score++;
  frame++;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // stars background with gradient and moving stars
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,"#001" );
  bgGrad.addColorStop(1,"#000" );
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw moving stars
  ctx.fillStyle = '#fff';
  for(let i=0;i<stars.length;i++){
    const s = stars[i];
    ctx.fillRect(s.x, s.y, 2, 2);
    s.x -= 0.5; // slow parallax
    if(s.x<0) s.x=canvas.width, s.y=Math.random()*canvas.height;
  }
  // ship
  // body
  ctx.fillStyle = '#0bf';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x, ship.y + ship.h);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h/2);
  ctx.closePath();
  ctx.fill();
  // thrust flame
  if(isThrusting){
    ctx.fillStyle = '#f80';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h/2);
    ctx.lineTo(ship.x - 10, ship.y + ship.h/2 - 5);
    ctx.lineTo(ship.x - 10, ship.y + ship.h/2 + 5);
    ctx.closePath();
    ctx.fill();
  }
  // asteroids with radial gradient
  asteroids.forEach(a=>{
    const grad = ctx.createRadialGradient(a.x + a.w/2, a.y + a.h/2, a.w*0.2, a.x + a.w/2, a.y + a.h/2, a.w/2);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI*2);
    ctx.fill();
  });
  // score
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: '+score, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '30px monospace';
    ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}

canvas.addEventListener('mousedown',()=>{audioCtx.resume(); playThrustSound(); ship.vy = THRUST; isThrusting = true; setTimeout(()=>{isThrusting = false;}, 150);});
canvas.addEventListener('touchstart',e=>{e.preventDefault(); audioCtx.resume(); playThrustSound(); ship.vy = THRUST; isThrusting = true; setTimeout(()=>{isThrusting = false;}, 150);}, {passive:false});
// start
reset();
loop();
