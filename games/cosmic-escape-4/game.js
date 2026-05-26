// Simple endless runner based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio utilities
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  // Track thrust sound state
  let thrustPlaying = false;

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 4 };
  let fuel = 100; // percent
  let score = 0;
  let running = true;
  const keys = {};
  const asteroids = [];
  const fuels = [];

  // Input handling
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: Math.random() * (width - size), y: -size, r: size / 2, speed: 2 + Math.random() * 3 });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({ x: Math.random() * (width - size), y: -size, w: size, h: size, speed: 2 });
  }

  let asteroidTimer = 0;
  let fuelTimer = 0;

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    if (keys.ArrowUp || keys.w) {
      ship.y -= ship.speed;
      // thrust sound
      playTone(300, 30);
    }
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    // bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // spawn logic
    asteroidTimer += dt;
    fuelTimer += dt;
    if (asteroidTimer > 800) { spawnAsteroid(); asteroidTimer = 0; }
    if (fuelTimer > 3000) { spawnFuel(); fuelTimer = 0; }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship (circle-rect approx)
      const cx = a.x + a.r, cy = a.y + a.r;
      const nearestX = Math.max(ship.x, Math.min(cx, ship.x + ship.w));
      const nearestY = Math.max(ship.y, Math.min(cy, ship.y + ship.h));
      const dx = cx - nearestX, dy = cy - nearestY;
      if (dx * dx + dy * dy < a.r * a.r) {
        // crash sound
        playTone(100, 200);
        running = false; // crash
      }
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y > height) { fuels.splice(i, 1); continue; }
      // simple AABB collision
if (f.x < ship.x + ship.w && f.x + f.w > ship.x && f.y < ship.y + ship.h && f.y + f.h > ship.y) {
          fuel = Math.min(100, fuel + 20);
          // fuel pickup sound
          playTone(600, 80);
          fuels.splice(i, 1);
        }
    }

    // fuel consumption & scoring
    fuel -= dt * 0.01; // consume over time
    if (fuel <= 0) running = false;
    score += dt * 0.02;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
// starfield background with gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#001030');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);
  // Parallax starfield (twinkling)
  if (!window._stars) {
    window._stars = [];
    for (let i = 0; i < 150; i++) {
      window._stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 0.5, speed: Math.random() * 0.3 + 0.1 });
    }
  }
  ctx.fillStyle = '#fff';
  window._stars.forEach(s => {
    s.y += s.speed;
    if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
    // ship (gradient triangle with thrust)
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving up
    if (keys.ArrowUp || keys.w) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x + ship.w / 2, ship.y + ship.h);
      ctx.lineTo(ship.x + ship.w / 2 - 5, ship.y + ship.h + 15);
      ctx.lineTo(ship.x + ship.w / 2 + 5, ship.y + ship.h + 15);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.r, a.y + a.r, a.r * 0.3, a.x + a.r, a.y + a.r, a.r);
      grad.addColorStop(0, '#ff7777');
      grad.addColorStop(1, '#800000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // fuel cells with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.w/2, f.y + f.h/2, f.w*0.2, f.x + f.w/2, f.y + f.h/2, f.w/2);
      grad.addColorStop(0, '#ffff80');
      grad.addColorStop(1, '#ff8800');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      // subtle outline
      ctx.strokeStyle = '#ff0';
      ctx.lineWidth = 1;
      ctx.strokeRect(f.x, f.y, f.w, f.h);
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(fuel)}%`, 10, 40);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f88';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    if (running) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
