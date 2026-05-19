// Minimal Neon Runner game with enhanced neon graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function beep(freq, duration) {
  // Ensure AudioContext is running (required after user interaction)
  if (audioCtx.state !== 'running') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJump() { beep(440, 0.08); }
function playSlide() { beep(660, 0.06); }
function playCrash() { beep(200, 0.3); }
// Optional ambient hum
function playHum() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 30;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.start();
  // keep playing; not stopped
}
playHum();

// Player
const player = {
  w: 30,
  h: 30,
  x: 50,
  y: canvas.height - 30,
  vy: 0,
  gravity: 0.8,
  jumpStrength: -15,
  sliding: false,
  slideTimer: 0,
  update() {
      // Update trail for afterimage effect
      this.trail = this.trail || [];
      this.trail.push({x: this.x, y: this.y, life: 20});
      if (this.trail.length > 20) this.trail.shift();
      // Decay trail entries
      this.trail.forEach(t => t.life--);
      this.trail = this.trail.filter(t => t.life > 0);

      if (this.sliding) {
        this.slideTimer -= 1;
        if (this.slideTimer <= 0) this.sliding = false;
      }
      this.vy += this.gravity;
      this.y += this.vy;
      if (this.y > canvas.height - this.h) this.y = canvas.height - this.h, this.vy = 0;
    },
  draw() {
    ctx.save();
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 12;
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#04f');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.w, this.sliding ? this.h/2 : this.h);
    ctx.restore();
  },
  jump() { if (this.y >= canvas.height - this.h) this.vy = this.jumpStrength; },
  slide() { if (!this.sliding && this.y >= canvas.height - this.h) { this.sliding = true; this.slideTimer = 20; } }
};

// Obstacles
const obstacles = [];
// Grid for neon background
let gridOffset = 0;
const gridSpacing = 40;
function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(0,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let x = gridOffset % gridSpacing; x < canvas.width; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.restore();
  gridOffset += 2;
}
const neonColors = ['#0ff','#f0f','#ff0','#0f0','#f00'];
function getNeonColor(){return neonColors[Math.floor(Math.random()*neonColors.length)];}
function spawnObstacle() {
  const type = Math.random() < 0.5 ? 'low' : 'high';
  const w = 20, h = type === 'low' ? 30 : 30;
  const y = type === 'low' ? canvas.height - h : canvas.height - h - player.h - 10;
  obstacles.push({ x: canvas.width, y, w, h, type });
}
let spawnTimer = 0;

function updateObstacles() {
  spawnTimer--;
  if (spawnTimer <= 0) { spawnObstacle(); spawnTimer = 60 + Math.random()*60; }
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 5;
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }
}

function drawObstacles() {
  ctx.save();
  ctx.shadowColor = 'rgba(255,0,255,0.6)';
  ctx.shadowBlur = 10;
  obstacles.forEach(o => {
    const base = getNeonColor();
    const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
    grad.addColorStop(0, base);
    grad.addColorStop(1, base);
    ctx.fillStyle = grad;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  ctx.restore();
}

function checkCollision() {
  for (const o of obstacles) {
    const pw = player.w;
    const ph = player.sliding ? player.h/2 : player.h;
    if (player.x < o.x + o.w && player.x + pw > o.x &&
        player.y < o.y + o.h && player.y + ph > o.y) {
      return true;
    }
  }
  return false;
}

let score = 0;
let gameOver = false;
function drawPlayerTrail(){
  if(!player.trail) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  player.trail.forEach(t=>{
    const alpha = t.life/20;
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.fillRect(t.x, t.y, player.w, player.h);
  });
  ctx.restore();
}

let time = 0;
// Starfield for background
const stars = [];
function initStars(count=80){
  for(let i=0;i<count;i++){
    stars.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.random()*2+1});
  }
}
function drawStars(){
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6;
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
    ctx.fill();
    // move left slowly for parallax
    s.x -= 0.3;
    if(s.x < 0) s.x = canvas.width;
  });
  ctx.restore();
}
initStars();
function drawPlayerTrail(){
  if(!player.trail) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  player.trail.forEach(t=>{
    const alpha = t.life/20;
    ctx.fillStyle = `rgba(0,255,255,${alpha})`;
    ctx.fillRect(t.x, t.y, player.w, player.h);
  });
  ctx.restore();
}

function loop() {
  if (gameOver) return;
  // Fade previous frame for motion blur effect
  ctx.fillStyle = 'rgba(0,0,10,0.2)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw starfield background
  drawStars();
  // Draw neon gradient background
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,"#001");
  bgGrad.addColorStop(1,"#004");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw moving neon grid
  drawGrid();
  player.update();
  // Draw afterimage trail
  drawPlayerTrail();
  player.draw();
  updateObstacles();
  drawObstacles();
  if (checkCollision()) { gameOver = true; playCrash(); alert('Game Over! Score: ' + Math.floor(score)); return; }
  score += 0.1;
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  time++;
  requestAnimationFrame(loop);
}
  if (gameOver) return;
  // Fade previous frame for motion blur effect
  ctx.fillStyle = 'rgba(0,0,10,0.2)';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw neon gradient background
  const bgGrad = ctx.createLinearGradient(0,0,0,canvas.height);
  bgGrad.addColorStop(0,"#001");
  bgGrad.addColorStop(1,"#004");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Draw moving neon grid
  drawGrid();
  player.update();
  player.draw();
  updateObstacles();
  drawObstacles();
  if (checkCollision()) { gameOver = true; playCrash(); alert('Game Over! Score: ' + Math.floor(score)); return; }
  score += 0.1;
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  requestAnimationFrame(loop);
}

// Controls
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { player.jump(); playJump(); }
  else if (e.code === 'ArrowDown') { player.slide(); playSlide(); }
});

// Start
requestAnimationFrame(loop);
