// Simple canvas game based on IDEA.md – Solar Flare Escape
// The HTML page provides a <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;
  // Create simple starfield for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // Sound system using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = {
    w: 40,
    h: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    color: '#0cf',
  };

  // Obstacles (meteors / solar flares)
  const obstacles = [];
  let obstacleTimer = 0;
  const obstacleInterval = 90; // frames
  let speedMultiplier = 1;
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    obstacles.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 * speedMultiplier,
      color: '#f90',
    });
  }

  function update() {
    if (gameOver) return;

    // Move ship
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));

    // Spawn obstacles
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
      obstacleTimer = 0;
      spawnObstacle();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // Remove off‑screen
if (o.y > canvas.height) {
          obstacles.splice(i, 1);
          score++;
          // Play a short tone for scoring
          playTone(440, 0.08);
          // Increase difficulty every few points
          if (score % 5 === 0) speedMultiplier += 0.2;
        }
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        gameOver = true;
        // Play crash sound
        playTone(150, 0.4);
        break;
      }
    }
  }

  function draw() {
    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw obstacles with radial gradient for glow
    for (const o of obstacles) {
      const grad = ctx.createRadialGradient(
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w * 0.1,
        o.x + o.w / 2,
        o.y + o.h / 2,
        o.w / 2
      );
      grad.addColorStop(0, 'rgba(255,150,0,0.8)');
      grad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f33';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
