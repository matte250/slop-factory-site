// Simple side‑scrolling game based on IDEA.md
// Canvas with id "game" must exist in the HTML.

(() => {
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure the context is running after user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, { once: true });

  function playSound(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  // Rest of the game code
  const canvas = document.getElementById('game');
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game settings
  const shipSize = 30;
  const debrisSize = 20;
  const asteroidSize = 40;
  const maxDebris = 5;
  const maxAsteroids = 3;
  const gameDuration = 60; // seconds

  // State
  let score = 0;
  let timeLeft = gameDuration;
  let gameOver = false;

  const ship = { x: 50, y: height / 2 - shipSize / 2, w: shipSize, h: shipSize, dy: 0 };
  const debris = [];
  const asteroids = [];
  const stars = [];

  // generate background stars
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speed: 0.3 + Math.random() * 0.5,
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnDebris() {
    if (debris.length >= maxDebris) return;
    const y = Math.random() * (height - debrisSize);
    debris.push({ x: width, y, w: debrisSize, h: debrisSize, speed: 2 + Math.random() * 2 });
  }

  function spawnAsteroid() {
    if (asteroids.length >= maxAsteroids) return;
    const y = Math.random() * (height - asteroidSize);
    // generate a simple polygon for visual variety
    const points = [];
    const sides = 6 + Math.floor(Math.random() * 4);
    const radius = asteroidSize / 2;
    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides;
      const r = radius * (0.7 + Math.random() * 0.3);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    asteroids.push({ x: width, y, w: asteroidSize, h: asteroidSize, speed: 3 + Math.random() * 2, points });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowUp) ship.dy = -4;
    else if (keys.ArrowDown) ship.dy = 4;
    else ship.dy = 0;
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y + ship.dy));

    // move stars for parallax effect
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) { s.x = width; s.y = Math.random() * height; }
    });

    // move debris & asteroids leftwards
    debris.forEach(d => d.x -= d.speed);
    asteroids.forEach(a => a.x -= a.speed);

    // remove off‑screen objects
    while (debris.length && debris[0].x + debris[0].w < 0) debris.shift();
    while (asteroids.length && asteroids[0].x + asteroids[0].w < 0) asteroids.shift();

    // collisions
    for (let i = debris.length - 1; i >= 0; i--) {
      if (rectsOverlap(ship, debris[i])) {
        score++; playSound(440, 0.2);
        debris.splice(i, 1);
      }
    }
    for (const a of asteroids) {
      if (rectsOverlap(ship, a)) {
gameOver = true; playSound(220, 0.5);
        break;
      }
    }

    // spawn new objects periodically
    if (Math.random() < 0.02) spawnDebris();
    if (Math.random() < 0.01) spawnAsteroid();

    // timer
    timeLeft -= dt;
    if (timeLeft <= 0) gameOver = true;
  }

  function drawBackground() {
    // dark space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawShip() {
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  }

  function drawDebris(d) {
    const grad = ctx.createRadialGradient(d.x + d.w / 2, d.y + d.h / 2, 0, d.x + d.w / 2, d.y + d.h / 2, d.w / 2);
    grad.addColorStop(0, '#6f6');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    ctx.fillRect(d.x, d.y, d.w, d.h);
  }

  function drawAsteroid(a) {
    ctx.fillStyle = '#555';
    ctx.beginPath();
    const cx = a.x + a.w / 2;
    const cy = a.y + a.h / 2;
    a.points.forEach((p, i) => {
      const px = cx + p.x;
      const py = cy + p.y;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fill();
  }

  function draw() {
    drawBackground();
    drawShip();
    debris.forEach(drawDebris);
    asteroids.forEach(drawAsteroid);
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, width - 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '32px sans-serif';
      ctx.fillText(`Score: ${score}`, width / 2, height / 2 + 30);
    }
  }

  let lastTime = null;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 1000; // seconds
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start the game
  requestAnimationFrame(loop);
})();
