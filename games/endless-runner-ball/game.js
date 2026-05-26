// Simple endless runner based on IDEA.md
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

// Game settings
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const SPEED = 4;

// Audio context and simple tone generator
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, length) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'square';
  gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + length);
}
function playJump(){ playTone(300, 0.1); }
function playCoin(){ playTone(600, 0.07); }
function playGameOver(){ playTone(150, 0.3); }

// Player (ball)
const ball = { x: 80, y: 0, r: 12, vy: 0, onGround: false };

// Platform & coin storage
let platforms = [];
let coins = [];
let score = 0;
let gameOver = false;

// Helper: create a platform
function addPlatform(x, w, gap = false) {
  const y = canvas.height - 40; // ground level
  platforms.push({ x, y, w, h: 40, spike: false });
  // maybe add a coin on top
  if (Math.random() < 0.4) {
    const cx = x + w / 2;
    const cy = y - 20;
    coins.push({ x: cx, y: cy, r: 6, collected: false });
  }
  // occasional spike
  if (Math.random() < 0.2) {
    platforms[platforms.length - 1].spike = true; // simple spike flag
  }
}

// Initialize first platform
addPlatform(0, canvas.width);

function resetGame() {
  ball.y = 0; ball.vy = 0; score = 0; gameOver = false; platforms = []; coins = [];
  addPlatform(0, canvas.width);
}

canvas.addEventListener('click', () => { if (audioCtx.state === 'suspended') audioCtx.resume();
  if (gameOver) { resetGame(); return; }
  if (ball.onGround) { ball.vy = JUMP_VELOCITY; playJump(); }
});

function update() {
  if (gameOver) return;

  // Apply gravity
  ball.vy += GRAVITY;
  ball.y += ball.vy;

  // Move platforms left
  platforms.forEach(p => p.x -= SPEED);
  coins.forEach(c => c.x -= SPEED);

  // Remove off‑screen platforms/coins
  while (platforms.length && platforms[0].x + platforms[0].w < 0) platforms.shift();
  while (coins.length && coins[0].x + coins[0].r < 0) coins.shift();

  // Ensure next platform exists
  const last = platforms[platforms.length - 1];
  if (last && last.x + last.w < canvas.width) {
    const gap = Math.random() * 120 + 80; // gap size
    const w = Math.random() * 200 + 120; // platform width
    addPlatform(last.x + last.w + gap, w);
  }

  // Collision with platforms (simple AABB)
  ball.onGround = false;
  for (const p of platforms) {
    if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w) {
      const platformTop = p.y - ball.r;
      if (ball.y >= platformTop && ball.vy >= 0) {
        ball.y = p.y - ball.r;
        ball.vy = 0;
        ball.onGround = true;
        // Spike check – treat as instant death
        if (p.spike) {
          playGameOver();
          gameOver = true;
        }
        break;
      }
    }
  }

  // Collect coins
  for (const c of coins) {
    if (!c.collected && Math.hypot(ball.x - c.x, ball.y - c.y) < ball.r + c.r) {
      c.collected = true; score++; playCoin();
    }
  }

  // Fall off screen → game over
  if (ball.y - ball.r > canvas.height) { playGameOver(); gameOver = true; }
}

function draw() {
  // Background gradient (sky -> ground)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#87ceeb'); // sky blue
  bgGrad.addColorStop(1, '#c2b280'); // earthy
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw platforms with subtle shading
  platforms.forEach(p => {
    const platGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    platGrad.addColorStop(0, '#777');
    platGrad.addColorStop(1, '#444');
    ctx.fillStyle = platGrad;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    if (p.spike) {
      ctx.fillStyle = '#a00';
      ctx.beginPath();
      ctx.moveTo(p.x + p.w / 2 - 10, p.y);
      ctx.lineTo(p.x + p.w / 2 + 10, p.y);
      ctx.lineTo(p.x + p.w / 2, p.y - 20);
      ctx.closePath();
      ctx.fill();
    }
  });

  // Draw coins with radial gradient for 3‑D look
  coins.forEach(c => {
    if (!c.collected) {
      const coinGrad = ctx.createRadialGradient(c.x, c.y, c.r * 0.3, c.x, c.y, c.r);
      coinGrad.addColorStop(0, '#ffea00');
      coinGrad.addColorStop(1, '#b8860b');
      ctx.fillStyle = coinGrad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Draw ball with shading and slight shadow
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y + ball.r * 0.5, ball.r, 0, Math.PI * 2);
  ctx.fill();
  // Ball gradient
  const ballGrad = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.1, ball.x, ball.y, ball.r);
  ballGrad.addColorStop(0, '#6ec6ff');
  ballGrad.addColorStop(1, '#004e92');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Score text with drop shadow for readability
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  ctx.fillText('Score: ' + score, 10, 30);
  ctx.shadowColor = 'transparent';

  // Game over overlay with larger, bold text
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '24px sans-serif';
    ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = 'left';
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
