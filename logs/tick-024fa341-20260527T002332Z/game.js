// Canvas Dodge game with enhanced graphics
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}
// resume audio on first interaction
window.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 600;

const player = { w: 40, h: 20, x: canvas.width/2 - 20, y: canvas.height - 30, speed: 5 };
let asteroids = [];
let lives = 3;
let score = 0;
let frame = 0;
let gameOver = false;



function update() {
  // move stars down to simulate scrolling
  stars.forEach(s => {
    s.y += 0.5;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
  });
  if (gameOver) return;
  // player movement
  if (keys['ArrowLeft']) player.x = Math.max(0, player.x - player.speed);
  if (keys['ArrowRight']) player.x = Math.min(canvas.width - player.w, player.x + player.speed);

  // asteroids
  asteroids.forEach(a => a.y += a.speed);
  // remove passed asteroids & increase score
  asteroids = asteroids.filter(a => {
    if (a.y > canvas.height) { score++; playTone(440, 0.05); return false; }
    // collision
    if (a.x < player.x + player.w && a.x + a.size > player.x && a.y < player.y + player.h && a.y + a.size > player.y) {
      playTone(200, 0.2); // collision sound
  lives--; if (lives <= 0) { playTone(100, 0.5); gameOver = true; }
      return false; // remove collided asteroid
    }
    return true;
  });

  // spawn new asteroids over time
  if (frame % 60 === 0) spawnAsteroid();
  frame++;
}

// Generate starfield background
const stars = [];

// Spawn asteroids with rotation
function spawnAsteroid() {
  const size = Math.random() * 30 + 20;
  asteroids.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 2 + frame * 0.001,
    angle: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.02
  });
}

function initStars(count = 100) {
function initStars(count = 100) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
}
initStars();

function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // fill background
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw starfield
  ctx.fillStyle = 'white';
  stars.forEach(s => {
    ctx.globalAlpha = s.alpha;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  // player ship (gradient triangle)
  const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x, player.y + player.h);
  shipGrad.addColorStop(0, '#00ffff');
  shipGrad.addColorStop(1, '#0066ff');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w/2, player.y);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
  // asteroids
  ctx.fillStyle = 'gray';
  // draw asteroids as circles with gradient
  asteroids.forEach(a => {
    // update rotation angle
    a.angle += a.rotSpeed;
    // draw rotating asteroid as gradient triangle
    const grad = ctx.createRadialGradient(
      a.x + a.size/2,
      a.y + a.size/2,
      a.size*0.2,
      a.x + a.size/2,
      a.y + a.size/2,
      a.size/2
    );
    grad.addColorStop(0, '#a9a9a9');
    grad.addColorStop(1, '#555');
    ctx.save();
    ctx.translate(a.x + a.size/2, a.y + a.size/2);
    ctx.rotate(a.angle);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -a.size/2);
    ctx.lineTo(a.size/2, a.size/2);
    ctx.lineTo(-a.size/2, a.size/2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // HUD
  ctx.fillStyle = 'white';
  ctx.font = '16px monospace';
  ctx.fillText(`Lives: ${lives}`, 10, 20);
  ctx.fillText(`Score: ${score}`, 10, 40);
  if (gameOver) {
    ctx.fillStyle = 'red';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width/2 - 120, canvas.height/2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

const keys = {};
window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

loop();
