// Gravity Run – minimal canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas with id "game" not found'); return; }
  const ctx = canvas.getContext('2d');
  // Simple sound manager using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 200;

  // Game constants
  const GRAVITY = 0.4;
  const JUMP_VELOCITY = -8;
  const PLATFORM_SPEED = 2;
  const PLATFORM_HEIGHT = 40;
  const BALL_RADIUS = 15;

  // State
  let platformTilt = 0; // -1 (left) to 1 (right)
  const ball = { x: 100, y: height - PLATFORM_HEIGHT - BALL_RADIUS, vy: 0 };
  const stars = [];
  const spikes = [];
  let offsetX = 0; // how far platform has moved leftwards
  let score = 0;
  let gameOver = false;

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnStar() {
    const x = width + offsetX + Math.random() * 200;
    const y = height - PLATFORM_HEIGHT - BALL_RADIUS - Math.random() * 80 - 20;
    stars.push({ x, y, collected: false });
  }

  function spawnSpike() {
    const x = width + offsetX + Math.random() * 200;
    const y = height - PLATFORM_HEIGHT;
    spikes.push({ x, y, width: 20, height: 20 });
  }

  // Initial obstacles
  for (let i = 0; i < 5; i++) spawnStar();
  for (let i = 0; i < 5; i++) spawnSpike();

  function update() {
    if (gameOver) return;
    // Tilt control
    if (keys.ArrowLeft) platformTilt = -1;
    else if (keys.ArrowRight) platformTilt = 1;
    else platformTilt = 0;

    // Apply gravity
    ball.vy += GRAVITY;
    ball.y += ball.vy;

    // Platform collision – simple floor check with tilt effect
    const platformY = height - PLATFORM_HEIGHT;
    if (ball.y + BALL_RADIUS > platformY) {
      // place ball on platform and allow jump
      ball.y = platformY - BALL_RADIUS;
      ball.vy = 0;
      // tilt influences horizontal movement
      ball.x += platformTilt * 2;
    }

    // Jump
    if (keys.Space || keys.ArrowUp) {
      if (ball.vy === 0) {
        ball.vy = JUMP_VELOCITY;
        playTone(600, 150); // jump sound
      }
    }

    // Move world leftwards to simulate forward motion
    offsetX -= PLATFORM_SPEED;

    // Move stars and spikes with offset
    stars.forEach(s => s.x -= PLATFORM_SPEED);
    spikes.forEach(s => s.x -= PLATFORM_SPEED);

    // Remove off‑screen objects and spawn new ones
    while (stars.length && stars[0].x < -50) stars.shift();
    while (spikes.length && spikes[0].x < -50) spikes.shift();
    if (Math.random() < 0.02) spawnStar();
    if (Math.random() < 0.03) spawnSpike();

    // Collision detection
    stars.forEach(s => {
      if (!s.collected && Math.hypot(ball.x - s.x, ball.y - s.y) < BALL_RADIUS + 8) {
        s.collected = true; score++;
        playTone(800, 120); // star collect sound
      }
    });
    spikes.forEach(sp => {
      if (ball.x + BALL_RADIUS > sp.x && ball.x - BALL_RADIUS < sp.x + sp.width &&
          ball.y + BALL_RADIUS > sp.y && ball.y - BALL_RADIUS < sp.y + sp.height) {
        gameOver = true;
      }
    });
    // Lose if ball falls below canvas
    if (ball.y - BALL_RADIUS > height) gameOver = true;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#87ceeb'); // sky blue
    bgGrad.addColorStop(1, '#e0f7fa'); // light cyan
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Platform with slight gradient and shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    const platGrad = ctx.createLinearGradient(0, height - PLATFORM_HEIGHT, 0, height);
    platGrad.addColorStop(0, '#777');
    platGrad.addColorStop(1, '#333');
    ctx.fillStyle = platGrad;
    ctx.fillRect(0, height - PLATFORM_HEIGHT, width, PLATFORM_HEIGHT);
    ctx.restore();

    // Ball with radial gradient for 3D look
    const ballGrad = ctx.createRadialGradient(
      ball.x - BALL_RADIUS / 3,
      ball.y - BALL_RADIUS / 3,
      BALL_RADIUS / 5,
      ball.x,
      ball.y,
      BALL_RADIUS
    );
    ballGrad.addColorStop(0, '#a0e9ff');
    ballGrad.addColorStop(1, '#0066ff');
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // Stars as glowing circles
    stars.forEach(s => {
      if (s.collected) return;
      const starGrad = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 6);
      starGrad.addColorStop(0, '#fff');
      starGrad.addColorStop(1, '#ff0');
      ctx.fillStyle = starGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Spikes with gradient and slight shadow
    spikes.forEach(sp => {
      ctx.save();
      ctx.shadowColor = 'rgba(255,0,0,0.4)';
      ctx.shadowBlur = 4;
      const spikeGrad = ctx.createLinearGradient(sp.x, sp.y - sp.height, sp.x, sp.y);
      spikeGrad.addColorStop(0, '#f44');
      spikeGrad.addColorStop(1, '#800');
      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(sp.x + sp.width / 2, sp.y - sp.height);
      ctx.lineTo(sp.x + sp.width, sp.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Score text
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
