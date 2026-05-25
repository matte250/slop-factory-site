// Skyline Escape – minimal canvas game
// Canvas id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 400;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration = 0.1) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJump() { playTone(440); }
function playSlide() { playTone(220); }
function playHit() { playTone(100, 0.3); }
function playGameOver() { playTone(60, 0.5); }

// player settings
const player = {
  x: 50,
  y: canvas.height - 60,
  w: 30,
  h: 50,
  vy: 0,
  gravity: 0.8,
  jumpStrength: -15,
  slide: false,
  slideTimer: 0,
};

// obstacle pool
const obstacles = [];
let frame = 0;
// clouds for background
const clouds = [];
// game over sound flag
let gameOverPlayed = false;
let gameOver = false;

function spawnObstacle() {
  // Randomly choose obstacle type: gap (low block), bird, or drone
  const rand = Math.random();
  let type;
  if (rand < 0.4) type = 'gap';
  else if (rand < 0.7) type = 'bird';
  else type = 'drone';

  const w = 30;
  const h = type === 'gap' ? 20 : 30;
  const y = type === 'gap' ? canvas.height - h - 10 : canvas.height - 120;
  obstacles.push({ x: canvas.width, y, w, h, type });
}

function spawnCloud() {
  // simple fluffy cloud as a semi‑transparent circle
  const r = Math.random() * 20 + 15; // radius 15‑35
  const speed = Math.random() * 1 + 0.5; // slower than obstacles
  const y = Math.random() * (canvas.height / 2); // upper half of sky
  clouds.push({ x: canvas.width, y, r, speed });
}

function update() {
  if (gameOver) return;
  // player physics
  if (!player.slide) {
    player.vy += player.gravity;
    player.y += player.vy;
    if (player.y > canvas.height - player.h) {
      player.y = canvas.height - player.h;
      player.vy = 0;
    }
  } else {
    player.slideTimer--;
    if (player.slideTimer <= 0) player.slide = false;
  }

  // obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 5;
    // collision detection
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameOver = true;
      playHit();
    }
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // clouds movement
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    c.x -= c.speed;
    if (c.x + c.r < 0) clouds.splice(i, 1);
  }

  // spawn logic
  if (frame % 100 === 0) spawnObstacle();
  if (frame % 200 === 0) spawnCloud();
  frame++;
}

function draw() {
  // Sky gradient background
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#87CEEB'); // light sky
  skyGrad.addColorStop(1, '#4682B4'); // deeper sky
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw clouds (semi‑transparent)
  clouds.forEach(c => {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Simple skyline silhouette
  ctx.fillStyle = '#0A0A0A';
  const skylineHeight = 40;
  ctx.fillRect(0, canvas.height - skylineHeight, canvas.width, skylineHeight);

  // Draw player silhouette (black rectangle with a white eye)
  ctx.fillStyle = '#000';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // eye
  ctx.fillStyle = '#FFF';
  ctx.fillRect(player.x + player.w - 8, player.y + 8, 4, 4);

  // Draw obstacles with type‑specific shapes
  obstacles.forEach(o => {
    if (o.type === 'bird') {
      // simple triangle bird
      ctx.fillStyle = '#FF4500';
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fill();
    } else if (o.type === 'drone') {
      // circle drone
      ctx.fillStyle = '#AAAAAA';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // default block (gap obstacle)
      ctx.fillStyle = '#555';
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }
  });

  // Game over overlay with sound
  if (gameOver) {
    if (!gameOverPlayed) { playGameOver(); gameOverPlayed = true; }
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 80, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// controls
window.addEventListener('keydown', e => {
  // Ensure audio context is running
  if (audioCtx.state === 'suspended') audioCtx.resume();
  if (e.code === 'Space' && player.vy === 0 && !player.slide) {
    player.vy = player.jumpStrength;
    playJump();
  } else if (e.code === 'ArrowDown' && !player.slide) {
    player.slide = true;
    player.slideTimer = 15; // frames
    player.h = 30; // shrink height
    player.y = canvas.height - player.h;
    playSlide();
  }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowDown' && player.slide) {
    player.slide = false;
    player.h = 50;
    player.y = canvas.height - player.h;
  }
});

// start game
loop();
