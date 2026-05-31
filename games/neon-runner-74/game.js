// Neon Runner – simple endless runner on canvas with id "game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 400;

  // Game constants
  const GRAVITY = 0.5;
  const JUMP_VELOCITY = -10;
  const PLAYER_RADIUS = 8;
  const PLAYER_X = width * 0.2;
  const SCROLL_SPEED = 4;
const GRID_SPACING = 40;
// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let musicOsc = null;
let musicStarted = false;
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
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
  osc.stop(audioCtx.currentTime + duration/1000);
}
function startMusic() {
  if (musicOsc) return;
  musicOsc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  musicOsc.frequency.value = 60;
  musicOsc.type = 'sawtooth';
  musicOsc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 0.5);
  musicOsc.start();
}
function stopMusic() {
  if (!musicOsc) return;
  musicOsc.stop();
  musicOsc.disconnect();
  musicOsc = null;
}
function playJumpSound() { playTone(300, 100); }
function playCollisionSound() { playTone(100, 300); }

  const OBSTACLE_WIDTH = 20;
  const OBSTACLE_GAP = 150; // min distance between obstacles
  const OBSTACLE_INTERVAL = 1200; // ms between spawns

  let playerY = height - PLAYER_RADIUS;
  let playerVY = 0;
  let isJumping = false;
  let obstacles = [];
  let lastObstacleTime = 0;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (!musicStarted && e.key) { startMusic(); musicStarted = true; } if (e.key === 'ArrowUp' && !isJumping) { playerVY = JUMP_VELOCITY; isJumping = true; playJumpSound(); } });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    // Random height and color for obstacle
    const obsHeight = Math.random() * (height * 0.5) + 30;
    const y = canvas.height - obsHeight;
    const color = `hsl(${Math.random()*360}, 80%, 60%)`;
    obstacles.push({ x: canvas.width, y, width: OBSTACLE_WIDTH, height: obsHeight, color });
  }


  function update(dt) {
  // advance grid scroll
  gridOffset = (gridOffset + SCROLL_SPEED) % GRID_SPACING;

  // Update particle trail (fade out)
  particles = particles.filter(p => p.alpha > 0);
  particles.forEach(p => { p.alpha -= 0.02; p.radius *= 0.98; });

  // Add new trail particle at player position each frame
  particles.push({ x: PLAYER_X, y: playerY, radius: PLAYER_RADIUS, alpha: 0.5 });

  if (gameOver) return;
  // Player physics
  playerVY += GRAVITY;
  playerY += playerVY;
  if (playerY > canvas.height - PLAYER_RADIUS) { playerY = canvas.height - PLAYER_RADIUS; playerVY = 0; isJumping = false; }

  // Move obstacles left
  obstacles.forEach(o => o.x -= SCROLL_SPEED);
  // Remove off‑screen obstacles
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  // Spawn obstacles
  if (performance.now() - lastObstacleTime > OBSTACLE_INTERVAL) {
    spawnObstacle();
    lastObstacleTime = performance.now();
  }

  // Collision detection (circle‑rect)
  for (const o of obstacles) {
    const cx = PLAYER_X;
    const cy = playerY;
    const rx = o.x;
    const ry = o.y;
    const rw = o.width;
    const rh = o.height;
    const distX = Math.abs(cx - (rx + rw/2));
    const distY = Math.abs(cy - (ry + rh/2));
    if (distX > (rw/2 + PLAYER_RADIUS) || distY > (rh/2 + PLAYER_RADIUS)) continue;
    if (distX <= (rw/2) || distY <= (rh/2) || (distX*distX + distY*distY <= PLAYER_RADIUS*PLAYER_RADIUS)) {
      gameOver = true;
      playCollisionSound();
      stopMusic();
      break;
    }
  }

  if (!gameOver) score += dt * 0.01;
}

  let gridOffset = 0; // scroll offset for moving neon grid
let stars = [];
let particles = []; // player trail particles

// Initialize starfield
function initStars(count = 80) {
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
    });
  }
}
initStars();
function drawBackground() {
  // Update and draw stars
  stars.forEach(star => {
    star.x -= SCROLL_SPEED * 0.2; // slight parallax
    star.y += star.speed * 0.1; // drift down a bit
    if (star.x < 0) star.x = width;
    if (star.y > height) star.y = 0;
    ctx.fillStyle = 'rgba(255,255,255,' + (star.radius / 2) + ')';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // dark radial background

  // dark radial background
  const bgGrad = ctx.createRadialGradient(width/2, height/2, width*0.1, width/2, height/2, width);
  bgGrad.addColorStop(0, '#001a33');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0,0,width,height);

    // Animated neon grid with scrolling effect
    ctx.strokeStyle = 'rgba(0,255,255,0.1)';
    ctx.lineWidth = 1;
    const spacing = 40;
    for (let x = -GRID_SPACING; x < width; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

function render() {
  ctx.clearRect(0, 0, width, height);
  drawBackground();

  // Draw obstacles with neon glow
  ctx.shadowBlur = 8;
  obstacles.forEach(o => {
    ctx.shadowColor = o.color;
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.width, o.height);
  });
  ctx.shadowBlur = 0; // reset

  // Draw player (glowing dot)
  const gradient = ctx.createRadialGradient(PLAYER_X, playerY, 2, PLAYER_X, playerY, PLAYER_RADIUS);
  gradient.addColorStop(0, 'rgba(0,255,255,0.8)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(PLAYER_X, playerY, PLAYER_RADIUS, 0, Math.PI*2);
  ctx.fill();

  // Draw particle trail
  particles.forEach(p => {
    ctx.fillStyle = `rgba(0,255,255,${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
    ctx.fill();
  });

  // Score
  ctx.fillStyle = '#0ff';
  ctx.font = '16px monospace';
  ctx.fillText('Score: ' + Math.floor(score), 10, 20);

  if (gameOver) {
    ctx.fillStyle = 'rgba(255,0,0,0.7)';
    ctx.font = '48px monospace';
    ctx.fillText('GAME OVER', width/2 - 120, height/2);
  }
}

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    render();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
