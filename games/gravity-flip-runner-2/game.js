// Game implementation for Gravity Flip Runner
// Assumes an existing <canvas id="game"></canvas> in the HTML.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, duration) {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
  osc.start();
  setTimeout(() => {
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.stop(audioCtx.currentTime + 0.2);
  }, duration);
}
function playFlipSound() { playTone(300, 100); }
function playLandingSound() { playTone(600, 80); }
function playGameOverSound() { playTone(150, 300); }
canvas.width = canvas.offsetWidth || 800;
canvas.height = canvas.offsetHeight || 400;

const player = {
  x: 50,
  y: canvas.height / 2,
  size: 30,
  vy: 0,
};
let gravity = 0.5;
let direction = 1; // 1 = down, -1 = up

// Platform settings
const platformSpeed = 2;
const platformWidth = 80;
const platformGap = 120; // vertical gap for player to pass
let platforms = [];
let spawnTimer = 0;
const spawnInterval = 120; // frames

function spawnPlatform() {
  const gapY = Math.random() * (canvas.height - platformGap - 40) + 20;
  // Upper platform
  platforms.push({
    x: canvas.width,
    y: 0,
    width: platformWidth,
    height: gapY,
  });
  // Lower platform
  platforms.push({
    x: canvas.width,
    y: gapY + platformGap,
    width: platformWidth,
    height: canvas.height - (gapY + platformGap),
  });
}

function update() {
  // Apply gravity
  player.vy += gravity * direction;
  player.y += player.vy;

  // Platform movement and cleanup
  platforms.forEach(p => p.x -= platformSpeed);
  platforms = platforms.filter(p => p.x + p.width > 0);

  // Spawn new platforms
  spawnTimer++;
  if (spawnTimer >= spawnInterval) {
    spawnPlatform();
    spawnTimer = 0;
  }

  // Collision detection
  let safe = false;
  for (const p of platforms) {
    const withinX = player.x + player.size > p.x && player.x < p.x + p.width;
    if (!withinX) continue;
    if (direction === 1) {
      // falling down, check landing on top of upper platform
      if (player.y + player.size > p.y && player.y + player.size - player.vy <= p.y) {
        player.y = p.y - player.size;
        player.vy = 0;
        playLandingSound();
        safe = true;
        break;
      }
    } else {
      // falling up, check hitting bottom of lower platform
      if (player.y < p.y + p.height && player.y - player.vy >= p.y + p.height) {
        player.y = p.y + p.height;
        player.vy = 0;
        safe = true;
        break;
      }
    }
  }

  // Lose conditions
  if (!safe && (player.y < -player.size || player.y > canvas.height)) {
    resetGame();
  }
}

function resetGame() {
  player.x = 50;
  player.y = canvas.height / 2;
  player.vy = 0;
  direction = 1;
  platforms = [];
  spawnTimer = 0;
  playGameOverSound();
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#1e1e2f');
  bgGrad.addColorStop(1, '#3b3b5c');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw player as a circle with shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(player.x + player.size / 2, player.y + player.size / 2, player.size / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ff7744';
  ctx.fill();
  ctx.restore();

  // Draw platforms with a slight gradient
  const platGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  platGrad.addColorStop(0, '#4477ff');
  platGrad.addColorStop(1, '#2244cc');
  ctx.fillStyle = platGrad;
  platforms.forEach(p => {
    // rounded rectangle for platform
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(p.x + radius, p.y);
    ctx.lineTo(p.x + p.width - radius, p.y);
    ctx.quadraticCurveTo(p.x + p.width, p.y, p.x + p.width, p.y + radius);
    ctx.lineTo(p.x + p.width, p.y + p.height - radius);
    ctx.quadraticCurveTo(p.x + p.width, p.y + p.height, p.x + p.width - radius, p.y + p.height);
    ctx.lineTo(p.x + radius, p.y + p.height);
    ctx.quadraticCurveTo(p.x, p.y + p.height, p.x, p.y + p.height - radius);
    ctx.lineTo(p.x, p.y + radius);
    ctx.quadraticCurveTo(p.x, p.y, p.x + radius, p.y);
    ctx.closePath();
    ctx.fill();
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input handling – click or tap flips gravity
canvas.addEventListener('click', () => {
  direction *= -1;
  // Reset vertical speed to avoid sudden bounce
  player.vy = 0;
  playFlipSound();
});

// Start the game
loop();
