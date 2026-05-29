// Simple Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Handle high‑DPI screens
  const dpr = window.devicePixelRatio || 1;
  const logicalWidth = canvas.clientWidth;
  const logicalHeight = canvas.clientHeight;
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  ctx.scale(dpr, dpr);
  const width = logicalWidth;
  const height = logicalHeight;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship definition
  const ship = { x: width / 2, y: height - 30, w: 20, h: 30, speed: 4, dx: 0, dy: 0 };

  // Game objects
  const asteroids = [];
  const stars = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const angle = Math.random() * Math.PI * 2;
    const angularSpeed = (Math.random() - 0.5) * 0.02; // small rotation per frame
    asteroids.push({ x: Math.random() * (width - size), y: -size, size, speed: Math.random() * 2 + 1, angle, angularSpeed });
  }

  function spawnStar() {
    const size = 4;
    stars.push({ x: Math.random() * (width - size), y: -size, size, speed: 1 });
  }

  // Simple collision detection (circle‑rect for asteroid, point for star)
  function rectCircleCollide(rect, cx, cy, r) {
    const distX = Math.abs(cx - rect.x - rect.w / 2);
    const distY = Math.abs(cy - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + r || distY > rect.h / 2 + r) return false;
    if (distX <= rect.w / 2 || distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= r * r;
  }

  function update() {
    if (gameOver) return;
    // Move ship based on input
    ship.dx = (keys['ArrowLeft'] ? -1 : 0) + (keys['ArrowRight'] ? 1 : 0);
    ship.dy = (keys['ArrowUp'] ? -1 : 0) + (keys['ArrowDown'] ? 1 : 0);
    ship.x += ship.dx * ship.speed;
    ship.y += ship.dy * ship.speed;
    // Keep ship within bounds (lose if leaves canvas)
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) gameOver = true;

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.angularSpeed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
      else if (rectCircleCollide(ship, a.x + a.size / 2, a.y + a.size / 2, a.size / 2)) { gameOver = true; playSound(200, 0.4); }
    }

    // Update stars (collect for points)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y - s.size > height) stars.splice(i, 1);
else if (s.x > ship.x && s.x < ship.x + ship.w && s.y > ship.y && s.y < ship.y + ship.h) {
          score++;
          stars.splice(i, 1);
          playSound(800, 0.2);
        }
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw ship (filled triangle with slight gradient)
    const shipGrad = ctx.createLinearGradient(ship.x - ship.w / 2, ship.y, ship.x + ship.w / 2, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#070');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with rotation and radial gradient
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle);
      const radGrad = ctx.createRadialGradient(0, 0, a.size * 0.2, 0, 0, a.size / 2);
      radGrad.addColorStop(0, '#c66');
      radGrad.addColorStop(1, '#822');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(0, 0, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw stars with glow effect
    ctx.shadowColor = 'rgba(255,255,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff0';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
    ctx.shadowBlur = 0; // reset shadow

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Spawn intervals
  setInterval(spawnAsteroid, 800);
  setInterval(spawnStar, 1500);
  // Start game loop
  requestAnimationFrame(loop);
})();
