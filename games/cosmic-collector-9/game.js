// Pixel Dodger – minimalist arcade

const canvas = document.getElementById('game');
if (!canvas) throw new Error('Canvas element with id "game" not found');
const ctx = canvas.getContext('2d');
// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration + 0.02);
}

// Resize canvas to fill its container
function resize() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
window.addEventListener('resize', resize);
resize();

// Player pixel (bottom centre)
const player = {
  w: 10,
  h: 10,
  x: 0, // set after resize
  y: 0, // set after resize
  speed: 4,
  color: '#0ff',
};
function initPlayer() {
  player.x = canvas.width / 2 - player.w / 2;
  player.y = canvas.height - player.h - 5;
}
initPlayer();

// Falling blocks
const blocks = [];
const BLOCK_SIZE = 20;
const SPAWN_INTERVAL = 800; // ms
let lastSpawn = 0;
let score = 0;
let gameOver = false;

function spawnBlock() {
  // play spawn sound
  if (audioCtx.state === 'running') playTone(400, 0.05);

  const x = Math.random() * (canvas.width - BLOCK_SIZE);
  blocks.push({ x, y: -BLOCK_SIZE, w: BLOCK_SIZE, h: BLOCK_SIZE });
}

// Input handling
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  // resume audio on first interaction
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // play move sound
  if (!gameOver && (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D')) {
    playTone(200, 0.03);
  }
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
// also resume audio on pointer interaction
window.addEventListener('pointerdown', () => { if (audioCtx.state === 'suspended') audioCtx.resume(); });
function handleInput() {
  if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
  // clamp
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
}

function update(dt) {
  if (gameOver) return;
  // spawn blocks
  lastSpawn += dt;
  if (lastSpawn > SPAWN_INTERVAL) {
    spawnBlock();
    lastSpawn = 0;
  }
  // move blocks
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.y += 2; // fall speed
    // check collision
    if (
      b.x < player.x + player.w &&
      b.x + b.w > player.x &&
      b.y < player.y + player.h &&
      b.y + b.h > player.y
    ) {
      gameOver = true;
    // play game over sound
    if (audioCtx.state === 'running') playTone(100, 0.4);
    }
    // remove off‑screen blocks and increase score
    if (b.y > canvas.height) {
      blocks.splice(i, 1);
      score++;
    }
  }
  handleInput();
}

function draw() {
  // clear with gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#0a0a2a');
  bgGrad.addColorStop(1, '#001030');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // helper: draw rounded rectangle
  function drawRoundedRect(x, y, w, h, r) {
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
    ctx.fill();
  }

  // draw player as glowing circle
  ctx.save();
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 15;
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // draw blocks with rounded corners and subtle red gradient
  for (const b of blocks) {
    const blockGrad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    blockGrad.addColorStop(0, '#ff4d4d');
    blockGrad.addColorStop(1, '#8b0000');
    ctx.fillStyle = blockGrad;
    drawRoundedRect(b.x, b.y, b.w, b.h, 4);
  }

  // UI
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Score: ${score}`, 10, 20);
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff0';
    ctx.textAlign = 'center';
    ctx.font = '32px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  update(dt);
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
