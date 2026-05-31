// Simple "Pixel Dodger" game with enhanced graphics
// Targets a <canvas id="game"> element.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

// Utility: draw rounded rectangle
function drawRoundedRect(x, y, w, h, r, fillStyle) {
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
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

// Simple sound helper using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
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

// Player configuration
const player = {
  w: 40,
  h: 20,
  x: W / 2 - 20,
  y: H - 30,
  speed: 6,
  color: '#00aaff'
};

// Falling blocks configuration
const blocks = [];
const blockSize = 20;
let spawnTimer = 0;
const spawnInterval = 30; // frames

let score = 0;
let running = true;

// Input handling
let left = false, right = false;
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') {
    left = true;
    playTone(400, 0.05); // move left sound
  }
  if (e.key === 'ArrowRight') {
    right = true;
    playTone(400, 0.05); // move right sound
  }
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') left = false;
  if (e.key === 'ArrowRight') right = false;
});
// Mouse / touch controls (move player to pointer x)
function setPointerX(x) {
  player.x = Math.max(0, Math.min(W - player.w, x - player.w / 2));
}
canvas.addEventListener('mousemove', e => setPointerX(e.offsetX));
canvas.addEventListener('touchmove', e => {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  setPointerX(touch.clientX - rect.left);
  e.preventDefault();
}, {passive:false});

function update() {
  if (!running) return;
  // move player via keyboard
  if (left) player.x = Math.max(0, player.x - player.speed);
  if (right) player.x = Math.min(W - player.w, player.x + player.speed);

  // spawn blocks
  if (spawnTimer <= 0) {
    const x = Math.random() * (W - blockSize);
    const hue = Math.floor(Math.random() * 360);
    blocks.push({x, y: -blockSize, speed: 2 + Math.random() * 2, hue});
    spawnTimer = spawnInterval;
  } else {
    spawnTimer--;
  }

  // update blocks and detect collisions
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.y += b.speed;
    if (b.y + blockSize > player.y &&
        b.x < player.x + player.w &&
        b.x + blockSize > player.x) {
      // collision sound
      playTone(150, 0.3);
      running = false;
    }
    if (b.y > H) blocks.splice(i, 1);
  }

  score++;
  draw();
  requestAnimationFrame(update);
}

function draw() {
  // Dark gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#111');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // player – rounded rectangle with subtle gradient
  const playerGrad = ctx.createLinearGradient(0, player.y, 0, player.y + player.h);
  playerGrad.addColorStop(0, '#33ddff');
  playerGrad.addColorStop(1, '#0066aa');
  drawRoundedRect(player.x, player.y, player.w, player.h, 4, playerGrad);

  // blocks – colored circles with radial gradient
  blocks.forEach(b => {
    const radGrad = ctx.createRadialGradient(
      b.x + blockSize/2, b.y + blockSize/2, blockSize/4,
      b.x + blockSize/2, b.y + blockSize/2, blockSize/2
    );
    radGrad.addColorStop(0, `hsl(${b.hue},80%,70%)`);
    radGrad.addColorStop(1, `hsl(${b.hue},80%,30%)`);
    drawRoundedRect(b.x, b.y, blockSize, blockSize, 3, radGrad);
  });

  // score overlay
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score / 60), 10, 20);

  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffdd33';
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillText('Game Over', W/2, H/2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 60), W/2, H/2 + 30);
  }
}

// start the loop
requestAnimationFrame(update);
