// Simple bouncing ball game
// Targets <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Initialize Web Audio API for bounce sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBounce() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  }
  // Resume audio context on user interaction (required by some browsers)
  window.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  });
  // Set canvas size to fill its CSS size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const ball = {x: 50, y: 50, r: 15, vx: 2, vy: 3, color: '#ff5722'};

  function update() {
    ball.x += ball.vx;
    ball.y += ball.vy;
    let collided = false;
    // Horizontal collisions
    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx *= -1;
      collided = true;
    } else if (ball.x + ball.r > canvas.width) {
      ball.x = canvas.width - ball.r;
      ball.vx *= -1;
      collided = true;
    }
    // Vertical collisions
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy *= -1;
      collided = true;
    } else if (ball.y + ball.r > canvas.height) {
      ball.y = canvas.height - ball.r;
      ball.vy *= -1;
      collided = true;
    }
    if (collided) playBounce();
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGrad.addColorStop(0, '#1e1e2f');
    bgGrad.addColorStop(1, '#2b2b3d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ball with radial gradient and shadow
    const gradient = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r / 10,
      ball.x,
      ball.y,
      ball.r
    );
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.6, ball.color);
    gradient.addColorStop(1, '#000');
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0; // reset shadow for other drawings
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
