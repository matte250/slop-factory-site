// Minimal endless‑runner game based on IDEA.md
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const startAudio = () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } };
  const beep = (freq, dur) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  };
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // game objects
  const paddle = { w: 80, h: 10, x: 0, y: 0, speed: 6 };
  const ball = { r: 8, x: 0, y: 0, vx: 3, vy: -3 };
  const obstacles = [];
  let lastObs = 0;
  let score = 0;
  let startTime = Date.now();
  let gameOver = false;

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    startAudio();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const reset = () => {
    paddle.x = (canvas.width - paddle.w) / 2;
    paddle.y = canvas.height - paddle.h - 10;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.vx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.vy = -3;
    obstacles.length = 0;
    startTime = Date.now();
    score = 0;
    gameOver = false;
  };

  const spawnObstacle = () => {
    const width = 20 + Math.random() * 30;
    const height = 10 + Math.random() * 20;
    obstacles.push({ x: canvas.width, y: Math.random() * (canvas.height - height), w: width, h: height, speed: 2 + Math.random() * 2 });
  };

  const update = dt => {
    if (gameOver) return;
    // paddle movement
    if (keys.ArrowLeft) paddle.x -= paddle.speed;
    if (keys.ArrowRight) paddle.x += paddle.speed;
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, paddle.x));

    // ball movement
    ball.x += ball.vx;
    ball.y += ball.vy;

    // wall collisions with sound
    if (ball.x - ball.r < 0 || ball.x + ball.r > canvas.width) {
      ball.vx *= -1;
      beep(200, 0.05);
    }
    if (ball.y - ball.r < 0) {
      ball.vy *= -1;
      beep(200, 0.05);
    }

    // paddle collision
    if (
      ball.y + ball.r >= paddle.y &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.vy > 0
    ) {
      ball.vy *= -1;
      // add slight horizontal influence based on hit position
      const hitPos = (ball.x - paddle.x) / paddle.w - 0.5; // -0.5..0.5
      ball.vx += hitPos * 2;
      // sound for paddle hit
      beep(300, 0.08);
    }

    // obstacle movement and collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // collision with ball (AABB vs circle)
      const distX = Math.abs(ball.x - (o.x + o.w / 2));
      const distY = Math.abs(ball.y - (o.y + o.h / 2));
      if (distX <= o.w / 2 + ball.r && distY <= o.h / 2 + ball.r) {
        beep(150, 0.3);
        gameOver = true;
      }
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn obstacles every 1.5 seconds
    if (Date.now() - lastObs > 1500) {
      spawnObstacle();
      lastObs = Date.now();
    }

    // lose condition: ball falls off bottom
    if (ball.y - ball.r > canvas.height) {
      beep(100, 0.4);
      gameOver = true;
    }

    // score based on survival time
    score = Math.floor((Date.now() - startTime) / 1000);
  };

  // Helper to draw rounded rectangles
  const roundedRect = (x, y, w, h, r) => {
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
  };

  const draw = () => {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#e0f7ff');
    bgGrad.addColorStop(1, '#a0d8ef');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw paddle with rounded corners and gradient
    const padGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.h);
    padGrad.addColorStop(0, '#777');
    padGrad.addColorStop(1, '#333');
    ctx.fillStyle = padGrad;
    roundedRect(paddle.x, paddle.y, paddle.w, paddle.h, 5);
    ctx.fill();

    // Draw ball with radial gradient for a shiny effect
    const radGrad = ctx.createRadialGradient(ball.x - ball.r / 3, ball.y - ball.r / 3, ball.r / 8, ball.x, ball.y, ball.r);
    radGrad.addColorStop(0, '#fff');
    radGrad.addColorStop(0.5, '#ff4444');
    radGrad.addColorStop(1, '#aa0000');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // Draw obstacles with color based on speed
    obstacles.forEach(o => {
      const speedRatio = (o.speed - 2) / 2; // 0..1
      const hue = 200 + speedRatio * 160; // 200-360
      ctx.fillStyle = `hsl(${hue}, 70%, 30%)`;
      roundedRect(o.x, o.y, o.w, o.h, 3);
      ctx.fill();
    });

    // Draw score with shadow for readability
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.shadowBlur = 2;
    ctx.fillStyle = '#000';
    ctx.font = '18px sans-serif';
    ctx.fillText('Score: ' + score, 12, 24);
    ctx.shadowColor = 'transparent';

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    const now = performance.now();
    const dt = now - (loop.last ?? now);
    loop.last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };

  reset();
  requestAnimationFrame(loop);
})();
