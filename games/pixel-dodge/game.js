// Game based on IDEA.md – Pixel Dodge
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio context (created on first sound)
  let audioCtx = null;
  function playBeep(freq, duration) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill window (adjust as needed)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 300;

  // Player
  const playerSize = 20;
  const player = { x: 40, y: canvas.height / 2 - playerSize / 2, w: playerSize, h: playerSize, speed: 4 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles
  const obstacles = [];
  let obstacleSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let obstacleSpeed = 2;
  const obstacleSize = 20;

  // Score
  let startTime = performance.now();
  let score = 0;

  let animationId;
  let gameOver = false;

  function update(dt) {
    // Player movement
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    // Keep player inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // Spawn obstacles
    if (performance.now() - lastSpawn > obstacleSpawnInterval) {
      obstacles.push({
        x: canvas.width,
        y: Math.random() * (canvas.height - obstacleSize),
        w: obstacleSize,
        h: obstacleSize,
      });
      // Play spawn sound
      playBeep(600, 0.07);
      lastSpawn = performance.now();
    }

    // Increase difficulty over time
    const elapsed = (performance.now() - startTime) / 1000;
    obstacleSpeed = 2 + elapsed * 0.02; // gradually faster
    obstacleSpawnInterval = Math.max(300, 1500 - elapsed * 10);

    // Move obstacles and check collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= obstacleSpeed;
      // Remove off‑screen obstacles
      if (o.x + o.w < 0) obstacles.splice(i, 1);
      // Collision detection
      if (
        o.x < player.x + player.w &&
        o.x + o.w > player.x &&
        o.y < player.y + player.h &&
        o.y + o.h > player.y
      ) {
        gameOver = true;
        // Play collision sound
        playBeep(200, 0.2);
      }
    }

    // Update score
    score = Math.floor(elapsed);
  }

  // Helper to draw rounded rectangles
function drawRoundedRect(x, y, w, h, radius, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function draw() {
  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bgGrad.addColorStop(0, '#e0f7ff');
  bgGrad.addColorStop(1, '#a0c4ff');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Player with rounded corners and slight shadow
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  drawRoundedRect(player.x, player.y, player.w, player.h, 4, '#0066ff');
  ctx.shadowColor = 'transparent';

  // Obstacles as varying colors and slight rotation
  for (const o of obstacles) {
    const hue = Math.floor((o.x / canvas.width) * 360);
    const color = `hsl(${hue}, 70%, 50%)`;
    // draw as rounded rect for visual variety
    drawRoundedRect(o.x, o.y, o.w, o.h, 3, color);
  }

  // Score with styled text
  ctx.fillStyle = '#222';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 10, 24);

  // Game over overlay with bold text
  if (gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '28px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
  }
}

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastRender || timestamp);
      update(dt);
    }
    draw();
    lastRender = timestamp;
    if (!gameOver) {
      animationId = requestAnimationFrame(loop);
    }
  }

  let lastRender = 0;
  requestAnimationFrame(loop);
})();
