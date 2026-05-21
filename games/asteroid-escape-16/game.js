// Simple endless arcade shooter based on IDEA.md
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) { console.error('Canvas #game not found'); return; }
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  const startAudio = () => { if (!audioStarted) { audioCtx.resume(); audioStarted = true; } };
  window.addEventListener('keydown', startAudio);
  const beep = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  // Game state
  const ship = { x: 50, y: height / 2, w: 30, h: 20, speed: 4 };
  let fuel = 100; // percent
  let distance = 0;
  const asteroids = [];
  const fuels = [];
  const keys = {};
  // Starfield for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1, speed: 0.5 + Math.random() * 0.5 });
  }

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2 + Math.random() * 3 });
  }

  function spawnFuel() {
    const size = 15;
    fuels.push({ x: width, y: Math.random() * (height - size), w: size, h: size, speed: 2 });
  }

  function update() {
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Update stars (move left, wrap)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // Update fuels
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.x -= f.speed;
      if (f.x + f.w < 0) fuels.splice(i, 1);
    }

    // Collisions
    function rectCollision(r1, r2) {
      return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (rectCollision(ship, asteroids[i])) { beep(200, 0.3); gameOver(); return; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      if (rectCollision(ship, fuels[i])) { fuel = Math.min(100, fuel + 20); beep(800, 0.05); fuels.splice(i, 1); }
    }

    // Fuel consumption & distance
    fuel -= 0.02; // per frame
    distance += 0.1;
    if (fuel <= 0) { gameOver(); return; }

    // Random spawns
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();
  }

  function draw() {
    // Clear with dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship – simple triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids – gray circles with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel cells – orange glows
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x + f.w / 2, f.y + f.h / 2, f.w * 0.2, f.x + f.w / 2, f.y + f.h / 2, f.w / 2);
      grad.addColorStop(0, '#ffcc66');
      grad.addColorStop(1, '#ff6600');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Dist: ${Math.floor(distance)} m`, 10, 40);
  }

  let animationId;
  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function gameOver() {
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2 - 20);
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Distance: ${Math.floor(distance)} m`, width / 2, height / 2 + 20);
  }

  // Start game loop
  loop();
})();
