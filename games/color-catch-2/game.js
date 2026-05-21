// Simple Color Catch game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  // Audio context and simple tone player
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Game objects
  const paddle = { w: 80, h: 10, x: W / 2 - 40, y: H - 20, speed: 0 };
  const ball = { r: 8, x: W / 2, y: H / 2, vx: 3, vy: -3 };
  const squares = [];
  const rows = 5, cols = 6;
  const squareSize = 30;
  const squareGap = 10;
  const fallSpeed = 1.2;

  let lives = 3;
  let animationId;
  let gameOver = false;
  let win = false;

  // Initialise squares (red)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * (squareSize + squareGap) + squareGap;
      const y = r * (squareSize + squareGap) + squareGap;
      squares.push({ x, y, w: squareSize, h: squareSize, color: 'red' });
    }
  }

  // Mouse controls paddle
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    paddle.x = mouseX - paddle.w / 2;
    // clamp
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.w > W) paddle.x = W - paddle.w;
    // Resume audio context on first interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
  });

  function drawPaddle() {
    // Paddle with gradient and rounded corners
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.w, paddle.y);
    grad.addColorStop(0, '#555');
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    const radius = 3;
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
  }

  function drawBall() {
    // Ball with radial gradient and subtle glow
    const grad = ctx.createRadialGradient(ball.x, ball.y, ball.r * 0.2, ball.x, ball.y, ball.r);
    grad.addColorStop(0, '#a0e4ff');
    grad.addColorStop(1, '#0066cc');
    ctx.shadowColor = 'rgba(0, 102, 204, 0.5)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // reset
  }

  function drawSquares() {
    squares.forEach(s => {
      // Rounded squares with gradient based on color state
      const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
      if (s.color === 'red') {
        grad.addColorStop(0, '#ff7f7f');
        grad.addColorStop(1, '#ff0000');
      } else {
        grad.addColorStop(0, '#7fff7f');
        grad.addColorStop(1, '#00ff00');
      }
      ctx.fillStyle = grad;
      const radius = 4;
      ctx.beginPath();
      ctx.moveTo(s.x + radius, s.y);
      ctx.lineTo(s.x + s.w - radius, s.y);
      ctx.quadraticCurveTo(s.x + s.w, s.y, s.x + s.w, s.y + radius);
      ctx.lineTo(s.x + s.w, s.y + s.h - radius);
      ctx.quadraticCurveTo(s.x + s.w, s.y + s.h, s.x + s.w - radius, s.y + s.h);
      ctx.lineTo(s.x + radius, s.y + s.h);
      ctx.quadraticCurveTo(s.x, s.y + s.h, s.x, s.y + s.h - radius);
      ctx.lineTo(s.x, s.y + radius);
      ctx.quadraticCurveTo(s.x, s.y, s.x + radius, s.y);
      ctx.closePath();
      ctx.fill();
    });
  }

  function updateSquares() {
    squares.forEach(s => {
      s.y += fallSpeed;
    });
    // remove squares that fall below canvas (shouldn't happen) to avoid infinite loop
    // but keep them for win condition check.
  }

  function checkBallSquareCollision() {
    squares.forEach(s => {
      if (s.color === 'red') {
        const distX = Math.abs(ball.x - (s.x + s.w / 2));
        const distY = Math.abs(ball.y - (s.y + s.h / 2));
        if (distX <= s.w / 2 + ball.r && distY <= s.h / 2 + ball.r) {
          s.color = 'green';
          // Play a short higher tone when a square turns green
          playTone(600, 80);
        }
      }
    });
  }

  function checkWin() {
    win = squares.every(s => s.color === 'green');
    if (win) endGame();
  }

  function endGame() {
    gameOver = true;
    cancelAnimationFrame(animationId);
    // Play end‑game tone (higher for win, lower for loss)
    playTone(win ? 800 : 200, 500);
    // Dark overlay with subtle gradient
    const overlayGrad = ctx.createLinearGradient(0, 0, 0, H);
    overlayGrad.addColorStop(0, 'rgba(0,0,0,0.8)');
    overlayGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = overlayGrad;
    ctx.fillRect(0, 0, W, H);
    // Message styling
    ctx.fillStyle = '#ffd700';
    ctx.font = '36px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const msg = win ? '🎉 You Win! 🎉' : '💀 Game Over 💀';
    ctx.fillText(msg, W / 2, H / 2);
  }

  function update() {
    if (gameOver) return;
    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;
    // Wall collisions with sound
    if (ball.x + ball.r > W || ball.x - ball.r < 0) {
      ball.vx = -ball.vx;
      playTone(300, 100);
    }
    if (ball.y - ball.r < 0) {
      ball.vy = -ball.vy;
      playTone(300, 100);
    }
    // Paddle collision
    if (
      ball.y + ball.r >= paddle.y &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.w
    ) {
      ball.vy = -Math.abs(ball.vy);
      playTone(500, 100);
    }
    // Bottom touch
    if (ball.y - ball.r > H) {
      lives--;
      if (lives <= 0) {
        endGame();
        return;
      }
      // reset ball position
      ball.x = W / 2;
      ball.y = H / 2;
      ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -3;
    }
    // Update squares
    updateSquares();
    // Collision detection (ball with squares)
    checkBallSquareCollision();
    // Win check
    checkWin();
  }

function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    drawSquares();
    drawPaddle();
    drawBall();

    // Lives display
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Lives: ${lives}`, 10, H - 10);
}

  function loop() {
    update();
    draw();
    if (!gameOver) animationId = requestAnimationFrame(loop);
  }

  // Start the game when script loaded
  loop();
})();
