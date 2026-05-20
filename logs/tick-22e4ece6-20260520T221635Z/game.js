// Simple Space Escape game with enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.offsetWidth || 800);
  const H = (canvas.height = canvas.offsetHeight || 600);

  // background stars
  const stars = [];
  function spawnStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  spawnStars();

  // Ship definition
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioCtx.resume();
    audioUnlocked = true;
  }
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playBoost() { playTone(660, 120); }
  function playCollect() { playTone(880, 100); }
  function playExplosion() { playTone(200, 400); }
  function playThrustStart() { playTone(300, 200); }

  const ship = {
  const ship = {
    x: W / 2,
    y: H / 2,
    r: 12,
    angle: 0,
    speed: 0,
    fuel: 100,
    boostTime: 0,
  };

  const keys = {};
  document.addEventListener('keydown', e => {
  unlockAudio();
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === 'arrowup' || k === 'w') playThrustStart();
});
  document.addEventListener('keyup', e => (keys[e.key.toLowerCase()] = false));

  const asteroids = [];
  const fuels = [];

  function spawnAsteroid() {
    const size = 15 + Math.random() * 20;
    asteroids.push({
      x: W + size,
      y: Math.random() * H,
      r: size,
      vx: - (1 + Math.random() * 2),
    });
  }

  function spawnFuel() {
    const r = 8;
    fuels.push({
      x: W + r,
      y: Math.random() * H,
      r,
      vx: -1.5,
    });
  }

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnAsteroid();
  for (let i = 0; i < 2; i++) spawnFuel();

  function update(dt) {
    // Controls
    const turnSpeed = 0.003 * dt;
    if (keys['arrowleft'] || keys['a']) ship.angle -= turnSpeed;
    if (keys['arrowright'] || keys['d']) ship.angle += turnSpeed;
    if (keys['arrowup'] || keys['w']) ship.speed = 0.1 * dt;
    if (keys['arrowdown'] || keys['s']) ship.speed = -0.05 * dt;
    if (keys[' ']) {
      ship.boostTime = 200; // ms boost
      playBoost();
    }
    if (ship.boostTime > 0) {
      ship.speed += 0.2 * dt;
      ship.boostTime -= dt;
    }
    // Apply movement
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // Keep inside bounds
    ship.x = (ship.x + W) % W;
    ship.y = (ship.y + H) % H;
    // Fuel consumption
    ship.fuel -= 0.02 * dt / 1000;
    // Update asteroids
    asteroids.forEach(a => (a.x += a.vx * dt * 0.001));
    // Update fuels
    fuels.forEach(f => (f.x += f.vx * dt * 0.001));
    // Remove off‑screen objects
    asteroids.filter(a => a.x + a.r > 0);
    fuels.filter(f => f.x + f.r > 0);
    // Spawn new obstacles/fuel periodically
    if (Math.random() < 0.01) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.r) ** 2) {
        gameOver();
        return;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = f.x - ship.x, dy = f.y - ship.y;
      if (dx * dx + dy * dy < (f.r + ship.r) ** 2) {
        ship.fuel = Math.min(ship.fuel + 30, 100);
        fuels.splice(i, 1);
        playCollect();
      }
    }
    if (ship.fuel <= 0) {
      gameOver();
    }
  }

  function draw() {
    // Clear background
    ctx.clearRect(0, 0, W, H);
    // Draw star field
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    // Ship (triangle) with slight outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.r, 0);
    ctx.lineTo(-ship.r, ship.r / 2);
    ctx.lineTo(-ship.r, -ship.r / 2);
    ctx.closePath();
    const shipGrad = ctx.createLinearGradient(0, -ship.r, 0, ship.r);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    // Asteroids (rough circles with outline)
    ctx.fillStyle = '#555';
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    // Fuel cells with glow
    fuels.forEach(f => {
      ctx.save();
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Fuel bar
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel, 8);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 100, 8);
  }

  let last = performance.now();
  let running = true;
  function loop(ts) {
    if (!running) return;
    const dt = ts - last;
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W / 2, H / 2);
  }

  requestAnimationFrame(loop);
})();
