// Minimal Gravity Flip Runner game
// Assumes an HTML <canvas id="game"></canvas> is present

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const ball = { x: 50, y: canvas.height / 2, r: 15, vy: 0 };
  let gravity = 0.6; // positive pulls down
  let direction = 1; // 1 = down, -1 = up

  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleSpacing = 1500; // ms between obstacles

  // Input: click or tap to flip gravity
  // Initialize simple sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playFlipSound() { playTone(300); }
  function playGameOverSound() { playTone(100, 0.5); }

  canvas.addEventListener('click', () => {
    direction *= -1;
    // give immediate bounce effect
    ball.vy = -direction * Math.abs(ball.vy);
    // play flip sound (resume context if needed)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playFlipSound();
  });

  function spawnObstacle() {
    const height = 30 + Math.random() * 70;
    const gap = 120; // vertical gap size
    const topHeight = Math.random() * (canvas.height - gap - height);
    obstacles.push({
      x: canvas.width,
      w: 30,
      top: topHeight,
      bottom: topHeight + gap,
    });
  }

  function update(dt) {
    // ball physics
    ball.vy += gravity * direction * dt * 0.001; // dt in ms
    ball.y += ball.vy;

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= 200 * dt * 0.001; // speed 200px/s
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // spawn obstacles
    obstacleTimer += dt;
    if (obstacleTimer > obstacleSpacing) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    // collision detection
    for (const o of obstacles) {
      if (
        ball.x + ball.r > o.x &&
        ball.x - ball.r < o.x + o.w &&
        (ball.y - ball.r < o.top || ball.y + ball.r > o.bottom)
      ) {
        // lose condition
        cancelAnimationFrame(animId);
        playGameOverSound();
        alert('Game Over');
        return;
      }
    }
    // out of bounds
    if (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height) {
      cancelAnimationFrame(animId);
      alert('Game Over');
      return;
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#0d0d2b');
    bgGrad.addColorStop(1, '#1a1a3d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ball with radial gradient for shading
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r / 5,
      ball.x,
      ball.y,
      ball.r
    );
    ballGrad.addColorStop(0, '#ff8a65');
    ballGrad.addColorStop(1, '#d84315');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();

    // obstacles with gradient and rounded corners
    const obsGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    obsGrad.addColorStop(0, '#444');
    obsGrad.addColorStop(1, '#111');
    ctx.fillStyle = obsGrad;
    for (const o of obstacles) {
      // top block
      ctx.beginPath();
      ctx.moveTo(o.x, 0);
      ctx.lineTo(o.x + o.w, 0);
      ctx.arcTo(o.x + o.w, o.top, o.x + o.w, 0, 5);
      ctx.lineTo(o.x, o.top);
      ctx.arcTo(o.x, 0, o.x + o.w, 0, 5);
      ctx.fill();
      // bottom block
      ctx.beginPath();
      ctx.moveTo(o.x, o.bottom);
      ctx.lineTo(o.x + o.w, o.bottom);
      ctx.arcTo(o.x + o.w, canvas.height, o.x + o.w, o.bottom, 5);
      ctx.lineTo(o.x, canvas.height);
      ctx.arcTo(o.x, o.bottom, o.x + o.w, o.bottom, 5);
      ctx.fill();
    }
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  animId = requestAnimationFrame(loop);
})();
