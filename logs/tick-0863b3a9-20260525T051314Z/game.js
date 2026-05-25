// Minimal endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  // Helper to draw background gradient and stars
  const backgroundStars = [];
  function initBackgroundStars(count = 100) {
    for (let i = 0; i < count; i++) {
      backgroundStars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  }
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#013');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Draw background stars
    ctx.fillStyle = '#fff';
    backgroundStars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  // Initialize stars once
  initBackgroundStars();

  // Helper to draw the ship as a triangle
  function drawShip() {
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  }

  // Helper to draw obstacles with optional rotation
  function drawObstacle(o) {
    ctx.save();
    ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
    ctx.rotate(o.angle || 0);
    ctx.translate(-o.w / 2, -o.h / 2);
    ctx.fillStyle = o.type === 'laser' ? '#f44' : '#f90';
    ctx.fillRect(0, 0, o.w, o.h);
    ctx.restore();
  }

  // Helper to draw stars as glowing circles
  function drawStar(s) {
    const radius = s.size / 2;
    const grad = ctx.createRadialGradient(s.x + radius, s.y + radius, 0, s.x + radius, s.y + radius, radius);
    grad.addColorStop(0, '#ff0');
    grad.addColorStop(1, '#550');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x + radius, s.y + radius, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.width || 800;
  const h = canvas.height = canvas.height || 400;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Game constants
  const GRAVITY = 0.4;
  const THRUST = -8;
  const SHIP_W = 40;
  const SHIP_H = 20;
  const OBSTACLE_W = 30;
  const STAR_SIZE = 15;
  const SPAWN_INTERVAL = 1500; // ms
  const STAR_INTERVAL = 3000; // ms

  // State
  let ship = { x: 80, y: h / 2, vy: 0, w: SHIP_W, h: SHIP_H };
  let obstacles = [];
  let stars = [];
  let score = 0;
  let lastObs = 0;
  let lastStar = 0;
  let running = true;

  // Input – thrust on click/touch
  const thrust = () => { resumeAudio(); playTone(440, 0.1); ship.vy = THRUST; };
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); }, { passive: false });

  // Helper: random int in [min, max)
  const randInt = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  function spawnObstacle() {
    // Randomly choose type: asteroid (square) or laser (thin vertical)
    const type = Math.random() < 0.5 ? 'asteroid' : 'laser';
    const y = randInt(0, h - OBSTACLE_W);
    const wObs = type === 'laser' ? 5 : OBSTACLE_W;
    const hObs = type === 'laser' ? OBSTACLE_W * 3 : OBSTACLE_W;
    const angle = type === 'asteroid' ? (Math.random() - 0.5) * 0.5 : 0;
    obstacles.push({ x: w, y, w: wObs, h: hObs, type, angle });
  }

  function spawnStar() {
    const y = randInt(0, h - STAR_SIZE);
    stars.push({ x: w, y, size: STAR_SIZE, collected: false });
  }

  // Sound helpers
  function playStarSound() { playTone(660, 0.05); }
  function playCollisionSound() { playTone(220, 0.2); }


  function rectCollide(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    if (ship.y + ship.h > h) { ship.y = h - ship.h; running = false; }
    if (ship.y < 0) { ship.y = 0; ship.vy = 0; }

    // Move obstacles & stars
    obstacles.forEach(o => o.x -= 4);
    stars.forEach(s => s.x -= 4);

    // Remove off‑screen
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    stars = stars.filter(s => s.x + s.size > 0 && !s.collected);

    // Collision detection
    for (const o of obstacles) {
      if (rectCollide(ship, o)) { playCollisionSound(); running = false; break; }
    }
    for (const s of stars) {
      if (!s.collected && rectCollide(ship, { x: s.x, y: s.y, w: s.size, h: s.size })) {
        s.collected = true;
        score += 10;
      }
    }

    // Scoring over time
    score += dt * 0.01;
  }

  function draw() {
    // Clear and draw background gradient
    ctx.clearRect(0, 0, w, h);
    drawBackground();
    // Ship
    drawShip();
    // Obstacles
    obstacles.forEach(drawObstacle);
    // Stars
    stars.forEach(s => { if (!s.collected) drawStar(s); });
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      // Spawn logic
      if (timestamp - lastObs > SPAWN_INTERVAL) { spawnObstacle(); lastObs = timestamp; }
      if (timestamp - lastStar > STAR_INTERVAL) { spawnStar(); lastStar = timestamp; }
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
