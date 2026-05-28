// Asteroid Runner – minimal canvas game implementation
// Canvas element expected with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Game state
  const ship = { x: 50, y: height / 2, radius: 15 };
  let fuel = 100; // percent
  const asteroids = [];
  const fuels = [];
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 1,
    });
  }
  let gameOver = false;

  // Input handling
  const keys = {};
  // Resume audio on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', e => { keys[e.key] = true; resumeAudio(); });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width + size, y: Math.random() * (height - size), size, speed: 2 + Math.random() * 3 });
  }
  function spawnFuel() {
    const size = 12;
    fuels.push({ x: width + size, y: Math.random() * (height - size), size, speed: 2 });
  }

  // Simple timer for spawns
  let asteroidTimer = 0;
  let fuelTimer = 0;

  function update(dt) {
    if (gameOver) return;

    // Controls – up/down arrows or W/S
    if (keys.ArrowUp || keys.w) ship.y -= 200 * dt;
    if (keys.ArrowDown || keys.s) ship.y += 200 * dt;
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size / 2 + ship.radius) {
        playBeep(200, 0.3); // collision sound
        gameOver = true;
      }
      // Remove off‑screen
      if (a.x + a.size < 0) asteroids.splice(i, 1);
    }

    // Move fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < f.size / 2 + ship.radius) {
        fuel = Math.min(100, fuel + 20);
        fuels.splice(i, 1);
      }
      if (f.x + f.size < 0) fuels.splice(i, 1);
    }

    // Fuel consumption
    fuel -= dt * 5; // 5% per second
    if (fuel <= 0) { fuel = 0; gameOver = true; }

    // Spawn logic
    asteroidTimer += dt;
    fuelTimer += dt;
    if (asteroidTimer > 0.8) { spawnAsteroid(); asteroidTimer = 0; }
    if (fuelTimer > 3) { spawnFuel(); fuelTimer = 0; }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });
    // Ship with gradient and triangular shape
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.radius * 0.2, ship.x, ship.y, ship.radius);
    shipGrad.addColorStop(0, '#4cf');
    shipGrad.addColorStop(1, '#00a');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.radius, ship.y);
    ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius * 0.8);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius * 0.8);
    ctx.closePath();
    ctx.fill();
    // Asteroids – rough circles with stroke
    ctx.fillStyle = '#777';
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // Fuel cells – glowing circles
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, f.size * 0.2, f.x, f.y, f.size / 2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#a60');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.round(fuel)}%`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
