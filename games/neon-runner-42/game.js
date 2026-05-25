// Neon Runner game
// Canvas with id="game"
(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
   const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player
  const player = { w: 20, h: 20, x: width / 2 - 10, y: height - 30, speed: 5, color: '#0ff', trail: [] };

  // Obstacles
  const obstacles = [];
  const obstacleWidth = 40;
  const obstacleHeight = 20;
  const spawnInterval = 1000; // ms
  let lastSpawn = 0;

  const keys = {};
  window.addEventListener('keydown', e => {
    // Ensure audio context is running on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // Touch support: left half tap = left, right half = right
  canvas.addEventListener('touchstart', e => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    if (x < width / 2) keys['ArrowLeft'] = true; else keys['ArrowRight'] = true;
    setTimeout(() => { keys['ArrowLeft'] = keys['ArrowRight'] = false; }, 100);
  });

  function update(dt) {
    // Move player
    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x + player.w < width) player.x += player.speed;

    // Record trail
    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 12) player.trail.shift();

    // Spawn obstacles
    if (Date.now() - lastSpawn > spawnInterval) {
      const gap = 80; // gap between obstacles horizontally
      const posX = Math.random() * (width - obstacleWidth);
      obstacles.push({ x: posX, y: -obstacleHeight, w: obstacleWidth, h: obstacleHeight, speed: 2, color: '#f0f' });
      beep(440, 100);
      lastSpawn = Date.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off-screen
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (player.x < o.x + o.w &&
          player.x + player.w > o.x &&
          player.y < o.y + o.h &&
          player.y + player.h > o.y) {
        // Game over
        alert('Game Over');
        // Reset
        player.x = width / 2 - 10;
        player.trail = [];
        obstacles.length = 0;
        break;
      }
    }
  }

  function draw() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, '#111');
  grad.addColorStop(1, '#000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Neon glow settings
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 15;

  // Draw player trail (fading neon)
  for (let i = 0; i < player.trail.length; i++) {
    const pt = player.trail[i];
    const alpha = (i + 1) / player.trail.length * 0.3; // fade out
    ctx.globalAlpha = alpha;
    ctx.fillStyle = player.color;
    ctx.fillRect(pt.x, pt.y, player.w, player.h);
  }
  ctx.globalAlpha = 1.0;

  // Draw player with rounded neon square
  ctx.fillStyle = player.color;
  const radius = 4;
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

  // Draw obstacles with gradient neon
  for (const o of obstacles) {
    const og = ctx.createLinearGradient(0, o.y, 0, o.y + o.h);
    og.addColorStop(0, '#f0f');
    og.addColorStop(1, '#800080');
    ctx.fillStyle = og;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  }

  // Draw neon grid lines
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#0ff';
  for (const line of gridLines) {
    ctx.fillRect(0, line.y, width, line.h);
  }
  ctx.globalAlpha = 1.0;

  // Reset shadow for future frames
  ctx.shadowBlur = 0;
}

  // Grid lines for neon corridor
const gridLines = [];
const gridSpacing = 40; // distance between lines
const gridSpeed = 2;
let lastGridSpawn = 0;
const gridSpawnInterval = 200; // ms

let lastTime = 0;
function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;
  // Update grid lines
  if (Date.now() - lastGridSpawn > gridSpawnInterval) {
    gridLines.push({ y: -gridSpacing, h: 2 });
    lastGridSpawn = Date.now();
  }
  for (let i = gridLines.length - 1; i >= 0; i--) {
    const line = gridLines[i];
    line.y += gridSpeed;
    if (line.y > height) gridLines.splice(i, 1);
  }
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
