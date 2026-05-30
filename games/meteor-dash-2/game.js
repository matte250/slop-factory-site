const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 600;

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
  osc.stop(audioCtx.currentTime + duration / 1000);
}
// Ensure audio context is resumed on user interaction
window.addEventListener('click', () => audioCtx.resume());
window.addEventListener('keydown', () => audioCtx.resume());

const player = {x: canvas.width/2, y: canvas.height-30, w:40, h:20, speed:5};
let meteors = [];
let lastMeteor = 0;
let score = 0;
let gameOver = false;

// Background stars
let stars = [];
function initStars(count=100){
  for(let i=0;i<count;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      speed: 0.5+Math.random()*1
    });
  }
}
initStars();

function spawnMeteor(){
  const size = Math.random()*30+20;
  meteors.push({x: Math.random()*(canvas.width-size), y:-size, w:size, h:size, speed:2+Math.random()*3});
  // Play a short beep when a meteor appears
  beep(400, 80);
}

function update(dt){
  // Player movement
  if(keys['ArrowLeft']) player.x -= player.speed;
  if(keys['ArrowRight']) player.x += player.speed;
  player.x = Math.max(0, Math.min(canvas.width-player.w, player.x));

  // Update meteors
  meteors.forEach(m=> m.y += m.speed);
  meteors = meteors.filter(m=> m.y < canvas.height);
  if(performance.now() - lastMeteor > 800){ spawnMeteor(); lastMeteor = performance.now(); }

  // Update background stars (simple parallax)
  stars.forEach(s=> {
    s.y += s.speed;
    if(s.y > canvas.height) s.y = 0;
  });

  // Collision detection
  for(let m of meteors){
    if(m.x < player.x+player.w && m.x+m.w > player.x && m.y < player.y+player.h && m.y+m.h > player.y){
      gameOver = true;
      // Play collision sound
      beep(200, 200);
      break; }
  }
  if(!gameOver) score += dt/1000;
}

// Draw everything: background stars, player ship, meteors, UI
function draw(){
  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Stars
  stars.forEach(s=>{ctx.fillStyle = 'white'; ctx.fillRect(s.x, s.y, 1, 1);});

  // Player ship – simple triangle
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.w/2, player.y - player.h);
  ctx.lineTo(player.x + player.w, player.y);
  ctx.closePath();
  ctx.fill();

  // Meteors – circles with radial gradient
  meteors.forEach(m=>{
    const grad = ctx.createRadialGradient(m.x+m.w/2, m.y+m.h/2, m.w*0.2, m.x+m.w/2, m.y+m.h/2, m.w/2);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x + m.w/2, m.y + m.h/2, m.w/2, 0, Math.PI*2);
    ctx.fill();
  });

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${Math.floor(score)}`,10,20);

  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

let lastTime = 0;
function loop(timestamp){
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if(!gameOver) update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const keys = {};
window.addEventListener('keydown', e=> keys[e.key] = true);
window.addEventListener('keyup', e=> keys[e.key] = false);
