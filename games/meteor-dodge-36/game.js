// Game: Asteroid Dodge
// Canvas with id="game" assumed in the HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.width || 800;
  const H = canvas.height = canvas.height || 600;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start(audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  // Ship
  const ship = { w: 40, h: 20, x: W / 2, y: H - 30, speed: 5, dx: 0 };

  // Game state
  let asteroids = [];
  let fuels = [];
  let fuel = 100; // percent
  let score = 0;
  let running = true;
  let lastAsteroid = 0;
  let lastFuel = 0;
  const asteroidInterval = 1000; // ms
  const fuelInterval = 5000; // ms
  // Starfield
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
    });
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const radius = 20;
    const x = Math.random() * (W - radius * 2) + radius;
    asteroids.push({ x, y: -radius, r: radius, speed: 2 + Math.random() * 2 });
  }

  function spawnFuel() {
    const size = 15;
    const x = Math.random() * (W - size);
    fuels.push({ x, y: -size, size, speed: 2 });
  }

  function rectCircleCollision(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function rectRectCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    // Ship movement
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    else if (keys['ArrowRight']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x += ship.dx;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x));

    // Fuel drain
    fuel -= 0.05 * dt; // drains per ms
    if (fuel <= 0) running = false;

    // Update starfield (move downwards)
    stars.forEach(star => {
      star.y += star.speed * dt * 0.05; // speed scaled by dt
      if (star.y > H) {
        star.y = 0;
        star.x = Math.random() * W;
      }
    });

    // Spawn asteroids/fuel
    const now = performance.now();
    if (now - lastAsteroid > asteroidInterval) { spawnAsteroid(); lastAsteroid = now; }
    if (now - lastFuel > fuelInterval) { spawnFuel(); lastFuel = now; }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > H) { asteroids.splice(i, 1); score++; playBeep(400,0.05); }
      else if (rectCircleCollision({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, a)) {
        running = false;
        playBeep(150, 0.3);
        break;
      }
    }
    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.size > H) { fuels.splice(i, 1); }
      else if (rectRectCollision({ x: ship.x, y: ship.y, w: ship.w, h: ship.h }, { x: f.x, y: f.y, w: f.size, h: f.size })) {
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
        score += 5;
        playBeep(600, 0.1);
      }
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#444';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship as triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Asteroids with gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fuel canisters as glowing circles
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.size / 2, f.y + f.size / 2, f.size * 0.2, f.x + f.size / 2, f.y + f.size / 2, f.size / 2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#aa0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.size / 2, f.y + f.size / 2, f.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Fuel bar background
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 30, 100, 10);
    // Fuel level
    ctx.fillStyle = '#0ff';
    ctx.fillRect(10, 30, fuel, 10);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', W / 2, H / 2 - 20);
      ctx.font = '24px sans-serif';
      ctx.fillText('Score: ' + score, W / 2, H / 2 + 20);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (running) update(dt);
    draw();
    if (running) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
