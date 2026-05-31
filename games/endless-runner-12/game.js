// Simple endless‑runner for canvas#game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.clientWidth || 800;
canvas.height = canvas.clientHeight || 400;

// Game parameters
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const PLAYER_SIZE = 30;
const GROUND_HEIGHT = 20;

let player = {x: 50, y: canvas.height - GROUND_HEIGHT - PLAYER_SIZE, vy: 0, w: PLAYER_SIZE, h: PLAYER_SIZE};
let obstacles = [];
let frame = 0;
let score = 0;
let gameOver = false;

function reset() {
  player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
  player.vy = 0;
  obstacles = [];
  frame = 0;
  score = 0;
  gameOver = false;
  requestAnimationFrame(loop);
}

function spawnObstacle() {
  // Randomly create a spike (triangle) or a gap (short platform)
  const type = Math.random() < 0.5 ? 'spike' : 'gap';
  if (type === 'spike') {
    const size = 20 + Math.random() * 20;
    obstacles.push({type, x: canvas.width, y: canvas.height - GROUND_HEIGHT, w: size, h: size});
  } else {
    const gapWidth = 40 + Math.random() * 30;
    // Represent gap as a missing platform piece; we will draw ground with a break.
    obstacles.push({type, x: canvas.width, y: canvas.height - GROUND_HEIGHT, w: gapWidth, h: GROUND_HEIGHT});
  }
}



function draw() {
  // Sky background gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGrad.addColorStop(0, '#87ceeb'); // light blue
  skyGrad.addColorStop(1, '#b0e0e6'); // pale turquoise
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simple cloud particles
  if (!window._clouds) window._clouds = [];
  // Add new cloud occasionally
  if (Math.random() < 0.01) {
    window._clouds.push({x: canvas.width, y: Math.random() * (canvas.height / 2), r: 20 + Math.random() * 15, speed: 1 + Math.random() * 1});
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  window._clouds.forEach(c => {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();
    c.x -= c.speed;
  });
  // Remove off‑screen clouds
  window._clouds = window._clouds.filter(c => c.x + c.r > 0);

  // Ground with a subtle gradient
  const groundGrad = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
  groundGrad.addColorStop(0, '#555');
  groundGrad.addColorStop(1, '#333');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

  // Draw gaps by clearing ground area
  obstacles.filter(o => o.type === 'gap').forEach(g => {
    ctx.clearRect(g.x, canvas.height - GROUND_HEIGHT, g.w, GROUND_HEIGHT);
  });

  // Helper for rounded rectangles
  function drawRoundedRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
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

  // Player with rounded corners
  drawRoundedRect(player.x, player.y, player.w, player.h, 5, '#ff4040');

  // Obstacles – spikes in orange
  ctx.fillStyle = '#ff8800';
  obstacles.filter(o => o.type === 'spike').forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, canvas.height - GROUND_HEIGHT);
    ctx.lineTo(s.x + s.w / 2, canvas.height - GROUND_HEIGHT - s.h);
    ctx.lineTo(s.x + s.w, canvas.height - GROUND_HEIGHT);
    ctx.closePath();
    ctx.fill();
  });

  // Score with a subtle shadow
  ctx.fillStyle = '#000';
  ctx.font = '16px sans-serif';
  ctx.fillText('Score: ' + score, 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Click to restart', canvas.width / 2, canvas.height / 2 + 30);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

// Audio setup using Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(frequency, duration = 0.1, type = 'sine') {
  // Ensure audio context is running (required by some browsers)
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}
function playJumpSound() { playSound(300, 0.07, 'triangle'); }
function playHitSound() { playSound(100, 0.3, 'sawtooth'); }

// Input handling
window.addEventListener('keydown', e => {
  if (e.code === 'Space' && player.vy === 0) {
    player.vy = JUMP_VELOCITY;
    playJumpSound();
  }
});
canvas.addEventListener('click', () => {
  if (gameOver) {
    reset();
  } else if (player.vy === 0) {
    player.vy = JUMP_VELOCITY;
    playJumpSound();
  }
});

// Play hit sound on game over
function checkGameOver() {
  if (gameOver) {
    playHitSound();
  }
}

// modify update to call checkGameOver after setting gameOver
function update() {
  if (gameOver) return;
  frame++;
  // Player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y > canvas.height - GROUND_HEIGHT - PLAYER_SIZE) {
    player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
    player.vy = 0;
  }
  // Move obstacles left
  obstacles.forEach(o => o.x -= 6);
  // Remove off‑screen
  obstacles = obstacles.filter(o => o.x + o.w > 0);
  // Spawn new obstacles
  if (frame % 90 === 0) spawnObstacle();
  // Collision detection
  for (const o of obstacles) {
    if (o.type === 'spike') {
      const hit = !(player.x + player.w < o.x || player.x > o.x + o.w ||
                    player.y + player.h < o.y - o.h || player.y > o.y);
      if (hit) { gameOver = true; checkGameOver(); break; }
    } else if (o.type === 'gap') {
      // If player is over the gap and on ground, fall
      const overGap = player.x + player.w > o.x && player.x < o.x + o.w;
      const onGround = player.y + player.h >= canvas.height - GROUND_HEIGHT;
      if (overGap && onGround) {
        // No ground under player, let gravity pull down (already will fall)
      }
    }
  }
  // Score based on time survived
  score = Math.floor(frame / 60);
}

reset();
