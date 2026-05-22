// Asteroid Escape – minimal canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration = 0.15) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustSound = 0;

  // --------- Game state ---------
  const ship = { x: width / 2, y: height - 30, r: 10, vx: 0, vy: 0, speed: 3 };
  const keys = {};
  let asteroids = [];
  const stars = [];
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  // Generate a static field of small stars
  (function initStars() {
    const count = 100;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  })();

  // --------- Input handling ---------
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateShip() {
    ship.vx = ship.vy = 0;
    if (keys.ArrowLeft || keys.a) ship.vx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.vx = ship.speed;
    if (keys.ArrowUp || keys.w) ship.vy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.vy = ship.speed;
    // Play thrust sound when any movement key is active, throttled to avoid spam
    if (ship.vx !== 0 || ship.vy !== 0) {
      const now = performance.now();
      if (now - lastThrustSound > 100) { // 100ms cooldown
        playBeep(400, 0.04);
        lastThrustSound = now;
      }
    }
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x + ship.vx));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y + ship.vy));
  }

  function spawnAsteroid() {
    const r = Math.random() * 15 + 10;
    const x = Math.random() * (width - 2 * r) + r;
    const y = -r;
    const speed = Math.random() * 1.5 + 1 + score / 2000; // increase with score
    asteroids.push({ x, y, r, speed });
  }

  function updateAsteroids(dt) {
    for (const a of asteroids) a.y += a.speed * dt * 0.06; // adjust speed factor
    asteroids = asteroids.filter(a => a.y - a.r < height);
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) return true;
    }
    return false;
  }

  function drawShip() {
    // Ship with gradient fill and stroke for a more polished look
    const grad = ctx.createLinearGradient(-ship.r, -ship.r, ship.r, ship.r);
    grad.addColorStop(0, '#00ffff'); // cyan
    grad.addColorStop(1, '#0066ff'); // deep blue
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();
  }

  function drawBackground() {
    // Dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, width, height);
    // Small twinkling stars (static for simplicity)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Game Over – Score: ${Math.floor(score)}`, width / 2, height / 2);
      return;
    }

    // draw background (space + stars)
    drawBackground();

    // update
    updateShip();
    if (timestamp - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
      // gradually speed up spawns
      spawnInterval = Math.max(400, spawnInterval - 5);
    }
    updateAsteroids(dt);
    score += dt * 0.01;

    // draw
    drawShip();
    drawAsteroids();
    drawScore();

    // collision
    if (checkCollision()) {
      playBeep(100, 0.3); // collision explosion tone
      gameOver = true;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
