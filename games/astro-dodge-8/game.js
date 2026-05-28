// Astro Dodge – enhanced graphics with sound
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 600;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Ensure audio context runs after user interaction
function resumeAudio(){
  if(audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('click', resumeAudio);
window.addEventListener('keydown', resumeAudio);

// Starfield background
const starCount = 100;
const stars = [];
for(let i=0;i<starCount;i++){
  stars.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*2+0.5,
    speed: 0.5 + Math.random()*0.5
  });
}
function updateStars(){
  for(const s of stars){
    s.x -= s.speed * (gameSpeed/2);
    if(s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random()*canvas.height;
      s.r = Math.random()*2+0.5;
    }
  }
}

// Ship
const ship = {x: 80, y: canvas.height/2, width: 30, height: 20, speed: 4};

// Asteroids
let asteroids = [];
let spawnInterval = 1000; // ms
let lastSpawn = 0;
let gameSpeed = 2;
let score = 0;
let alive = true;

function spawnAsteroid(){
  const radius = 15 + Math.random()*10;
  asteroids.push({x: canvas.width+radius, y: Math.random()*canvas.height, r: radius});
}

function update(delta){
  // ship movement (keyboard)
  if(up) ship.y -= ship.speed;
  if(down) ship.y += ship.speed;
  // keep within bounds
  ship.y = Math.max(ship.height/2, Math.min(canvas.height-ship.height/2, ship.y));

  // move stars
  updateStars();

  // asteroids motion
  for(let i=asteroids.length-1;i>=0;i--){
    const a = asteroids[i];
    a.x -= gameSpeed;
    // collision detection
    const dx = a.x - ship.x;
    const dy = a.y - ship.y;
    if(Math.hypot(dx, dy) < a.r + Math.max(ship.width, ship.height)/2){
      alive = false;
      beep(150,0.3); // collision sound
    }
    // remove passed asteroids & increment score
    if(a.x + a.r < 0){
      asteroids.splice(i,1);
      score++;
      beep(440,0.05); // dodge sound
    }
  }

  // increase difficulty over time
  gameSpeed += 0.0005;
  spawnInterval = Math.max(200, spawnInterval - 0.05);
}

function draw(){
  // background
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle = '#fff';
  for(const s of stars){
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  }
  // ship – green with white outline
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(ship.x, ship.y);
  ctx.lineTo(ship.x-ship.width, ship.y-ship.height/2);
  ctx.lineTo(ship.x-ship.width, ship.y+ship.height/2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // asteroids – radial gradient for depth
  for(const a of asteroids){
    const grad = ctx.createRadialGradient(a.x, a.y, a.r*0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
    ctx.fill();
  }
  // score – bold cyan
  ctx.fillStyle = '#0ff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Score: '+score,10,30);
}

let up=false, down=false;
window.addEventListener('keydown',e=>{if(e.key==='ArrowUp') up=true; if(e.key==='ArrowDown') down=true;});
window.addEventListener('keyup',e=>{if(e.key==='ArrowUp') up=false; if(e.key==='ArrowDown') down=false;});
canvas.addEventListener('mousemove',e=>{const rect=canvas.getBoundingClientRect(); ship.y = e.clientY-rect.top;});

let lastTime=0;
function loop(timestamp){
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if(alive){
    if(timestamp - lastSpawn > spawnInterval){
      spawnAsteroid();
      lastSpawn = timestamp;
    }
    update(delta);
    draw();
    requestAnimationFrame(loop);
  } else {
    // Game Over overlay
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.fillText('Score: '+score, canvas.width/2, canvas.height/2+50);
  }
}
requestAnimationFrame(loop);
