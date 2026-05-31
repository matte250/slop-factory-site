// Simple Breakout game for <canvas id="game">
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Support high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  // Simple sound effects using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    oscillator.stop(audioCtx.currentTime + dur);
  }


  // Paddle
  const paddle = { w: 80, h: 10, x: w / 2 - 40, y: h - 20, speed: 6 };
  // Ball
  const ball = { r: 5, x: w / 2, y: h - 30, vx: 3, vy: -3 };
  let score = 0;
  // Bricks
  const rows = 4, cols = 8, brickW = w / cols - 4, brickH = 15;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) bricks.push({ x: c * (brickW + 4) + 2, y: r * (brickH + 4) + 2, w: brickW, h: brickH, alive: true });
  }

  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function update() {
    // paddle movement
    if (keys['ArrowLeft']) paddle.x = Math.max(0, paddle.x - paddle.speed);
    if (keys['ArrowRight']) paddle.x = Math.min(w - paddle.w, paddle.x + paddle.speed);
    // ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;
    // wall collisions
    if (ball.x - ball.r < 0 || ball.x + ball.r > w) {
        ball.vx *= -1;
        // wall bounce sound
        playTone(150, 0.03);
      }
    if (ball.y - ball.r < 0) ball.vy *= -1;
    // paddle collision
if (ball.y + ball.r > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w) {
        ball.vy = -Math.abs(ball.vy);
        const hitPos = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hitPos * 5;
        // paddle hit sound
        playTone(200, 0.05);
      }
    // brick collisions
    for (const b of bricks) if (b.alive) {
      if (ball.x > b.x && ball.x < b.x + b.w && ball.y - ball.r < b.y + b.h && ball.y + ball.r > b.y) {
        ball.vy *= -1;
        b.alive = false;
        score++;
        // brick hit sound
        playTone(400, 0.07);
        // optional slight speed increase
        const speedIncrease = 0.1;
        const speed = Math.hypot(ball.vx, ball.vy) + speedIncrease;
        const angle = Math.atan2(ball.vy, ball.vx);
        ball.vx = speed * Math.cos(angle);
        ball.vy = speed * Math.sin(angle);
      }
    }
    // lose condition
    if (ball.y - ball.r > h) {
      // reset
      ball.x = w / 2; ball.y = h - 30; ball.vx = 3; ball.vy = -3;
      score = 0;
      // revive bricks
      bricks.forEach(b => b.alive = true);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    // score
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 8, 20);
    // paddle with rounded corners
    ctx.fillStyle = '#0095DD';
    const radius = 5;
    ctx.beginPath();
    ctx.moveTo(paddle.x + radius, paddle.y);
    ctx.lineTo(paddle.x + paddle.w - radius, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y, paddle.x + paddle.w, paddle.y + radius);
    ctx.lineTo(paddle.x + paddle.w, paddle.y + paddle.h - radius);
    ctx.quadraticCurveTo(paddle.x + paddle.w, paddle.y + paddle.h, paddle.x + paddle.w - radius, paddle.y + paddle.h);
    ctx.lineTo(paddle.x + radius, paddle.y + paddle.h);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.h, paddle.x, paddle.y + paddle.h - radius);
    ctx.lineTo(paddle.x, paddle.y + radius);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + radius, paddle.y);
    ctx.closePath();
    ctx.fill();
    // ball with gradient
    const grad = ctx.createRadialGradient(ball.x, ball.y, ball.r * 0.1, ball.x, ball.y, ball.r);
    grad.addColorStop(0, '#fff');
    grad.addColorStop(1, '#0095DD');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    // bricks with row colors
    const rowColors = ['#B22222', '#FF8C00', '#32CD32', '#1E90FF'];
    for (let i = 0; i < bricks.length; i++) {
      const b = bricks[i];
      if (!b.alive) continue;
      const row = Math.floor(i / cols);
      ctx.fillStyle = rowColors[row % rowColors.length];
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
})();
