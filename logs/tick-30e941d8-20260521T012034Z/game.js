// Asteroid Miner - enhanced graphics
// Targets <canvas id="game"> defined in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  // Initialize background stars for twinkling effect
  initStars();
  // Audio context and sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  function playCollect() { playBeep(800, 0.07); }
  function playExplosionSound() { playBeep(150, 0.2); }
  // Background ambient music (looped)
  const bgMusic = new Audio('https://cdn.jsdelivr.net/gh/Calinou/retro-sfx@master/audio/background-music/space-ambient.ogg');
  bgMusic.loop = true;
  // Start music on first user interaction
  let audioStarted = false;
  function startAudio() {
    if (!audioStarted) { bgMusic.play(); audioStarted = true; }
  }
  window.addEventListener('keydown', startAudio, {once: true});
  window.addEventListener('click', startAudio, {once: true});

  // --- Game state ---
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: 15,
    speed: 4,
    shield: 100,
    color: '#0ff',
  };
  const keys = {};
  const minerals = [];
  const asteroids = [];
  const explosions = [];
  let score = 0;
  let gameOver = false;

  // --- Input handling ---
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

// --- Helper functions ---
  const backgroundStars = [];
  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }
  function initStars(count = 100) {
  // create stationary stars for background

    for (let i = 0; i < count; i++) {
      backgroundStars.push({
        x: randRange(0, canvas.width),
        y: randRange(0, canvas.height),
        size: randRange(0.5, 2),
        alpha: Math.random(),
        twinkleSpeed: randRange(0.005, 0.02),
      });
    }
  }
  function drawStars() {
    backgroundStars.forEach(s => {
      s.alpha += s.twinkleSpeed * (Math.random() < 0.5 ? 1 : -1);
      if (s.alpha > 1) s.alpha = 1;
      if (s.alpha < 0) s.alpha = 0;
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
  }
  function spawnMineral() {
    minerals.push({
      x: randRange(20, canvas.width - 20),
      y: -20,
      radius: 8,
      speed: 1.5,
    });
  }
  function spawnAsteroid() {
    const size = randRange(12, 30);
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const x = side === 'left' ? -size : canvas.width + size;
    const y = randRange(0, canvas.height / 2);
    const speedX = side === 'left' ? randRange(1, 2.5) : -randRange(1, 2.5);
    const speedY = randRange(0.5, 1.5);
    const rotSpeed = randRange(-0.05, 0.05);
    asteroids.push({ x, y, radius: size, speedX, speedY, angle: 0, rotSpeed });
  }
function drawShip() {
    // Ship with vertical gradient shading
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0ff'); // top bright
    grad.addColorStop(1, '#006'); // bottom darker
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

// Explosion particle effect
function spawnExplosion(x, y) {
  const particles = [];
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randRange(1, 3);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randRange(1, 3),
      alpha: 1,
      decay: randRange(0.02, 0.05),
    });
  }
  explosions.push(particles);
}

function drawExplosions() {
  explosions.forEach(particles => {
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#f80';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.globalAlpha = 1;
}

function updateExplosions() {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const particles = explosions[i];
    for (let j = particles.length - 1; j >= 0; j--) {
      const p = particles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      if (p.alpha <= 0) particles.splice(j, 1);
    }
    if (particles.length === 0) explosions.splice(i, 1);
  }
}
  function drawCircle(obj, col) {
  // Generic filled circle (fallback)
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMineral(m) {
  // Gold radial gradient for mineral glow
  const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
  grad.addColorStop(0, '#ff0');
  grad.addColorStop(1, '#aa5500');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawAsteroid(a) {
    // Dark red gradient for asteroid texture with rotation
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle || 0);
    const grad = ctx.createRadialGradient(0, 0, a.radius * 0.2, 0, 0, a.radius);
    grad.addColorStop(0, '#a44');
    grad.addColorStop(1, '#330');
    ctx.fillStyle = grad;
    ctx.beginPath();
    const sides = 6;
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const r = a.radius * (0.7 + Math.random() * 0.3);
      ctx.lineTo(Math.cos(theta) * r, Math.sin(theta) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function drawHUD() {
    // Draw shield arc around ship
    if (ship.shield > 0) {
      ctx.save();
      ctx.translate(ship.x, ship.y);
      const alpha = ship.shield / 100;
      ctx.strokeStyle = `rgba(0,191,255,${alpha * 0.6})`;
      ctx.lineWidth = 3;
      const radius = ship.radius + 6;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Shield: ${ship.shield}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f44';
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }
function update() {
    if (gameOver) return;
    // Move ship
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Update minerals
    for (let i = minerals.length - 1; i >= 0; i--) {
      const m = minerals[i];
      m.y += m.speed;
      // check collection
      const dx = m.x - ship.x;
      const dy = m.y - ship.y;
if (Math.hypot(dx, dy) < m.radius + ship.radius) {
          score += 10;
          // play collection sound
          playCollect();
          minerals.splice(i, 1);
          continue;
        }
      // remove if off‑screen
      if (m.y - m.radius > canvas.height) minerals.splice(i, 1);
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.speedX;
      a.y += a.speedY;
      a.angle += a.rotSpeed; // rotate asteroid
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.radius + ship.radius) {
        ship.shield -= 20;
        // create explosion at collision point
        spawnExplosion(a.x, a.y);
          playExplosionSound();
        asteroids.splice(i, 1);
        if (ship.shield <= 0) {
          gameOver = true;
        }
        continue;
      }
      if (a.x + a.radius < 0 || a.x - a.radius > canvas.width || a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
      }
    }
    // Update explosions
    updateExplosions();
    // Spawn timers
    if (Math.random() < 0.02) spawnMineral(); // ~1 per 50 frames
    if (Math.random() < 0.01) spawnAsteroid(); // ~1 per 100 frames
  }
  function render() {
    // Clear screen with dark space background
    ctx.fillStyle = '#001';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw twinkling background stars
    drawStars();
    // Draw game entities with enhanced graphics
    minerals.forEach(drawMineral);
    asteroids.forEach(drawAsteroid);
    drawShip();
    // Draw explosions on top of everything
    drawExplosions();
    drawHUD();
  }
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }
  // start loop
  requestAnimationFrame(loop);
})();
