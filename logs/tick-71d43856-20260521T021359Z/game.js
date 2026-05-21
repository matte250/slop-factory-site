// Improved graphics side‑scroll runner
// Added sky gradient, ground line, rounded player, obstacle visuals
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 200;
// audio context for sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
// specific sound helpers
function playJumpSound() { playSound(440, 0.1); }
function playSlideSound() { playSound(200, 0.08); }
function playHitSound() { playSound(100, 0.3); }

// player
const player = {
  w: 20,
  h: 20,
  x: 50,
  y: canvas.height - 40,
  vy: 0,
  onGround: true,
  slide: false,
};

const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const SLIDE_TIME = 15;
let slideTimer = 0;

// obstacles
const obstacles = [];
// decorative clouds for parallax background
const clouds = [];
const CLOUD_FREQ = 300; // frames
const CLOUD_SPEED = 1;
const OBSTACLE_FREQ = 120; // frames
let frameCount = 0;

function spawnObstacle() {
  const type = Math.random() < 0.5 ? 'spike' : 'bar';
  if (type === 'spike') {
    obstacles.push({x: canvas.width, y: canvas.height - 30, w: 20, h: 20, type});
  } else {
    const h = 40 + Math.random() * 40;
    obstacles.push({x: canvas.width, y: canvas.height - h, w: 20, h, type});
  }
}

// spawn simple fluffy cloud for background
function spawnCloud() {
  const w = 30 + Math.random() * 40;
  const h = w * 0.6;
  const y = 20 + Math.random() * (canvas.height / 2 - 40);
  clouds.push({x: canvas.width, y, w, h});
}

function update() {
  frameCount++;
  if (frameCount % OBSTACLE_FREQ === 0) spawnObstacle();
  if (frameCount % CLOUD_FREQ === 0) spawnCloud();

  // player physics
  if (!player.onGround) player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= canvas.height - 40) {
    player.y = canvas.height - 40;
    player.vy = 0;
    player.onGround = true;
  }
  // slide timer
  if (slideTimer > 0) {
    slideTimer--;
    if (slideTimer === 0) player.slide = false;
  }

  // move obstacles left
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 4;
    // collision
    if (o.x < player.x + player.w && o.x + o.w > player.x &&
        o.y < player.y + player.h && o.y + o.h > player.y) {
      gameOver();
      return;
    }
    // remove off‑screen
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // move clouds left (parallax)
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x -= CLOUD_SPEED;
    if (c.x + c.w < 0) clouds.splice(i, 1);
  }
}

function draw() {
  // sky background gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(1, '#fff');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  // ground line
  ctx.strokeStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 20);
  ctx.lineTo(canvas.width, canvas.height - 20);
  ctx.stroke();

  // player (rounded rectangle with shadow)
  const ph = player.slide ? player.h / 2 : player.h;
  const py = player.slide ? player.y + player.h / 2 : player.y;
  const radius = 5;
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(player.x + radius, py);
  ctx.lineTo(player.x + player.w - radius, py);
  ctx.quadraticCurveTo(player.x + player.w, py, player.x + player.w, py + radius);
  ctx.lineTo(player.x + player.w, py + ph - radius);
  ctx.quadraticCurveTo(player.x + player.w, py + ph, player.x + player.w - radius, py + ph);
  ctx.lineTo(player.x + radius, py + ph);
  ctx.quadraticCurveTo(player.x, py + ph, player.x, py + ph - radius);
  ctx.lineTo(player.x, py + radius);
  ctx.quadraticCurveTo(player.x, py, player.x + radius, py);
  ctx.fill();

  // clouds (parallax background)
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // obstacles
  obstacles.forEach(o => {
    if (o.type === 'spike') {
      // draw triangle spike
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    } else {
      // bar obstacle
      ctx.fillStyle = '#aa0000';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  });

  // player (rounded rectangle with shadow)
  const ph = player.slide ? player.h / 2 : player.h;
  const py = player.slide ? player.y + player.h / 2 : player.y;
  const radius = 5;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#0f0';
  ctx.beginPath();
  ctx.moveTo(player.x + radius, py);
  ctx.lineTo(player.x + player.w - radius, py);
  ctx.quadraticCurveTo(player.x + player.w, py, player.x + player.w, py + radius);
  ctx.lineTo(player.x + player.w, py + ph - radius);
  ctx.quadraticCurveTo(player.x + player.w, py + ph, player.x + player.w - radius, py + ph);
  ctx.lineTo(player.x + radius, py + ph);
  ctx.quadraticCurveTo(player.x, py + ph, player.x, py + ph - radius);
  ctx.lineTo(player.x, py + radius);
  ctx.quadraticCurveTo(player.x, py, player.x + radius, py);
  ctx.fill();
  ctx.restore();


let running = true;
function gameOver() {
  running = false;
  playHitSound();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '30px sans-serif';
  ctx.fillText('Game Over', canvas.width/2-80, canvas.height/2);
}

function loop() {
  if (!running) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

// controls
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowUp' && player.onGround && !player.slide) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    playJumpSound();
  }
  if (e.code === 'ArrowDown' && player.onGround && !player.slide) {
    player.slide = true;
    slideTimer = SLIDE_TIME;
    playSlideSound();
  }
});

loop();
