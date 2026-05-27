// Minimal Gravity Flip Game
// Assumes an HTML canvas with id="game"
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

// Audio context for simple sound effects
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

// Player
const player = {
  x: 50,
  y: canvas.height / 2,
  w: 20,
  h: 20,
  vy: 0,
  speed: 2,
  gravity: 0.4,
  dir: 1 // 1 = down, -1 = up
};

let obstacles = [];
let frames = 0;
let gameOver = false;
let speedFactor = 1;
let score = 0;

function toggleGravity() {
  player.dir *= -1;
  // Play flip sound
  if (audioCtx.state === 'suspended') audioCtx.resume();
  playTone(440, 0.08);
}

window.addEventListener('keydown', e => {
  if (e.code === 'Space') toggleGravity();
});
canvas.addEventListener('click', toggleGravity);

function spawnObstacle() {
  const gapHeight = 80 + Math.random() * 40;
  const gapY = Math.random() * (canvas.height - gapHeight);
  const w = 30;
  obstacles.push({x: canvas.width, w, gapY, gapHeight, type: 'platform'});
  // occasional spike
  if (Math.random() < 0.3) {
    const spikeY = Math.random() < 0.5 ? 0 : canvas.height;
    obstacles.push({x: canvas.width, w: 20, y: spikeY, h: 20, type: 'spike'});
  }
}

function update() {
  if (gameOver) return;
  frames++;
  // Increase speed over time
  if (frames % 600 === 0) speedFactor += 0.1;

  // Increment score based on distance traveled
  score += speedFactor;

  // Player physics
  player.vy += player.gravity * player.dir * speedFactor;
  player.y += player.vy;

  // Move player forward
  player.x += player.speed * speedFactor;

  // Keep player within horizontal bounds (wrap)
  if (player.x > canvas.width) player.x = 0;

  // Update obstacles
  obstacles.forEach(o => o.x -= 2 * speedFactor);
  // Remove off‑screen obstacles
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  // Spawn new obstacles
  if (frames % 120 === 0) spawnObstacle();

  // Collision detection
  // With spikes
  for (const o of obstacles) {
if (o.type === 'spike') {
  if (
    player.x < o.x + o.w &&
    player.x + player.w > o.x &&
    player.y < o.y + o.h &&
    player.y + player.h > o.y
  ) {
    // spike hit sound
    playTone(150, 0.3);
    gameOver = true;
  }
}
    } else {
      // Platform with gap – player must be inside gap
      if (player.x < o.x + o.w && player.x + player.w > o.x) {
        if (player.y < o.gapY || player.y + player.h > o.gapY + o.gapHeight) {
          gameOver = true;
        }
      }
    }
  }

  // Lose if player leaves canvas vertically
  if (player.y < -player.h || player.y > canvas.height) gameOver = true;
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#00172d');
  bgGrad.addColorStop(1, '#003366');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player as a smooth circle with a radial gradient
  const pGrad = ctx.createRadialGradient(
    player.x + player.w / 2,
    player.y + player.h / 2,
    player.w / 4,
    player.x + player.w / 2,
    player.y + player.h / 2,
    player.w / 2
  );
  pGrad.addColorStop(0, '#ffdd55');
  pGrad.addColorStop(1, '#ff6600');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw obstacles with subtle colors
  obstacles.forEach(o => {
    if (o.type === 'spike') {
      ctx.fillStyle = '#c00';
      ctx.beginPath();
      if (o.y === 0) {
        ctx.moveTo(o.x, 0);
        ctx.lineTo(o.x + o.w / 2, o.h);
        ctx.lineTo(o.x + o.w, 0);
      } else {
        ctx.moveTo(o.x, canvas.height);
        ctx.lineTo(o.x + o.w / 2, canvas.height - o.h);
        ctx.lineTo(o.x + o.w, canvas.height);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Platforms – use dark slate color
      ctx.fillStyle = '#222';
      // upper platform
      ctx.fillRect(o.x, 0, o.w, o.gapY);
      // lower platform
      ctx.fillRect(o.x, o.gapY + o.gapHeight, o.w, canvas.height - (o.gapY + o.gapHeight));
    }
  });

  // Score display
  ctx.fillStyle = '#fff';
  ctx.font = '18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    ctx.font = '20px sans-serif';
    ctx.fillText('Final Score: ' + Math.floor(score), canvas.width / 2, canvas.height / 2 + 40);
  }
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
