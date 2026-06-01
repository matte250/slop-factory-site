// Simple Starfall Catch game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let bucket = { w: 80, h: 20, x: canvas.width/2 - 40, y: canvas.height - 30, speed: 6 };
let stars = [];
let score = 0, missed = 0;
let lastSpawn = 0, spawnInterval = 1000; // ms

function spawnStar(){
  const radius = 10;
  const x = Math.random() * (canvas.width - 2*radius) + radius;
  const speed = 2 + Math.random()*2;
  stars.push({x, y: -radius, r: radius, s: speed});
}

function update(dt){
  // bucket movement via keyboard
  if(keys['ArrowLeft']) bucket.x = Math.max(0, bucket.x - bucket.speed);
  if(keys['ArrowRight']) bucket.x = Math.min(canvas.width - bucket.w, bucket.x + bucket.speed);
  // mouse movement
  if(mouseX!==null){
    bucket.x = Math.min(canvas.width - bucket.w, Math.max(0, mouseX - bucket.w/2));
  }
  // stars
  for(let i=stars.length-1;i>=0;i--){
    const s = stars[i];
    s.y += s.s;
    // catch?
    if(s.y + s.r >= bucket.y && s.x > bucket.x && s.x < bucket.x + bucket.w){
      stars.splice(i,1);
      score++;
      // Play catch sound (high pitch)
      playTone(800, 0.1);
      // speed up spawning
      spawnInterval = Math.max(300, spawnInterval * 0.98);
    } else if(s.y - s.r > canvas.height){
      stars.splice(i,1);
      missed++;
      // Play miss sound (low pitch)
      playTone(200, 0.3);
      if(missed >= 3) {
        gameOver = true;
        // Play game over sound (descending tone)
        playTone(150, 0.5);
      }
    }
  }
  // spawn logic
  if(!gameOver && Date.now() - lastSpawn > spawnInterval){
    spawnStar();
    lastSpawn = Date.now();
  }
}

function draw(){
  // Background gradient (night sky)
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#004');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Draw bucket with rounded corners and gradient
  const bucketGrad = ctx.createLinearGradient(bucket.x, bucket.y, bucket.x, bucket.y+bucket.h);
  bucketGrad.addColorStop(0, '#777');
  bucketGrad.addColorStop(1, '#333');
  ctx.fillStyle = bucketGrad;
  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(bucket.x + radius, bucket.y);
  ctx.lineTo(bucket.x + bucket.w - radius, bucket.y);
  ctx.quadraticCurveTo(bucket.x + bucket.w, bucket.y, bucket.x + bucket.w, bucket.y + radius);
  ctx.lineTo(bucket.x + bucket.w, bucket.y + bucket.h - radius);
  ctx.quadraticCurveTo(bucket.x + bucket.w, bucket.y + bucket.h, bucket.x + bucket.w - radius, bucket.y + bucket.h);
  ctx.lineTo(bucket.x + radius, bucket.y + bucket.h);
  ctx.quadraticCurveTo(bucket.x, bucket.y + bucket.h, bucket.x, bucket.y + bucket.h - radius);
  ctx.lineTo(bucket.x, bucket.y + radius);
  ctx.quadraticCurveTo(bucket.x, bucket.y, bucket.x + radius, bucket.y);
  ctx.closePath();
  ctx.fill();

  // Stars with glow effect
  for(const s of stars){
    const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r*2);
    grad.addColorStop(0, 'rgba(255,255,180,0.9)');
    grad.addColorStop(0.6, 'rgba(255,255,100,0.4)');
    grad.addColorStop(1, 'rgba(255,255,50,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r*2, 0, Math.PI*2);
    ctx.fill();
  }

  // Score text with subtle shadow
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(`Score: ${score}  Missed: ${missed}`, 10, 20);
  ctx.shadowBlur = 0;

  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
    ctx.font = '20px sans-serif';
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 30);
  }
}

let keys = {};
let mouseX = null;
let gameOver = false;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.5, audioCtx.currentTime + 0.01);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// Resume audio context on first user interaction
function resumeAudio(){ if(audioCtx.state === 'suspended'){ audioCtx.resume(); } }
addEventListener('keydown',e=>{ keys[e.key]=true; resumeAudio(); });
addEventListener('keyup',e=> keys[e.key]=false);
addEventListener('mousemove',e=> {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  resumeAudio();
});
addEventListener('keydown',e=> keys[e.key]=true);
addEventListener('keyup',e=> keys[e.key]=false);
addEventListener('mousemove',e=> {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
});

let lastTime = 0;
function loop(timestamp){
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  if(!gameOver){
    update(dt);
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
