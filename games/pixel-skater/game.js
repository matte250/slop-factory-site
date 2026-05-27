// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the page.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

// Game constants
const GRAVITY = 0.5;
const JUMP_SPEED = -10;
const PLAYER_SPEED = 3;
const SCROLL_SPEED = 2;
const PLATFORM_HEIGHT = 20;
const PLAYER_SIZE = 20;

// Simple sound helper using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // volume
  oscillator.connect(gain).connect(audioCtx.destination);
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + duration);
}

// Player state
const player = {
  x: 50,
  y: canvas.height - PLATFORM_HEIGHT - PLAYER_SIZE,
  vy: 0,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  onGround: false,
};

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });

// Platform / obstacle management
let platforms = [];
let obstacles = [];
let offsetX = 0; // total scroll offset
let gameOver = false;

function addPlatform(x, w, gap = false) {
  platforms.push({ x, y: canvas.height - PLATFORM_HEIGHT, w, gap });
}

function addObstacle(x, type) {
  // type: 'spike'
  obstacles.push({ x, y: canvas.height - PLATFORM_HEIGHT - 10, w: 10, h: 10, type });
}

// Initialize first platform
addPlatform(0, canvas.width * 2);

function update() {
  if (gameOver) return;

  // Scroll world
  offsetX += SCROLL_SPEED;
  platforms.forEach(p => p.x -= SCROLL_SPEED);
  obstacles.forEach(o => o.x -= SCROLL_SPEED);

  // Remove off‑screen elements
  platforms = platforms.filter(p => p.x + p.w > 0);
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // Possibly add new platform segment
  const last = platforms[platforms.length - 1];
  if (last && last.x + last.w < canvas.width + offsetX) {
    const gap = Math.random() < 0.2; // 20% chance of gap
    const segWidth = 200 + Math.random() * 200;
    addPlatform(last.x + last.w + (gap ? 50 : 0), segWidth, gap);
    if (!gap && Math.random() < 0.3) {
      // add a spike obstacle on the platform
      addObstacle(last.x + last.w - 30, 'spike');
    }
  }

  // Player movement
  if (keys['ArrowLeft']) player.x -= PLAYER_SPEED;
  if (keys['ArrowRight']) player.x += PLAYER_SPEED;
  if (keys['ArrowUp'] && player.onGround) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
    playTone(600, 0.08); // jump sound
  }

  // Apply gravity
  player.vy += GRAVITY;
  player.y += player.vy;

  // Collision with ground/platforms
  player.onGround = false;
  for (const p of platforms) {
    if (p.gap) continue; // no ground in gaps
    const px = player.x;
    const py = player.y + player.height;
    if (px + player.width > p.x && px < p.x + p.w && py >= p.y && py <= p.y + PLAYER_SPEED) {
      player.y = p.y - player.height;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Falling off screen ends game
  if (player.y > canvas.height) {
    playTone(200, 0.3); // fall / game over sound
    gameOver = true;
  }

  // Spike collision
  for (const o of obstacles) {
    if (o.type === 'spike') {
      const collides =
        player.x < o.x + o.w &&
        player.x + player.width > o.x &&
        player.y < o.y + o.h &&
        player.y + player.height > o.y;
      if (collides) {
        playTone(150, 0.2); // spike hit sound
        gameOver = true;
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background gradient (sky)
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#87ceeb'); // light sky blue
  bgGrad.addColorStop(1, '#e0f7fa'); // pale cyan
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw platforms with subtle gradient
  for (const p of platforms) {
    if (p.gap) continue;
    const platGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + PLATFORM_HEIGHT);
    platGrad.addColorStop(0, '#444');
    platGrad.addColorStop(1, '#777');
    ctx.fillStyle = platGrad;
    ctx.fillRect(p.x, p.y, p.w, PLATFORM_HEIGHT);
  }

  // Draw spikes with shading
  for (const o of obstacles) {
    if (o.type === 'spike') {
      ctx.beginPath();
      ctx.moveTo(o.x, o.y + o.h);
      ctx.lineTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.closePath();
      ctx.fillStyle = '#b71c1c'; // dark red
      ctx.fill();
      // highlight tip
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w / 2 - 2, o.y + 4);
      ctx.lineTo(o.x + o.w / 2 + 2, o.y + 4);
      ctx.closePath();
      ctx.fillStyle = '#ff8a80'; // light red
      ctx.fill();
    }
  }

  // Draw player as a stylized skater
  ctx.fillStyle = '#00e676'; // bright green
  // body
  ctx.fillRect(player.x, player.y, player.width, player.height * 0.6);
  // head (circle)
  ctx.beginPath();
  ctx.arc(player.x + player.width / 2, player.y - player.height * 0.2, player.height * 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Game over overlay
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

function loop() {
  if (!gameOver) update();
  draw();
  requestAnimationFrame(loop);
}

// Start the game
loop();
