// Minimal Gravity Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // Audio context and simple sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };

  // Ship (triangle)
  const ship = { x: width / 2, y: height / 2, size: 12, r: 12, vy: 0 };
  const GRAVITY = 0.2;
  const THRUST = -5;

  // Obstacles and visual settings
  const obstacles = [];
  const SPAWN_INTERVAL = 1500; // ms
  const OB_SPEED_START = 1.5;
  let obSpeed = OB_SPEED_START;
  // Starfield for background
  const stars = [];
  const STAR_COUNT = 50;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }

  let lastSpawn = 0;
  let lastTime = performance.now();
  let score = 0;
  let running = true;

  const input = () => {
    // Ensure audio context is running (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ship.vy = THRUST;
    // Thrust sound – short high‑pitched blip
    playTone(600, 0.1);
  };
  canvas.addEventListener('mousedown', input);
  window.addEventListener('keydown', e => { if (e.code === 'Space') input(); });

  function spawnObstacle() {
    const size = 15 + Math.random() * 20;
    const type = Math.random() < 0.5 ? 'circle' : 'rect';
    obstacles.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      type,
      speed: obSpeed + Math.random() * 1,
    });
  }

  function update(dt) {
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    // Keep within horizontal bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));

    // Spawn obstacles
    if (performance.now() - lastSpawn > SPAWN_INTERVAL) {
      spawnObstacle();
      lastSpawn = performance.now();
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      if (o.y - o.size > height) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (o.type === 'circle') {
        const dx = ship.x - o.x;
        const dy = ship.y - o.y;
        const dist = Math.hypot(dx, dy);
        if (dist < ship.r + o.size) return lose();
      } else { // rect
        if (
          ship.x + ship.r > o.x &&
          ship.x - ship.r < o.x + o.size &&
          ship.y + ship.r > o.y &&
          ship.y - ship.r < o.y + o.size
        ) return lose();
      }
    }

    // Lose if hit bottom or top
    if (ship.y - ship.r > height || ship.y + ship.r < 0) return lose();

    // Increase difficulty over time
    obSpeed += dt * 0.00002; // gradual speed increase
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, width, height);

    // Starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship (triangle) with gradient
    const shipAngle = Math.atan2(ship.vy, -1); // tilt based on vertical velocity
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(shipAngle);
    const grad = ctx.createLinearGradient(-ship.size / 2, 0, ship.size / 2, 0);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Obstacles with distinct styles
    for (const o of obstacles) {
      if (o.type === 'circle') {
        const radGrad = ctx.createRadialGradient(o.x, o.y, o.size * 0.2, o.x, o.y, o.size);
        radGrad.addColorStop(0, '#ff8080');
        radGrad.addColorStop(1, '#800000');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#884444';
        ctx.fillRect(o.x, o.y, o.size, o.size);
      }
    }

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
  }

  function loop() {
    if (!running) return;
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function lose() {
    running = false;
    // Game over sound – low descending tone
    playTone(200, 0.3);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 20);
  }

  const startTime = performance.now();
  requestAnimationFrame(loop);
})();
