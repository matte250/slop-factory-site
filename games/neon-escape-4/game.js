// Neon Escape - simple canvas game
// Canvas with id="game" must be present in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 55;
  bgOsc.type = 'sine';
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();

  function startAudio() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Set canvas size to its displayed size
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Background stars
  const stars = [];
  const starCount = 100;
  function initStars() {
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }
  initStars();

  // Game state
  const ball = {
    radius: 15,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 3,
    dx: 0,
    dy: -3, // constant forward motion upwards
  };

  const obstacles = [];
  const obstacleFrequency = 1500; // ms
  const obstacleSpeed = 2; // same direction as ball movement
  let lastObstacleTime = 0;
  let score = 0;
  let gameOver = false;

  const keys = { ArrowLeft: false, ArrowRight: false };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      startAudio();
      keys[e.key] = true;
      // short move beep
      beep(300, 0.05);
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
  });

  function createObstacle() {
    const width = 60 + Math.random() * 80; // 60-140px
    const x = Math.random() * (canvas.width - width);
    const y = -20; // start above view
    obstacles.push({ x, y, width, height: 20 });
  }

  function update(dt) {
    // Move ball based on input
    if (keys.ArrowLeft) ball.x -= ball.speed;
    if (keys.ArrowRight) ball.x += ball.speed;
    // Keep ball within canvas bounds
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));

    // Forward motion (ball moves upwards, obstacles move downwards)
    ball.y += ball.dy;
    // If ball moves off top, wrap to bottom
    if (ball.y < -ball.radius) ball.y = canvas.height + ball.radius;

    // Generate obstacles
    if (Date.now() - lastObstacleTime > obstacleFrequency) {
      createObstacle();
      lastObstacleTime = Date.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.y += obstacleSpeed;
      if (obs.y > canvas.height) obstacles.splice(i, 1); // remove off‑screen
    }

    // Collision detection
    for (const obs of obstacles) {
      const withinX = ball.x + ball.radius > obs.x && ball.x - ball.radius < obs.x + obs.width;
      const withinY = ball.y + ball.radius > obs.y && ball.y - ball.radius < obs.y + obs.height;
      if (withinX && withinY) {
        gameOver = true;
        break;
      }
    }

    // Score based on time survived
    score = Math.floor((Date.now() - startTime) / 1000);
  }

  function draw() {
    // Draw background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars with glow
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // move star downwards to simulate forward motion
      s.y += s.speed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Clear (over) previous entities only after background
    // (already cleared by drawing full background)

    // Draw neon ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0ff';
    ctx.shadowColor = '#0ff';
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.closePath();

    // Draw obstacles
    ctx.fillStyle = '#f0f';
    ctx.shadowColor = '#f0f';
    ctx.shadowBlur = 5;
    for (const obs of obstacles) {
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    }
    ctx.shadowBlur = 0;

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f66';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  const startTime = Date.now();

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
