// Simple side‑scrolling starship runner. Targets <canvas id="game">
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
// create a dark space gradient background
const bgGradient = ctx.createLinearGradient(0,0,0,canvas.height);
bgGradient.addColorStop(0, '#00102a');
bgGradient.addColorStop(1, '#000814');

let ship = {x:50, y:canvas.height/2, w:20, h:30, vy:0, thrusting:false};
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}
function playThrust(){ playTone(200, 0.08); }
function playFuel(){ playTone(400, 0.05); }
function playCollision(){ playTone(100, 0.3); }

const GRAVITY = 0.4, THRUST = -8;
let fuel = 100;
let asteroids = [], fuels = [], stars = [];
let frame = 0, gameOver = false;

function spawnAsteroid(){
  const r = 20 + Math.random()*30;
  const speed = 3+ Math.random()*2;
  const shade = Math.floor(150 + Math.random()*105); // 150-255 gray shade
  asteroids.push({x:canvas.width+r, y:Math.random()*canvas.height, r, speed, shade});
}
function spawnStar(){
  const radius = Math.random()*1.5 + 0.5;
  const speed = 0.5 + Math.random()*0.5;
  const alpha = Math.random()*0.5 + 0.5;
  stars.push({x:canvas.width, y:Math.random()*canvas.height, radius, speed, alpha});
}
function spawnFuel(){
  fuels.push({x:canvas.width+20, y:Math.random()*canvas.height, w:15, h:15, speed:3});
}
function update(){
  if(gameOver) return;
  frame++;
  // reset thrust visual flag; will be set by input handlers this frame
  ship.thrusting = false;
  fuel -= 0.05; if(fuel<=0) gameOver = true;
  ship.vy += GRAVITY; ship.y += ship.vy;
  if(ship.y>canvas.height){ship.y=canvas.height; ship.vy=0;}
  if(ship.y<0){ship.y=0; ship.vy=0;}
  // move asteroids
  asteroids.forEach(a=> a.x -= a.speed);
  asteroids = asteroids.filter(a=> a.x + a.r > 0);
  // move fuels
  fuels.forEach(f=> f.x -= f.speed);
  fuels = fuels.filter(f=> f.x + f.w > 0);
  // move stars
  stars.forEach(s=> s.x -= s.speed);
  stars = stars.filter(s=> s.x + s.radius > 0);
  // collisions with asteroids
  for(const a of asteroids){
    const dx = a.x - ship.x, dy = a.y - ship.y;
    if(Math.hypot(dx, dy) < a.r + ship.w/2){ gameOver = true; playCollision(); break; }
  }
  // collect fuel
  for(let i=fuels.length-1;i>=0;i--){
    const f = fuels[i];
    if(f.x < ship.x+ship.w && f.x+f.w > ship.x && f.y < ship.y+ship.h && f.y+f.h > ship.y){
      fuel = Math.min(100, fuel+30);
      fuels.splice(i,1);
      playFuel();
    }
  }
  if(frame%100===0) spawnAsteroid();
  if(frame%300===0) spawnFuel();
  // spawn stars occasionally for a twinkling field
  if(frame%2===0) spawnStar();
}
function draw(){
  // background gradient
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // stars field
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0;

  // ship with thrust flame
  ctx.fillStyle='white';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x-ship.w, ship.y+ship.h/2);
  ctx.lineTo(ship.x-ship.w, ship.y-ship.h/2);
  ctx.closePath();
  ctx.fill();
  if(ship.thrusting){
    ctx.fillStyle='orange';
    ctx.beginPath();
    ctx.moveTo(ship.x-ship.w, ship.y);
    ctx.lineTo(ship.x-ship.w-10, ship.y+5);
    ctx.lineTo(ship.x-ship.w-10, ship.y-5);
    ctx.closePath();
    ctx.fill();
  }
  // asteroids with shading
  asteroids.forEach(a=>{
    ctx.fillStyle = `rgb(${a.shade},${a.shade},${a.shade})`;
    ctx.beginPath();
    ctx.arc(a.x,a.y,a.r,0,Math.PI*2);
    ctx.fill();
  });
  // fuel cells
  ctx.fillStyle='yellow';
  fuels.forEach(f=> ctx.fillRect(f.x,f.y,f.w,f.h));
  // HUD
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Fuel: '+Math.floor(fuel),10,20);
  if(gameOver){
    ctx.fillStyle='red';
    ctx.font='30px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
  }
}
canvas.addEventListener('mousedown',()=> {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  ship.vy = THRUST; ship.thrusting = true; playThrust();
});
canvas.addEventListener('touchstart',()=> {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  ship.vy = THRUST; ship.thrusting = true; playThrust();
});
function loop(){ update(); draw(); if(!gameOver) requestAnimationFrame(loop); }
loop();
