// Simple endless runner based on IDEA.md
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// game state
let running = true;
let frame = 0;
let score = 0;

// player
const player = {
  w: 30,
  h: 30,
  x: 50,
  y: HEIGHT - 30,
  vy: 0,
  jumpStrength: -12,
  gravity: 0.6,
  onGround() { return this.y >= HEIGHT - this.h; }
};

// obstacles
const obstacles = [];
function spawnObstacle() {
  const w = 20 + Math.random() * 30;
  const h = 20 + Math.random() * 40;
  obstacles.push({ x: WIDTH, y: HEIGHT - h, w, h });
}

// audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// input
function jump() {
  if (player.onGround()) {
    player.vy = player.jumpStrength;
    playTone(440, 0.1); // jump sound
  }
}
function resumeAudio() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
window.addEventListener('keydown', e => { resumeAudio(); if (e.code === 'Space') jump(); });
canvas.addEventListener('click', e => { resumeAudio(); jump(); });

function update() {
  // player physics
  player.vy += player.gravity;
  player.y += player.vy;
  if (player.y > HEIGHT - player.h) { player.y = HEIGHT - player.h; player.vy = 0; }

  // obstacles movement
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.x -= 5;
    // collision
    if (player.x < o.x + o.w && player.x + player.w > o.x &&
        player.y < o.y + o.h && player.y + player.h > o.y) {
      running = false;
    }
    // remove off-screen
    if (o.x + o.w < 0) obstacles.splice(i, 1);
  }

  // spawn new obstacles
  if (frame % 120 === 0) spawnObstacle();

  // update score
  if (frame % 5 === 0) score++;
}

function draw() {
  // sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, '#87ceeb');
  sky.addColorStop(1, '#e0f6ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ground
  ctx.fillStyle = '#654321';
  ctx.fillRect(0, HEIGHT - 30, WIDTH, 30);

  // player - rounded rectangle
  ctx.fillStyle = '#0af';
  const radius = 6;
  ctx.beginPath();
  ctx.moveTo(player.x + radius, player.y);
  ctx.lineTo(player.x + player.w - radius, player.y);
  ctx.quadraticCurveTo(player.x + player.w, player.y, player.x + player.w, player.y + radius);
  ctx.lineTo(player.x + player.w, player.y + player.h - radius);
  ctx.quadraticCurveTo(player.x + player.w, player.y + player.h, player.x + player.w - radius, player.y + player.h);
  ctx.lineTo(player.x + radius, player.y + player.h);
  ctx.quadraticCurveTo(player.x, player.y + player.h, player.x, player.y + player.h - radius);
  ctx.lineTo(player.x, player.y + radius);
  ctx.quadraticCurveTo(player.x, player.y, player.x + radius, player.y);
  ctx.closePath();
  ctx.fill();

  // obstacles - varied colors
  obstacles.forEach(o => {
    const hue = Math.floor((o.x / WIDTH) * 360) % 360;
    ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  // score
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText('Score: ' + score, 10, 30);
}

function loop() {
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', WIDTH/2-60, HEIGHT/2);
    return;
  }
  frame++;
  update();
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
