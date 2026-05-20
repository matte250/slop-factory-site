// Simple Space Dodger game for canvas#game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Player (triangle spaceship with simple flame)
const player = {x: canvas.width/2, y: canvas.height*0.8, size: 20, fuel: 100, score: 0};

// Starfield background
const stars = [];
for(let i=0;i<100;i++){
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1, speed: 0.2+Math.random()*0.5});
}

// Sound setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime+0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+duration);
  osc.stop(audioCtx.currentTime+duration);
}
function playCollect(){ playTone(600,0.1); }
function playCrash(){ playTone(150,0.3); }

// Containers
const asteroids = [];
const fuels = [];

let gameOver = false;

// Input handling (mouse & touch)
function setPos(e){
  // Resume audio context on first interaction (required by browsers)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX ?? e.touches?.[0].clientX) - rect.left;
  const y = (e.clientY ?? e.touches?.[0].clientY) - rect.top;
  player.x = Math.max(0, Math.min(canvas.width, x));
  player.y = Math.max(0, Math.min(canvas.height, y));
}
canvas.addEventListener('mousemove', setPos);
canvas.addEventListener('touchmove', e=>{e.preventDefault(); setPos(e);});

function spawnAsteroid(){
  const size = 20 + Math.random()*30;
  const angle = Math.random()*Math.PI*2;
  const angularSpeed = (Math.random()-0.5)*0.02; // slight rotation
  asteroids.push({x: Math.random()*canvas.width, y: -size, size, speed: 1+Math.random()*2, angle, angularSpeed});
}
function spawnFuel(){
  const size = 10;
  fuels.push({x: Math.random()*canvas.width, y: -size, size, speed: 1.5});
}

let asteroidTimer=0, fuelTimer=0, difficulty=0;

function update(){
  if(gameOver) return;
  // Increase difficulty over time
  difficulty += 0.001;

  // Spawn logic
  asteroidTimer += 1;
  fuelTimer += 1;
  if(asteroidTimer > 60 - difficulty*30){ spawnAsteroid(); asteroidTimer=0; }
  if(fuelTimer > 300){ spawnFuel(); fuelTimer=0; }

  // Move starfield (parallax)
  for(let i=stars.length-1;i>=0;i--){
    const s=stars[i];
    s.y += s.speed + difficulty*0.2;
    if(s.y > canvas.height) {
      s.x = Math.random()*canvas.width;
      s.y = -s.size;
    }
  }

  // Move asteroids
  for(let i=asteroids.length-1;i>=0;i--){
    const a=asteroids[i];
    a.y += a.speed + difficulty*0.5;
    if(a.y - a.size > canvas.height) asteroids.splice(i,1);
    // Collision with player
    const dx = a.x-player.x, dy = a.y-player.y;
    const dist = Math.hypot(dx,dy);
    if(dist < a.size+player.size){ playCrash(); gameOver=true; }
  }
  // Move fuel cells
  for(let i=fuels.length-1;i>=0;i--){
    const f=fuels[i];
    f.y += f.speed + difficulty*0.5;
    if(f.y - f.size > canvas.height) fuels.splice(i,1);
    const dx = f.x-player.x, dy = f.y-player.y;
    const dist = Math.hypot(dx,dy);
    if(dist < f.size+player.size){
      playCollect();
      player.fuel = Math.min(100, player.fuel+20);
      player.score += 10;
      fuels.splice(i,1);
    }
  }

  // Fuel consumption
  player.fuel -= 0.05;
  if(player.fuel<=0) gameOver=true;
}

function draw(){
  // Background gradient
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#001020');
  grad.addColorStop(1,'#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Starfield
  ctx.fillStyle = 'white';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.size,0,Math.PI*2);
    ctx.fill();
  });

  // Fuel cells (glow)
  fuels.forEach(f=>{
    ctx.fillStyle='rgba(255,255,0,0.8)';
    ctx.beginPath();
    ctx.arc(f.x,f.y,f.size,0,Math.PI*2);
    ctx.fill();
  });

  // Asteroids with rotation
  ctx.fillStyle='gray';
  asteroids.forEach(a=>{
    ctx.save();
    ctx.translate(a.x,a.y);
    ctx.rotate(a.angle || 0);
    ctx.beginPath();
    ctx.arc(0,0,a.size,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    // update rotation for next frame
    a.angle = (a.angle || 0) + a.angularSpeed;
  });

  // Player flame (flicker)
  ctx.fillStyle='orange';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.size/2);
  ctx.lineTo(player.x - player.size/3, player.y + player.size/2 + Math.random()*10 + 5);
  ctx.lineTo(player.x + player.size/3, player.y + player.size/2 + Math.random()*10 + 5);
  ctx.closePath();
  ctx.fill();

  // Player ship (triangle)
  ctx.fillStyle='cyan';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size/2, player.y + player.size/2);
  ctx.lineTo(player.x + player.size/2, player.y + player.size/2);
  ctx.closePath();
  ctx.fill();

  // HUD
  ctx.fillStyle='white';
  ctx.font='16px sans-serif';
  ctx.fillText('Score: '+Math.floor(player.score),10,20);
  ctx.fillText('Fuel: '+Math.floor(player.fuel),10,40);
  if(gameOver){
    ctx.fillStyle='red';
    ctx.font='48px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-120, canvas.height/2);
  }
}

function loop(){
  update();
  draw();
  if(!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
