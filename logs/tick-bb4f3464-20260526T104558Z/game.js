// Cosmic Dodger game with enhanced graphics targeting <canvas id="game">
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

// Ship
const ship = {x: 100, y: canvas.height/2, w: 30, h: 20, speed: 4};
const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Audio assets (use royalty‑free URLs)
const bgMusic = new Audio('https://assets.codepen.io/6093400/space-ambient.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;
const thrustSound = new Audio('https://assets.codepen.io/6093400/thrust.wav');
thrustSound.volume = 0.2;
const crashSound = new Audio('https://assets.codepen.io/6093400/crash.wav');
crashSound.volume = 0.5;
let audioStarted = false;
// Debris
const debris = [];
let debrisTimer = 0;
const spawnDebris = () => {
  const size = Math.random()*30+10;
  const side = Math.random()<0.5?'left':'right';
  const y = Math.random()*canvas.height;
  const x = side==='left' ? -size : canvas.width+size;
  const vx = side==='left' ? (2+Math.random()*3) : -(2+Math.random()*3);
  const vy = (Math.random()-0.5)*2;
  debris.push({x, y, w:size, h:size, vx, vy});
};

// Starfield background with twinkling effect
const stars = [];
for(let i=0;i<120;i++){
  const baseR = Math.random()*1.5 + 0.5; // base radius
  stars.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    baseR: baseR,
    r: baseR, // current radius (updated each frame)
    speed: 0.3 + Math.random()*0.4,
    phase: Math.random()*Math.PI*2,
    flickerSpeed: 0.02 + Math.random()*0.03
  });
}

let distance = 0;
let gameOver = false;

function update(){
  // move ship
  let moving = false;
  if(keys['ArrowUp']||keys['w']){ ship.y -= ship.speed; moving = true; }
  if(keys['ArrowDown']||keys['s']){ ship.y += ship.speed; moving = true; }
  if(keys['ArrowLeft']||keys['a']){ ship.x -= ship.speed; moving = true; }
  if(keys['ArrowRight']||keys['d']){ ship.x += ship.speed; moving = true; }
  // keep within bounds
  ship.x = Math.max(0, Math.min(canvas.width-ship.w, ship.x));
  ship.y = Math.max(0, Math.min(canvas.height-ship.h, ship.y));

  // start audio on first interaction
  if(moving && !audioStarted){ bgMusic.play(); audioStarted = true; }
  // play thrust sound while moving
  if(moving){ thrustSound.currentTime = 0; thrustSound.play(); }

  // stars move left and twinkle
  stars.forEach(s=>{
    s.x -= s.speed; if(s.x<0) s.x = canvas.width;
    // twinkling effect using sinusoidal variation
    s.phase += s.flickerSpeed;
    s.r = s.baseR + Math.sin(s.phase) * s.baseR * 0.3;
  });

  // spawn debris every 60 frames (~1s at 60fps)
  if(debrisTimer-- <= 0){
    spawnDebris();
    debrisTimer = 60;
  }

  // update debris
  for(let i=debris.length-1;i>=0;i--){
    const d = debris[i];
    d.x += d.vx; d.y += d.vy;
    // remove when offscreen
    if(d.x < -d.w || d.x > canvas.width+ d.w) debris.splice(i,1);
    // collision
    if(!(ship.x + ship.w < d.x || ship.x > d.x + d.w || ship.y + ship.h < d.y || ship.y > d.y + d.h)){
      gameOver = true;
      crashSound.play();
    }
  }

  distance += 0.1; // arbitrary distance unit per frame
}

function draw(){
  // draw background gradient
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,'#001');
  bgGrad.addColorStop(1,'#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // stars with subtle glow
  ctx.save();
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = '#fff';
  stars.forEach(s=>{ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();});
  ctx.restore();

  // ship (enhanced graphic)
  // draw ship with gradient body and a glowing thruster
  const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#060');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y + ship.h/2);
  ctx.lineTo(ship.x + ship.w * 0.8, ship.y);
  ctx.lineTo(ship.x + ship.w * 0.8, ship.y + ship.h);
  ctx.closePath();
  ctx.fill();
  // thruster flame with flicker
  ctx.fillStyle = 'orange';
  ctx.globalAlpha = 0.7 + Math.random()*0.3;
  ctx.beginPath();
  ctx.moveTo(ship.x + ship.w * 0.8, ship.y + ship.h * 0.3);
  ctx.lineTo(ship.x + ship.w, ship.y + ship.h/2);
  ctx.lineTo(ship.x + ship.w * 0.8, ship.y + ship.h * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // debris with rotation and gradient shading
  debris.forEach(d=>{
    const angle = Math.atan2(d.vy, d.vx);
    ctx.save();
    ctx.translate(d.x + d.w/2, d.y + d.h/2);
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(-d.w/2, -d.h/2, d.w/2, d.h/2);
    grad.addColorStop(0, '#f88');
    grad.addColorStop(1, '#800');
    ctx.fillStyle = grad;
    ctx.fillRect(-d.w/2, -d.h/2, d.w, d.h);
    ctx.restore();
  });

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('Distance: '+Math.floor(distance),10,20);
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2-20);
    ctx.font = '24px sans-serif';
    ctx.fillText('Travelled: '+Math.floor(distance)+' units', canvas.width/2, canvas.height/2+20);
  }
}


function loop(){
  if(!gameOver){
    update();
    draw();
    requestAnimationFrame(loop);
  } else {
    draw(); // final frame with overlay
  }
}

// start
requestAnimationFrame(loop);
