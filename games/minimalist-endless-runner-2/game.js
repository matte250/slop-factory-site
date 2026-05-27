// Minimal endless runner on canvas#game with enhanced graphics
const canvas = document.getElementById('game');
// Audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}
function playJumpSound(){ playTone(500, 0.1); }
function playGameOverSound(){ playTone(150, 0.6); }
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Player
const player = {x: 50, y: canvas.height - 30, w: 20, h: 20, vy: 0, jumpStrength: -12, grounded: true};

// Particle system for jump effect
const particles = [];
function createParticle(x, y) {
  particles.push({x, y, vy: -2 - Math.random()*2, life: 30, size: 3 + Math.random()*2});
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.vy += 0.1; // gravity
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// Starfield background
const stars = [];
for (let i = 0; i < 80; i++) {
  stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, r: 1 + Math.random()*2});
}

// Obstacles
let obstacles = [];
let obstacleTimer = 0;
const obstacleInterval = 90; // frames
let speed = 4;
let score = 0;
let gameOver = false;

function spawnObstacle() {
  const type = Math.random() < 0.5 ? 'triangle' : 'circle';
  const size = 20 + Math.random()*10;
  const o = {type, x: canvas.width, y: canvas.height - size, size, w: size, h: size};
  obstacles.push(o);
}

function update() {
  // update particle system
  updateParticles();
  // move stars for parallax effect
  stars.forEach(s => { s.x -= speed * 0.3; if (s.x < 0) { s.x = canvas.width; s.y = Math.random()*canvas.height; } });
  if (gameOver) return;
  // player physics
  player.vy += 0.6; // gravity
  player.y += player.vy;
  if (player.y + player.h >= canvas.height) {
    player.y = canvas.height - player.h;
    player.vy = 0;
    player.grounded = true;
  } else player.grounded = false;

  // obstacles
  obstacleTimer++;
  if (obstacleTimer > obstacleInterval) { spawnObstacle(); obstacleTimer = 0; }
  obstacles.forEach(o => o.x -= speed);
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // collision
  for (const o of obstacles) {
if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        gameOver = true;
        // play game over sound (resume context if needed)
        if (audioCtx.state !== 'running') audioCtx.resume();
        playGameOverSound();
      }
  }

  // increase difficulty
  speed += 0.001;
  score++;
}

function draw() {
  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#001d3d');
  grad.addColorStop(1, '#003566');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // helper for rounded rect
  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
  // clear by redrawing gradient (already drawn above)
  // player (rounded, with shadow)
  ctx.save();
  ctx.fillStyle = '#0f0';
  ctx.shadowColor = 'rgba(0,255,0,0.5)';
  ctx.shadowBlur = 8;
  roundedRect(player.x, player.y, player.w, player.h, 4);
  ctx.fill();
  ctx.restore();
  // obstacles (stylized)
  for (const o of obstacles) {
    ctx.save();
    ctx.fillStyle = o.type === 'circle' ? '#ff8800' : '#ff0044';
    ctx.shadowColor = 'rgba(255,0,0,0.4)';
    ctx.shadowBlur = 6;
    if (o.type === 'circle') {
      ctx.beginPath();
      ctx.arc(o.x + o.size/2, o.y + o.size/2, o.size/2, 0, Math.PI*2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.size);
      ctx.lineTo(o.x + o.size/2, o.y);
      ctx.lineTo(o.x + o.size, o.y + o.size);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // score
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: '+score, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Input: single tap/space triggers jump
window.addEventListener('keydown', e=>{ if(e.code==='Space') jump(); });
canvas.addEventListener('click', jump);
function jump(){
  if(player.grounded){
    player.vy = player.jumpStrength;
    player.grounded = false;
    // play jump sound, ensure audio context is running
    if (audioCtx.state !== 'running') audioCtx.resume();
    playJumpSound();
  }
}

loop();
