// Minimal endless runner game for canvas with id "game"
// Ship drifts down, press space or click to thrust upward.
// Obstacles are simple rectangles (asteroids/laser).
// Score increments over time.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrustSound() { playTone(600, 80); }
  function playCrashSound() { playTone(150, 300); }

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  const ship = {
    x: 80,
    y: height / 2,
    radius: 12,
    vy: 0,
    thrust: -0.4,
    gravity: 0.2,
    color: '#0ff',
  };

  const obstacles = [];
  const obstacleFreq = 1500; // ms
  const obstacleSpeed = 2.5;
  let lastObstacle = 0;
  let score = 0;
  let lastTime = 0;
  let gameOver = false;
  let crashPlayed = false;

  // Simple starfield background
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    const type = Math.random() < 0.6 ? 'asteroid' : 'laser';
    obstacles.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      type,
      rot: Math.random() * Math.PI * 2,
    });
  }

  function update(dt) {
    // ship physics
    ship.vy += ship.gravity;
    ship.y += ship.vy;
    // keep within canvas vertically (lose condition if out of bounds)
    if (ship.y > height - ship.radius) {
      gameOver = true;
      if (!crashPlayed) { playCrashSound(); crashPlayed = true; }
    }
    if (ship.y < ship.radius) ship.y = ship.radius; // bounce off top gently

    // obstacles
    obstacles.forEach(o => o.x -= obstacleSpeed);
    // remove passed obstacles
    while (obstacles.length && obstacles[0].x + obstacles[0].w < 0) obstacles.shift();

    // spawn new obstacles
    if (lastTime - lastObstacle > obstacleFreq) {
      spawnObstacle();
      lastObstacle = lastTime;
    }

    // collision detection (circle-rect)
    for (const o of obstacles) {
      const cx = ship.x, cy = ship.y, r = ship.radius;
      const closestX = Math.max(o.x, Math.min(cx, o.x + o.w));
      const closestY = Math.max(o.y, Math.min(cy, o.y + o.h));
      const dx = cx - closestX, dy = cy - closestY;
      if (dx * dx + dy * dy < r * r) { gameOver = true; break; }
    }

    // starfield
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    });

    score += dt * 0.01;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // stars (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.8 + Math.random() * 0.4), 0, Math.PI * 2);
      ctx.fill();
    });
    // ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    const angle = Math.atan2(ship.vy, 2); // slight tilt based on velocity
    ctx.moveTo(ship.x + Math.cos(angle) * ship.radius, ship.y + Math.sin(angle) * ship.radius);
    ctx.lineTo(ship.x + Math.cos(angle + Math.PI * 2 / 3) * ship.radius, ship.y + Math.sin(angle + Math.PI * 2 / 3) * ship.radius);
    ctx.lineTo(ship.x + Math.cos(angle - Math.PI * 2 / 3) * ship.radius, ship.y + Math.sin(angle - Math.PI * 2 / 3) * ship.radius);
    ctx.closePath();
    ctx.fill();
    // obstacles with type styling
    obstacles.forEach(o => {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.rot || 0);
      if (o.type === 'asteroid') {
        ctx.fillStyle = '#a55';
        ctx.beginPath();
        const sides = 6;
        const radius = o.w / 2;
        for (let i = 0; i < sides; i++) {
          const theta = (i / sides) * Math.PI * 2;
          const r = radius * (0.7 + Math.random() * 0.3);
          ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
        }
        ctx.closePath();
        ctx.fill();
      } else { // laser
        ctx.fillStyle = '#f0f';
        ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      }
      ctx.restore();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // input handling
  function thrust() {
    if (!gameOver) {
      ship.vy = ship.thrust;
      playThrustSound();
    }
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space') thrust(); });
  canvas.addEventListener('pointerdown', thrust);

  requestAnimationFrame(loop);
})();
