// game.js – Minimal Canvas Escape implementation

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width;
  const height = canvas.height;

  // Ship
  const ship = { x: width / 2, y: height - 40, w: 20, h: 20, speed: 3, dx: 0, dy: 0 };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) playTone(440,0.04); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Obstacles
  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const obstacleSpeed = 2;
  let lastObstacle = 0;

  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height });
  }

  // Game state
  let startTime = null;
  let score = 0;
  let running = true;

  function spawnObstacle() {
    const w = 30 + Math.random() * 50;
    const h = 10 + Math.random() * 30;
    const x = Math.random() * (width - w);
    obstacles.push({ x, y: -h, w, h });
  }

  function update(dt) {
    // Ship movement
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // Obstacles movement and rotation
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += obstacleSpeed;
      // Apply rotation
      o.rot = (o.rot || 0) + 0.02;
      // Remove off‑screen
      if (o.y > height) obstacles.splice(i, 1);
    }

    // Collision detection (AABB)
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        running = false;
        break;
      }
    }

    // Score based on elapsed time
    if (running) score = Math.floor((Date.now() - startTime) / 1000);
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#003');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Ship (blue triangle with slight glow)
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.fillStyle = '#0af';
    ctx.shadowColor = '#0af';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles (rotating red rectangles)
    ctx.fillStyle = '#f33';
    ctx.shadowColor = '#f33';
    ctx.shadowBlur = 4;
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.rot || 0);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }

    // Score
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over – Press Enter to Restart', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = Date.now();
    const now = Date.now();
    if (running && now - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = now;
    }
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Restart on Enter
  window.addEventListener('keydown', e => {
    if (!running && e.key === 'Enter') {
      // Reset state
      obstacles.length = 0;
      ship.x = width / 2; ship.y = height - 40;
      score = 0; startTime = Date.now();
      running = true;
    }
  });

  let lastFrame = null;
  requestAnimationFrame(loop);
})();
