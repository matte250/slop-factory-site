// Canvas Escape
// Simple top-down game using a <canvas id="game"></canvas>
// Dot rotates with left/right arrows and moves forward continuously.
// Colliding with moving blocks or timer reaching zero ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 400;
  const height = canvas.height = 400;

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    // fade in/out to avoid click
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.stop(now + duration);
  }

  // Game state
  const dot = { x: width / 2, y: height / 2, r: 5, angle: 0, speed: 2 };
  const blocks = [];
  const blockCount = 5;
  const blockSize = 30;
  const timerStart = 30; // seconds
  let timeLeft = timerStart;
  let lastTime = performance.now();
  let gameOver = false;
  let win = false;

  // Exit zone (bottom‑right corner)
  const exitZone = { x: width - 40, y: height - 40, w: 30, h: 30 };

  // Initialise blocks with random positions and velocities
  for (let i = 0; i < blockCount; i++) {
    blocks.push({
      x: Math.random() * (width - blockSize),
      y: Math.random() * (height - blockSize),
      w: blockSize,
      h: blockSize,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    });
  }

  // Input handling
  const keys = {};
  let audioStarted = false;
  window.addEventListener('keydown', e => {
    if (!audioStarted) { audioCtx.resume(); audioStarted = true; }
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function update(dt) {
    if (gameOver) return;

    // Rotate dot
    if (keys['ArrowLeft']) dot.angle -= 3 * Math.PI / 180; // 3° per frame
    if (keys['ArrowRight']) dot.angle += 3 * Math.PI / 180;

    // Move dot forward
    dot.x += Math.cos(dot.angle) * dot.speed;
    dot.y += Math.sin(dot.angle) * dot.speed;

    // Keep dot within bounds (wrap around)
    if (dot.x < 0) dot.x = width;
    if (dot.x > width) dot.x = 0;
    if (dot.y < 0) dot.y = height;
    if (dot.y > height) dot.y = 0;

    // Move blocks and bounce off walls
    for (const b of blocks) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < 0 || b.x + b.w > width) b.vx *= -1;
      if (b.y < 0 || b.y + b.h > height) b.vy *= -1;
    }

    // Collision detection (circle‑rect)
    for (const b of blocks) {
      const distX = Math.abs(dot.x - (b.x + b.w / 2));
      const distY = Math.abs(dot.y - (b.y + b.h / 2));
      if (distX > (b.w / 2 + dot.r) || distY > (b.h / 2 + dot.r)) continue;
      if (distX <= b.w / 2 || distY <= b.h / 2) { beep(200, 0.1); gameOver = true; break; }
      const dx = distX - b.w / 2;
      const dy = distY - b.h / 2;
      if (dx * dx + dy * dy <= dot.r * dot.r) { beep(200, 0.1); gameOver = true; break; }
    }

    // Check exit zone
    if (dot.x > exitZone.x && dot.y > exitZone.y) {
      beep(600, 0.2); // win tone
      win = true;
      gameOver = true;
    }

    // Timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      beep(150, 0.3); // timer end tone
      gameOver = true;
    }
  }

  function draw() {
    // Clear background with radial gradient for depth
    const bgGrad = ctx.createRadialGradient(width/2, height/2, width/4, width/2, height/2, width);
    bgGrad.addColorStop(0, '#222');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Exit zone with glowing effect
    const exitGrad = ctx.createLinearGradient(exitZone.x, exitZone.y, exitZone.x+exitZone.w, exitZone.y+exitZone.h);
    exitGrad.addColorStop(0, '#0b0');
    exitGrad.addColorStop(1, '#060');
    ctx.fillStyle = exitGrad;
    ctx.fillRect(exitZone.x, exitZone.y, exitZone.w, exitZone.h);
    // subtle border
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(exitZone.x, exitZone.y, exitZone.w, exitZone.h);

    // Draw blocks with rounded corners and shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f55';
    for (const b of blocks) {
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(b.x + radius, b.y);
      ctx.lineTo(b.x + b.w - radius, b.y);
      ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + radius);
      ctx.lineTo(b.x + b.w, b.y + b.h - radius);
      ctx.quadraticCurveTo(b.x + b.w, b.y + b.h, b.x + b.w - radius, b.y + b.h);
      ctx.lineTo(b.x + radius, b.y + b.h);
      ctx.quadraticCurveTo(b.x, b.y + b.h, b.x, b.y + b.h - radius);
      ctx.lineTo(b.x, b.y + radius);
      ctx.quadraticCurveTo(b.x, b.y, b.x + radius, b.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset shadow for later drawing

    // Draw dot with radial gradient and glow
    ctx.save();
    ctx.translate(dot.x, dot.y);
    ctx.rotate(dot.angle);
    const dotGrad = ctx.createRadialGradient(0, 0, dot.r/2, 0, 0, dot.r);
    dotGrad.addColorStop(0, '#ff0');
    dotGrad.addColorStop(1, '#aa0');
    ctx.fillStyle = dotGrad;
    ctx.beginPath();
    ctx.arc(0, 0, dot.r, 0, Math.PI * 2);
    ctx.fill();
    // direction indicator
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dot.r, 0);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(0, 0, dot.r, 0, Math.PI * 2);
    ctx.fill();
    // direction indicator
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(dot.r, 0);
    ctx.stroke();
    ctx.restore();

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Time: ${timeLeft.toFixed(1)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = win ? '#0f0' : '#f00';
      ctx.font = '24px sans-serif';
      const msg = win ? 'You Win!' : 'Game Over';
      ctx.fillText(msg, width / 2 - ctx.measureText(msg).width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
