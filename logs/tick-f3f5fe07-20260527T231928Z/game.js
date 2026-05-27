// Minimal endless runner
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
  osc.stop(audioCtx.currentTime + duration/1000);
}
canvas.width = 800;
canvas.height = 200;

const GRAVITY = 0.6;
const PLAYER = {x:50, y:canvas.height-50, w:30, h:30, vy:0, jump:-12};
let obstacles = [];
let clouds = [];
let lastSpawn = 0;
let cloudSpawn = 0;
let gameOver = false;
let score = 0;
let groundOffset = 0;
const GROUND_SPEED = 2;
const CLOUD_SPEED = 0.5;

function spawnObstacle() {
  const size = 20 + Math.random()*30;
  const isSpike = Math.random() < 0.5;
  if (isSpike) {
    // spike triangle pointing up
    obstacles.push({x:canvas.width, y:canvas.height-20-size, w:size, h:size, speed:4, type:'spike'});
  } else {
    // rectangular obstacle
    obstacles.push({x:canvas.width, y:canvas.height-20-size, w:size, h:size, speed:4, type:'rect'});
  }
}

function reset() {
  PLAYER.y = canvas.height-50;
  PLAYER.vy = 0;
  obstacles = [];
  lastSpawn = 0;
  gameOver = false;
  score = 0;
}

function update(dt) {
  if (gameOver) return;
  // player physics
  PLAYER.vy += GRAVITY;
  PLAYER.y += PLAYER.vy;
  if (PLAYER.y + PLAYER.h > canvas.height - 20) { // ground height
    PLAYER.y = canvas.height - 20 - PLAYER.h;
    PLAYER.vy = 0;
  }
  // ground scroll
  groundOffset = (groundOffset - GROUND_SPEED) % 40;
  // clouds scroll
  clouds.forEach(c => c.x -= CLOUD_SPEED);
  clouds = clouds.filter(c => c.x + c.r > 0);
  cloudSpawn += dt;
  if (cloudSpawn > 3000) { // spawn cloud every 3 seconds
    const r = 10 + Math.random() * 20;
    clouds.push({x: canvas.width + r, y: 20 + Math.random() * 80, r});
    cloudSpawn = 0;
  }
  // obstacles
  obstacles.forEach(o => o.x -= o.speed);
  obstacles = obstacles.filter(o => o.x + o.w > 0);
  // spawn obstacles
  lastSpawn += dt;
  if (lastSpawn > 1500) { // ms
    spawnObstacle();
    lastSpawn = 0;
  }
  // collision
  for (let o of obstacles) {
    if (PLAYER.x < o.x + o.w && PLAYER.x + PLAYER.w > o.x &&
        PLAYER.y < o.y + o.h && PLAYER.y + PLAYER.h > o.y) {
      gameOver = true;
      playTone(220, 300); // collision/game over sound
      break;
    }
  }
  // score
  score += dt/1000;
}

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // background gradient
  const grd = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grd.addColorStop(0, '#a0d8f1'); // sky top
  grd.addColorStop(1, '#e0f7fa'); // sky bottom
  ctx.fillStyle = grd;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // parallax clouds
  clouds.forEach(c => {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
    ctx.fill();
  });
  // ground with scrolling pattern
  const groundY = canvas.height - 20;
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, groundY, canvas.width, 20);
  // simple strip pattern
  ctx.strokeStyle = '#3b240b';
  ctx.lineWidth = 2;
  for (let x = groundOffset; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, groundY);
    ctx.lineTo(x+20, groundY+20);
    ctx.stroke();
  }
  // player (rounded)
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.arc(PLAYER.x + PLAYER.w/2, PLAYER.y + PLAYER.h/2, PLAYER.w/2, 0, Math.PI*2);
  ctx.fill();
  // obstacles with styles
  obstacles.forEach(o => {
    if (o.type === 'spike') {
      ctx.fillStyle = '#c00';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w/2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  });
  // score / game over
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+Math.floor(score), 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
  }
}

let lastTime = performance.now();
function loop(time) {
  const dt = time - lastTime;
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function jump() {
  // allow jump only when player is on the ground (consider ground height 20px)
  if (PLAYER.vy===0 && PLAYER.y + PLAYER.h >= canvas.height - 20) {
    PLAYER.vy = PLAYER.jump;
    playTone(660, 150); // jump sound
  }
}

window.addEventListener('keydown', e=>{if(e.code==='Space') {audioCtx.resume(); jump();}});
canvas.addEventListener('click', () => {audioCtx.resume(); jump();});
