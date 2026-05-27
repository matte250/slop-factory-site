// Minimal gravity‑flip game for a <canvas id="game"></canvas>
// Ball falls under gravity; click toggles gravity direction.
// Spikes move left; collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    setTimeout(() => {
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);
      osc.stop(audioCtx.currentTime + 0.03);
    }, duration);
  }
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Full‑size canvas
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  const W = canvas.width, H = canvas.height;

  // Ball state
  let score = 0; // track passed spikes
  const ball = { x: W / 4, y: H / 2, r: 10, vy: 0 };
  let gravity = 0.5; // positive = downwards

  // Spikes array
  const spikes = [];
  const spikeWidth = 20, spikeHeight = 20;
  const spikeSpeed = 2;
  let spawnTimer = 0;

  let gameOver = false;

  // Flip gravity on click / tap
  canvas.addEventListener('click', () => { audioCtx.resume(); gravity = -gravity; beep(440, 100); });

  function update(dt) {
    // ball physics
    ball.vy += gravity;
    ball.y += ball.vy;
    // bounce off floor/ceiling
    if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy = -Math.abs(ball.vy) * 0.7; }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy) * 0.7; }

    // spikes move left
    for (let i = spikes.length - 1; i >= 0; i--) {
      spikes[i].x -= spikeSpeed;
      if (spikes[i].x + spikeWidth < 0) {
        spikes.splice(i, 1);
        score++;
      }
    }

    // spawn spikes periodically
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTimer = 1500; // ms
      const y = Math.random() * (H - spikeHeight);
      spikes.push({ x: W, y, direction: Math.random() < 0.5 ? 'up' : 'down' });
    }

    // collision detection (circle‑rectangle)
    for (const s of spikes) {
      const closestX = Math.max(s.x, Math.min(ball.x, s.x + spikeWidth));
      const closestY = Math.max(s.y, Math.min(ball.y, s.y + spikeHeight));
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy < ball.r * ball.r) {
        beep(220, 200); // collision sound
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#004');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // ball with radial gradient
    const ballGrad = ctx.createRadialGradient(
      ball.x - ball.r / 3,
      ball.y - ball.r / 3,
      ball.r / 4,
      ball.x,
      ball.y,
      ball.r
    );
    ballGrad.addColorStop(0, '#aaf');
    ballGrad.addColorStop(1, '#006');
    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    // spikes as triangles
    ctx.fillStyle = 'crimson';
    for (const s of spikes) {
      ctx.beginPath();
      if (s.direction === 'up') {
        ctx.moveTo(s.x, s.y + spikeHeight);
        ctx.lineTo(s.x + spikeWidth / 2, s.y);
        ctx.lineTo(s.x + spikeWidth, s.y + spikeHeight);
      } else { // down
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + spikeWidth / 2, s.y + spikeHeight);
        ctx.lineTo(s.x + spikeWidth, s.y);
      }
      ctx.closePath();
      ctx.fill();
    }
    // score display
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 30);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last; // ms
    last = now;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
