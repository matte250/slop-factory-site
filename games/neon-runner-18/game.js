// Simple Neon Runner game
// Canvas with id="game" must exist in the HTML

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.width || 800;
canvas.height = canvas.height || 400;

// Visual config
const STAR_COUNT = 80;
const stars = [];
function initStars(){
  for(let i=0;i<STAR_COUNT;i++){
    stars.push({
      x: Math.random()*canvas.width,
      y: Math.random()*canvas.height,
      r: Math.random()*2+0.5
    });
  }
}
initStars();

// Sound config using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJumpSound(){ playTone(600, 0.1); }
function playHitSound(){ playTone(150, 0.3); }
// simple background hum
setInterval(()=>{ playTone(200, 0.2); }, 3000);


const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 3;

let gameOver = false;

// Player
const player = {
  x: 80,
  y: canvas.height - 60,
  w: 30,
  h: 30,
  vy: 0,
  onGround: false,
  draw() {
    // neon glow effect
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#0ff';
    ctx.fillStyle = '#0ff';
    ctx.fillRect(this.x, this.y, this.w, this.h);
    ctx.shadowBlur = 0;
  },
  update() {
    this.vy += GRAVITY;
    this.y += this.vy;
    // floor collision (temporary ground)
    if (this.y + this.h > canvas.height) {
      this.y = canvas.height - this.h;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  },
  jump() {
    if (this.onGround) {
      this.vy = JUMP;
      this.onGround = false;
      playJumpSound();
    }
  }
};

// Platforms and spikes
let platforms = [];
let spikes = [];

function addPlatform(x, w, y) {
  platforms.push({x, y, w, h: 20});
  // add spikes on top with 20% chance per segment
  for (let i = 0; i < w; i += 40) {
    if (Math.random() < 0.2) {
      spikes.push({x: x + i, y: y - 20, w: 20, h: 20});
    }
  }
}

// initial platform
addPlatform(0, canvas.width, canvas.height - 20);
let lastPlatformEnd = canvas.width;

function updateWorld() {
  // move platforms and spikes left
  platforms.forEach(p => p.x -= SPEED);
  spikes.forEach(s => s.x -= SPEED);

  // remove off‑screen
  platforms = platforms.filter(p => p.x + p.w > 0);
  spikes = spikes.filter(s => s.x + s.w > 0);

  // generate new platform if needed
  if (lastPlatformEnd - SPEED < canvas.width) {
    const gap = 80 + Math.random() * 120; // distance between platforms
    const pw = 100 + Math.random() * 150;
    const py = canvas.height - 20 - Math.random() * 80; // height variation
    addPlatform(lastPlatformEnd + gap, pw, py);
    lastPlatformEnd += gap + pw;
  }
}

function checkCollisions() {
  // spike collision
  for (const s of spikes) {
    if (
      player.x < s.x + s.w &&
      player.x + player.w > s.x &&
      player.y < s.y + s.h &&
      player.y + player.h > s.y
    ) {
      playHitSound();
      gameOver = true;
      return;
    }
  }
  // platform landing (simple)
  player.onGround = false;
  for (const p of platforms) {
    if (
      player.vy >= 0 &&
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + p.h
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
  // fall off screen
  if (player.y > canvas.height) { playHitSound(); gameOver = true; }
}

// input
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') player.jump();
});

function drawBackground(){
  // dark gradient sky
  const grad = ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,'#001');
  grad.addColorStop(1,'#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // stars
  ctx.fillStyle = '#fff';
  stars.forEach(s=>{
    ctx.beginPath();
    ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
    ctx.fill();
  });
}

function loop() {
  if (gameOver) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f00';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
    return;
  }
  // clear and draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  updateWorld();
  player.update();
  checkCollisions();

  // draw platforms with neon glow
  ctx.fillStyle = '#0ff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#0ff';
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));
  ctx.shadowBlur = 0;
  // draw spikes with neon red
  ctx.fillStyle = '#f00';
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#f00';
  spikes.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y + s.h);
    ctx.lineTo(s.x + s.w / 2, s.y);
    ctx.lineTo(s.x + s.w, s.y + s.h);
    ctx.closePath();
    ctx.fill();
  });
  ctx.shadowBlur = 0;

  player.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
