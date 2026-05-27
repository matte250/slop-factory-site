// Simple endless runner based on IDEA.md
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playJumpSound() { playSound(440, 0.1); }
  function playGameOverSound() { playSound(100, 0.5); }
  const width = canvas.width = 800;
  const height = canvas.height = 200;

  // Player
  const player = {
    x: 50,
    y: height - 30,
    w: 30,
    h: 30,
    vy: 0,
    gravity: 0.6,
    jumpStrength: -12,
    isJumping: false,
  };

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  let lastObstacle = 0;

  // Score
  let score = 0;

  function spawnObstacle() {
    const type = Math.random() < 0.5 ? 'spike' : 'block';
    const size = type === 'spike' ? 20 : 30;
    obstacles.push({
      x: width,
      y: height - size,
      w: size,
      h: size,
      type,
    });
  }

  function update(dt) {
    // Player physics
    if (player.isJumping) {
      player.vy += player.gravity;
      player.y += player.vy;
      if (player.y >= height - player.h) {
        player.y = height - player.h;
        player.vy = 0;
        player.isJumping = false;
      }
    }
    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
      // remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Collision detection
    for (const o of obstacles) {
      if (
        player.x < o.x + o.w &&
        player.x + player.w > o.x &&
        player.y < o.y + o.h &&
        player.y + player.h > o.y
      ) {
        // Game over
        playGameOverSound();
        alert('Game Over! Score: ' + Math.floor(score));
        document.location.reload();
        return;
      }
    }
    // Score based on time
    score += dt * 0.01;
  }

  function draw() {
    // Background gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    skyGrad.addColorStop(0, '#87CEEB'); // light blue
    skyGrad.addColorStop(1, '#FFF'); // near white
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Ground
    const groundHeight = 20;
    ctx.fillStyle = '#654321';
    ctx.fillRect(0, height - groundHeight, width, groundHeight);

    // Player (rounded square)
    ctx.fillStyle = '#0a0';
    roundRect(ctx, player.x, player.y, player.w, player.h, 4, true, false);

    // Obstacles
    ctx.fillStyle = '#a00';
    for (const o of obstacles) {
      if (o.type === 'spike') {
        // draw a triangle spike
        ctx.beginPath();
        ctx.moveTo(o.x, o.y + o.h);
        ctx.lineTo(o.x + o.w / 2, o.y);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.closePath();
        ctx.fill();
      } else {
        // block obstacle as rounded rect
        roundRect(ctx, o.x, o.y, o.w, o.h, 3, true, false);
      }
    }

    // Score text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

// Helper to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof radius === 'number') radius = { tl: radius, tr: radius, br: radius, bl: radius };
  else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (let side in defaultRadius) radius[side] = radius[side] || defaultRadius[side];
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (timestamp - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = timestamp;
    }
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Input
  window.addEventListener('keydown', e => {
    if (e.code === 'Space' && !player.isJumping) {
      // Ensure audio context is running (required by browsers)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      player.isJumping = true;
      player.vy = player.jumpStrength;
      playJumpSound();
    }
  });
})();
