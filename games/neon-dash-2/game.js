// Neon Dash – minimal endless runner
// Canvas with id="game" must exist in the page.
(function() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height = canvas.offsetHeight || 400;

  // Player square (drawn with neon glow and rounded corners)
  const player = {
    w: 40,
    h: 40,
    x: 80,
    y: H - 40,
    vy: 0,
    onGround: true,
    color: '#0ff'
  };

  const GRAVITY = 0.8;
  const JUMP_VELOCITY = -15;
  const SLIDE_TIME = 300; // ms
  let sliding = false;
  let slideEnd = 0;

  // Obstacles array
  const obstacles = [];
  const OBSTACLE_W = 30;
  const GAP = 200; // min distance between obstacles
  let lastObsX = W;

  let score = 0;
  let startTime = performance.now();

  function spawnObstacle() {
    // Randomly choose type: 0 = low (jump over), 1 = high (slide under)
    const type = Math.random() < 0.5 ? 0 : 1;
    const height = type === 0 ? 40 : 120; // low obstacle height, high obstacle height
    const y = H - height;
    obstacles.push({x: W, y, w: OBSTACLE_W, h: height, type});
    lastObsX = W;
  }

  function update(dt) {
    // Player physics
    if (!player.onGround) {
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= H - player.h) {
        player.y = H - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
    // Sliding logic
    if (sliding && performance.now() > slideEnd) {
      sliding = false;
      player.h = 40;
    }
    // Obstacles move left
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 4; // speed
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Spawn new obstacles
    if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < W - GAP) {
      spawnObstacle();
    }
    // Collision check
    for (const o of obstacles) {
      if (player.x < o.x + o.w && player.x + player.w > o.x &&
          player.y < o.y + o.h && player.y + player.h > o.y) {
        // Game over – play sound, then reset
        playTone(220, 200); // collision sound
        alert('Game Over! Score: ' + Math.floor(score));
        reset();
        break;
      }
    }
    // Score based on time
    score = (performance.now() - startTime) / 1000;
  }

  function draw() {
  // Neon background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#050505');
  bgGrad.addColorStop(1, '#0a0a0a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Helper to draw rounded rectangles with neon glow
  function drawRoundedRect(x, y, w, h, r, fill) {
    ctx.fillStyle = fill;
    ctx.shadowColor = fill;
    ctx.shadowBlur = 12;
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
    // Reset shadow for other drawings
    ctx.shadowBlur = 0;
  }
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, W, H);
  // Player
  drawRoundedRect(player.x, player.y, player.w, player.h, 8, player.color);
  // Obstacles
  for (const o of obstacles) {
    const obsColor = o.type === 0 ? '#f0f' : '#ff7700';
    drawRoundedRect(o.x, o.y, o.w, o.h, 6, obsColor);
  }
// Score with neon glow
  ctx.font = '20px monospace';
  ctx.fillStyle = '#0ff';
  ctx.shadowColor = '#0ff';
  ctx.shadowBlur = 8;
  ctx.fillText('Score: ' + Math.floor(score), 10, 30);
  // Reset shadow for other drawings
  ctx.shadowBlur = 0;
}

  function loop(timestamp) {
    const dt = timestamp - (lastTime || timestamp);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastTime = 0;

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
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Input handling
  window.addEventListener('keydown', e => {
    // Ensure audio context is running (required by browsers)
    audioCtx.resume();
    if (e.code === 'Space' && player.onGround) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      playTone(660, 120); // jump sound
    }
    if (e.code === 'ArrowDown' && !sliding && player.onGround) {
      sliding = true;
      slideEnd = performance.now() + SLIDE_TIME;
      player.h = 20; // reduce height for slide
      playTone(440, 120); // slide sound
    }
  });

  function reset() {
    obstacles.length = 0;
    player.y = H - player.h;
    player.vy = 0;
    player.onGround = true;
    sliding = false;
    startTime = performance.now();
    score = 0;
  }

  requestAnimationFrame(loop);
})();
