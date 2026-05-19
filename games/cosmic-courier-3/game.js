// Cosmic Courier game with enhanced graphics targeting <canvas id="game">
// Ship moves left/right with Arrow keys, up arrow boosts speed.
// Collect cargo squares for points, avoid circular asteroids.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size to fill parent or default
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioInitialized = false;
  function initAudio() {
    if (!audioInitialized) {
      audioCtx.resume();
      audioInitialized = true;
    }
  }
  window.addEventListener('click', initAudio);
  window.addEventListener('keydown', initAudio);
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }

  // Game constants
  const SHIP_WIDTH = 30;
  const SHIP_HEIGHT = 40;
  const SHIP_SPEED = 4;
  const BOOST_MULTIPLIER = 2;
  const OBSTACLE_RADIUS = 20;
  const CARGO_SIZE = 20;
  const SPAWN_INTERVAL = 1500; // ms
  const SPEED_INCREASE = 0.001; // per frame
  const STAR_COUNT = 80;

  // State
  let ship = { x: canvas.width / 2, y: canvas.height - 60, width: SHIP_WIDTH, height: SHIP_HEIGHT };
  let obstacles = [];
  let cargos = [];
  let particles = [];
  let keys = {};
  let lastSpawn = 0;
  let speed = 2; // base scroll speed
  let score = 0;
  let gameOver = false;
  let stars = [];
  let prevBoosting = false;

  // Initialise star field
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 2 + 1 });
  }

  // Input handling
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  function spawnObstacle() {
    const x = Math.random() * (canvas.width - OBSTACLE_RADIUS * 2) + OBSTACLE_RADIUS;
    obstacles.push({ x, y: -OBSTACLE_RADIUS, r: OBSTACLE_RADIUS });
  }

  function spawnCargo() {
    const x = Math.random() * (canvas.width - CARGO_SIZE) + CARGO_SIZE / 2;
    cargos.push({ x, y: -CARGO_SIZE, size: CARGO_SIZE, collected: false });
  }

  function spawnParticle(x, y) {
    particles.push({ x, y, life: 30, size: Math.random() * 3 + 2 });
  }

  function update(dt) {
    // Move ship
    if (keys['ArrowLeft']) ship.x -= SHIP_SPEED;
    if (keys['ArrowRight']) ship.x += SHIP_SPEED;
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));
    const boosting = keys['ArrowUp'];
    const currentSpeed = boosting ? speed * BOOST_MULTIPLIER : speed;
    // Play boost sound on start of boost
    if (boosting && !prevBoosting) playBeep(300, 100);
    // Boost trail particles
    if (boosting) spawnParticle(ship.x + ship.width / 2, ship.y + ship.height);
    // Update particles
    particles.forEach(p => {
      p.y += currentSpeed * 0.5;
      p.life--;
    });
    particles = particles.filter(p => p.life > 0);
    // Update obstacles
    obstacles.forEach(o => o.y += currentSpeed);
    obstacles = obstacles.filter(o => o.y - o.r < canvas.height);
    // Update cargos
    cargos.forEach(c => c.y += currentSpeed);
    cargos = cargos.filter(c => c.y - c.size < canvas.height && !c.collected);
    // Update stars for background
    stars.forEach(s => {
      s.y += currentSpeed * 0.2;
      if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    });
    // Spawn new entities
    const now = Date.now();
    if (now - lastSpawn > SPAWN_INTERVAL) {
      if (Math.random() < 0.7) spawnObstacle(); else spawnCargo();
      lastSpawn = now;
    }
    // Collision detection
    for (const o of obstacles) {
      if (rectCircleCollide(ship, o)) {
        playBeep(100, 300); // collision sound
        gameOver = true;
        return;
      }
    }
    for (const c of cargos) {
      if (!c.collected && rectRectCollide(ship, { x: c.x - c.size / 2, y: c.y - c.size / 2, width: c.size, height: c.size })) {
        c.collected = true;
        score += 10;
        playBeep(600, 80); // cargo collect sound
      }
    }
    // Increase difficulty
    speed += SPEED_INCREASE * dt;
    // Update boost state tracking
    prevBoosting = boosting;
  }

  function draw() {
    // Draw background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#000022');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship with gradient
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.height);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#00ff88');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
    // Draw boost particles
    particles.forEach(p => {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(255,255,0,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw obstacles with radial gradient
    obstacles.forEach(o => {
      const grad = ctx.createRadialGradient(o.x, o.y, o.r * 0.2, o.x, o.y, o.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw cargo with gold gradient
    cargos.forEach(c => {
      if (!c.collected) {
        const grad = ctx.createRadialGradient(c.x, c.y, c.size * 0.2, c.x, c.y, c.size / 2);
        grad.addColorStop(0, '#ff0');
        grad.addColorStop(1, '#aa6600');
        ctx.fillStyle = grad;
        ctx.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
      }
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
    }
  }

  // Utility collision helpers
  function rectRectCollide(r1, r2) {
    return !(r2.x > r1.x + r1.width ||
             r2.x + r2.width < r1.x ||
             r2.y > r1.y + r1.height ||
             r2.y + r2.height < r1.y);
  }

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - (rect.x + rect.width / 2));
    const distY = Math.abs(circle.y - (rect.y + rect.height / 2));
    if (distX > (rect.width / 2 + circle.r)) return false;
    if (distY > (rect.height / 2 + circle.r)) return false;
    if (distX <= (rect.width / 2)) return true;
    if (distY <= (rect.height / 2)) return true;
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.r * circle.r));
  }

  let lastTime = performance.now();
  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
