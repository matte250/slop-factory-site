// Simple pixel‑ship escape game targeting <canvas id="game"></canvas>
// Uses requestAnimationFrame, arrow keys, and basic rectangle collision.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Game state
  const ship = { x: 50, y: H / 2, w: 20, h: 12, speed: 3 };
  let obstacles = [];
  let fuels = [];
  let fuel = 1000; // frames of fuel
  let gameOver = false;

  // Starfield background
  const stars = [];
  function initStars(count) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: Math.random() * 0.5 + 0.2,
        size: Math.random() * 2 + 1,
      });
    }
  }
  initStars(120);

  function updateStars() {
    stars.forEach(s => {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = W;
        s.y = Math.random() * H;
        s.speed = Math.random() * 0.5 + 0.2;
        s.size = Math.random() * 2 + 1;
      }
    });
  }

  function drawStars() {
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    });
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const sounds = {
    thrust: () => playTone(400, 0.05),
    collect: () => playTone(800, 0.1),
    crash: () => playTone(200, 0.3),
  };
  let lastThrustTime = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnObstacle() {
    const h = Math.random() * 40 + 20;
    obstacles.push({
      x: W,
      y: Math.random() * (H - h),
      w: 20,
      h,
      speed: Math.random() * 2 + 2,
    });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({
      x: W,
      y: Math.random() * (H - size),
      w: size,
      h: size,
      speed: 3,
    });
  }

  function rectsIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update() {
    if (gameOver) return;

    // Update starfield first
    updateStars();

    // Track if ship moved this frame
    let moved = false;
    // Move ship based on keys
    if (keys.ArrowUp) { ship.y -= ship.speed; moved = true; }
    if (keys.ArrowDown) { ship.y += ship.speed; moved = true; }
    if (keys.ArrowLeft) { ship.x -= ship.speed; moved = true; }
    if (keys.ArrowRight) { ship.x += ship.speed; moved = true; }
    // Play thrust sound (max 10 per sec)
    if (moved && (Date.now() - lastThrustTime) > 100) { sounds.thrust(); lastThrustTime = Date.now(); }
    // Keep within bounds
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y));

    // Spawn obstacles/fuel periodically
    if (Math.random() < 0.02) spawnObstacle();
    if (Math.random() < 0.005) spawnFuel();

    // Move obstacles and check collisions
    obstacles.forEach(o => o.x -= o.speed);
    obstacles = obstacles.filter(o => o.x + o.w > 0);
    fuels.forEach(f => f.x -= f.speed);
    fuels = fuels.filter(f => f.x + f.w > 0);

    // Collision detection
    for (const o of obstacles) {
      if (rectsIntersect(ship, o)) { sounds.crash(); gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectsIntersect(ship, fuels[i])) {
        sounds.collect();
        fuel += 300; // add fuel frames
        fuels.splice(i, 1);
      }
    }

    // Fuel consumption
    fuel--;
    if (fuel <= 0) gameOver = true;
  }

  // Draw everything with simple graphics enhancements
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // --- Background starfield ---
    drawStars();

    // --- Ship (pixel‑art triangle with gradient) ---
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    shipGrad.addColorStop(0, '#88f');
    shipGrad.addColorStop(1, '#44c');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // --- Obstacles (asteroid‑like circles) ---
    ctx.fillStyle = '#a33';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, Math.max(o.w, o.h) / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- Fuel canisters (glowing circles) ---
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.w / 2,
        f.y + f.h / 2,
        0,
        f.x + f.w / 2,
        f.y + f.h / 2,
        f.w / 2
      );
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#060');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // --- HUD ---
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(`Fuel: ${fuel}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = '#ff0';
      ctx.font = '30px monospace';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
