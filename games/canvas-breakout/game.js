// Simple Breakout game
// Canvas element with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // audio context for sound effects
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  const paddle = {
    width: 80,
    height: 10,
    x: (width - 80) / 2,
    y: height - 20,
    speed: 7,
  };

  const ball = {
    radius: 6,
    x: width / 2,
    y: height / 2,
    vx: 3,
    vy: -3,
  };

  const rows = 5,
    cols = 8,
    brickWidth = width / cols - 4,
    brickHeight = 15,
    brickPadding = 4,
    brickOffsetTop = 30,
    brickOffsetLeft = 2;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    bricks[r] = [];
    for (let c = 0; c < cols; c++) {
      bricks[r][c] = { x: 0, y: 0, status: 1 };
    }
  }

  // Input handling (mouse move)
  document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    paddle.x = Math.min(Math.max(relativeX - paddle.width / 2, 0), width - paddle.width);
  });

  // Arrow key fallback
  const keys = {};
  document.addEventListener('keydown', e => (keys[e.key] = true));
  document.addEventListener('keyup', e => (keys[e.key] = false));

  function movePaddle() {
    if (keys.ArrowLeft) paddle.x = Math.max(paddle.x - paddle.speed, 0);
    if (keys.ArrowRight) paddle.x = Math.min(paddle.x + paddle.speed, width - paddle.width);
  }

  function drawPaddle() {
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    grad.addColorStop(0, '#00aaff');
    grad.addColorStop(1, '#0044aa');
    ctx.fillStyle = grad;
    // rounded rectangle
    ctx.beginPath();
    ctx.moveTo(paddle.x + 5, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - 5, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + 5);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - 5);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - 5, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + 5, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - 5);
    ctx.lineTo(paddle.x, paddle.y + 5);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + 5, paddle.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBall() {
    // radial gradient for a glossy look
    const grad = ctx.createRadialGradient(
      ball.x - ball.radius / 3,
      ball.y - ball.radius / 3,
      ball.radius / 5,
      ball.x,
      ball.y,
      ball.radius
    );
    grad.addColorStop(0, '#ffddaa');
    grad.addColorStop(1, '#dd5500');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0; // reset
  }

  function drawBricks() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (bricks[r][c].status) {
          const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          bricks[r][c].x = brickX;
          bricks[r][c].y = brickY;
          // brick gradient based on row
          const grad = ctx.createLinearGradient(brickX, brickY, brickX, brickY + brickHeight);
          const hue = 200 - r * 30; // vary color per row
          grad.addColorStop(0, `hsl(${hue}, 80%, 60%)`);
          grad.addColorStop(1, `hsl(${hue}, 80%, 40%)`);
          ctx.fillStyle = grad;
          // rounded rectangle for bricks
          const radius = 3;
          ctx.beginPath();
          ctx.moveTo(brickX + radius, brickY);
          ctx.lineTo(brickX + brickWidth - radius, brickY);
          ctx.quadraticCurveTo(brickX + brickWidth, brickY, brickX + brickWidth, brickY + radius);
          ctx.lineTo(brickX + brickWidth, brickY + brickHeight - radius);
          ctx.quadraticCurveTo(brickX + brickWidth, brickY + brickHeight, brickX + brickWidth - radius, brickY + brickHeight);
          ctx.lineTo(brickX + radius, brickY + brickHeight);
          ctx.quadraticCurveTo(brickX, brickY + brickHeight, brickX, brickY + brickHeight - radius);
          ctx.lineTo(brickX, brickY + radius);
          ctx.quadraticCurveTo(brickX, brickY, brickX + radius, brickY);
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  function playSound(freq, duration) {
    const ctxAudio = audioCtx;
    const oscillator = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    oscillator.connect(gain);
    gain.connect(ctxAudio.destination);
    gain.gain.setValueAtTime(0.1, ctxAudio.currentTime);
    oscillator.start();
    oscillator.stop(ctxAudio.currentTime + duration);
  }

function collisionDetection() {
    // Brick collision
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const b = bricks[r][c];
        if (b.status) {
          if (
            ball.x > b.x &&
            ball.x < b.x + brickWidth &&
            ball.y - ball.radius > b.y &&
            ball.y - ball.radius < b.y + brickHeight
          ) {
            ball.vy = -ball.vy;
            b.status = 0;
            playSound(440, 0.08); // brick hit
          }
        }
      }
    }
    // Wall collision
    if (ball.x + ball.vx > width - ball.radius || ball.x + ball.vx < ball.radius) {
      ball.vx = -ball.vx;
      playSound(200, 0.05);
    }
    if (ball.y + ball.vy < ball.radius) {
      ball.vy = -ball.vy;
      playSound(200, 0.05);
    }
    // Paddle collision
    if (
      ball.y + ball.vy > paddle.y - ball.radius &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      ball.vy = -ball.vy;
      playSound(300, 0.07);
    }
    // Lose condition
    if (ball.y + ball.vy > height - ball.radius) {
      // reset ball and bricks
      ball.x = width / 2;
      ball.y = height / 2;
      ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
      ball.vy = -3;
      playSound(100, 0.2);
      // restore bricks
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) bricks[r][c].status = 1;
    }
  }

  function update() {
    movePaddle();
    ball.x += ball.vx;
    ball.y += ball.vy;
    collisionDetection();
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000010');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    drawBricks();
    drawPaddle();
    drawBall();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // start the game
  loop();
})();
