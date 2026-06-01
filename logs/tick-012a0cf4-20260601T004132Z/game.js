// Neon Escape – simple endless runner on canvas#game

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Starfield setup
const STAR_COUNT = 120;
const stars = [];
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: 0.5 + Math.random() * 0.7,
    hue: 200 + Math.random() * 60,
  });
}

function updateStars() {
  // Move stars toward the viewer to create motion illusion
  stars.forEach(s => {
    s.y += s.speed * speed * 0.5; // tie to tunnel speed
    if (s.y > canvas.height) {
      s.x = Math.random() * canvas.width;
      s.y = -s.size;
      s.size = Math.random() * 2 + 1;
      s.speed = 0.5 + Math.random() * 0.7;
      s.hue = 200 + Math.random() * 60;
    }
  });
}

function drawStars() {
  stars.forEach(s => {
    ctx.fillStyle = `hsl(${s.hue},80%,80%)`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  });
}


// Player ship
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.8,
  w: 30,
  h: 40,
  speed: 5,
  boostSpeed: 10,
  boostEnergy: 100, // max 100
  boosting: false,
};

// Obstacles
const obstacles = [];
let obstacleTimer = 0;
const obstacleInterval = 90; // frames

let distance = 0;
let speed = 2; // tunnel scroll speed
let gameOver = false;

// Input handling
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function spawnObstacle() {
  const size = 40 + Math.random() * 30;
  const x = Math.random() * (canvas.width - size);
  obstacles.push({ x, y: -size, w: size, h: size });
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let boostPlaying = false;
function playBoost() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 600;
  osc.type = 'sawtooth';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.1);
}
function playCrash() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.frequency.value = 150;
  osc.type = 'triangle';
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.5);
}

function update() {
  if (gameOver) return;

  // Player movement
  if (keys['ArrowLeft']) player.x -= player.speed;
  if (keys['ArrowRight']) player.x += player.speed;

  // Boost handling
  if (keys['Space'] && player.boostEnergy > 0) { if (!player.boosting) playBoost();
    player.boosting = true;
    player.y -= player.boostSpeed;
    player.boostEnergy -= 2;
  } else {
    player.boosting = false;
    player.y += player.speed; // natural descent
    if (player.boostEnergy < 100) player.boostEnergy += 1; // regen
  }

  // Keep player inside canvas
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;
  if (player.y < 0) player.y = 0;
  if (player.y + player.h > canvas.height) player.y = canvas.height - player.h;

  // Update starfield positions for motion effect
  updateStars();

  // Obstacle logic
  obstacleTimer++;
  if (obstacleTimer >= obstacleInterval) {
    spawnObstacle();
    obstacleTimer = 0;
    // Gradually increase tunnel speed
    speed += 0.02;
  }

  obstacles.forEach(o => o.y += speed);
  // Remove off‑screen obstacles
  while (obstacles.length && obstacles[0].y > canvas.height) obstacles.shift();

  // Collision detection
  for (const o of obstacles) {
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameOver = true;
      playCrash();
    }
  }

  distance += speed;
}

function draw() {
  // Clear with neon background
  ctx.fillStyle = '#000020';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw animated starfield
  drawStars();

  // Draw obstacles with neon glow
  drawObstacles();

  // Draw player ship with glow effect
  drawShip();

  // UI – score & boost
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px monospace';
  ctx.fillText(`Score: ${Math.floor(distance)}`, 20, 30);
  ctx.fillText(`Boost: ${Math.floor(player.boostEnergy)}`, 20, 60);

  if (gameOver) {
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width / 2 - 120, canvas.height / 2);
  }
}

function drawShip() {
  ctx.save();
  // Glow effect varies with boost
  ctx.shadowColor = player.boosting ? '#00ff80' : '#00ffff';
  ctx.shadowBlur = player.boosting ? 20 : 12;

  // Ship shape – triangle pointing up
  ctx.fillStyle = player.boosting ? '#00ff80' : '#00ffff';
  ctx.beginPath();
  ctx.moveTo(player.x + player.w / 2, player.y);
  ctx.lineTo(player.x, player.y + player.h);
  ctx.lineTo(player.x + player.w, player.y + player.h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawObstacles() {
  ctx.save();
  obstacles.forEach(o => {
    // Neon gradient for each obstacle
    const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.h);
    grad.addColorStop(0, 'rgba(255,0,255,0.8)');
    grad.addColorStop(1, 'rgba(255,0,150,0.2)');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });
  ctx.restore();
}
}

function loop() {
  update();
  draw();
  if (!gameOver) requestAnimationFrame(loop);
}

loop();
