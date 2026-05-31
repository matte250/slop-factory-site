// Cosmic Runner – minimal side‑scroll canvas game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill parent (fallback values)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 400;

  const ship = { x: 80, y: canvas.height / 2, radius: 12, vy: 0 };
  // Stars array
  const stars = [];
  // Initialize stars for background
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      brightness: Math.random()
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let audioStarted = false;
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  const asteroids = [];
  let shield = 100; // shield energy (0 = lost)
  let lastAsteroid = 0;
  const keys = { ArrowUp: false, ArrowDown: false };

  // Input handling
  document.addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; if (!audioStarted && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { audioCtx.resume(); audioStarted = true; } });
  document.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 15 + Math.random() * 20;
    asteroids.push({ x: canvas.width + size, y: Math.random() * canvas.height, r: size, vx: -3 - Math.random() * 2 });
  }

  function update(dt) {
    // Update stars for parallax and twinkle
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= 0.5; // slow leftward drift
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
      // flicker brightness
      s.brightness = Math.min(1, Math.max(0, s.brightness + (Math.random() - 0.5) * 0.05));
    }

    // Ship thrust
    if (keys.ArrowUp) { ship.vy -= 0.2; playBeep(800, 0.05); }
    if (keys.ArrowDown) ship.vy += 0.2;
    // Apply friction
    ship.vy *= 0.95;
    ship.y += ship.vy;
    // Keep within bounds
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));

    // Asteroids
    if (performance.now() - lastAsteroid > 1000) { spawnAsteroid(); lastAsteroid = performance.now(); }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // Collision detection
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.r + ship.radius) {
          // collision – end game with sound
          playBeep(200, 0.3);
          cancelAnimationFrame(frameId);
          alert('Game Over');
          return false;
        }
    }
    // Simple shield drain (optional)
    shield = Math.max(0, shield - dt * 0.02);
    if (shield === 0) { cancelAnimationFrame(frameId); alert('Shield depleted – Game Over'); return false; }
    return true;
  }

  function draw() {
    // Background – dark space with moving stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#002');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // stars (simple twinkling)
    stars.forEach(s => {
      ctx.fillStyle = s.brightness > 0.8 ? '#fff' : '#888';
      ctx.fillRect(s.x, s.y, 2, 2);
    });

    // Ship – triangle with a subtle glow
    const shipGrad = ctx.createRadialGradient(
      ship.x, ship.y, ship.radius / 2,
      ship.x, ship.y, ship.radius * 2
    );
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y - ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving up
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.radius, ship.y);
      ctx.lineTo(ship.x - ship.radius - 10, ship.y - 5);
      ctx.lineTo(ship.x - ship.radius - 10, ship.y + 5);
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids – rock like with shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Shield bar – green fading to red when low
    const shieldRatio = shield / 100;
    const shieldColor = shieldRatio > 0.5 ? '#0f0' : shieldRatio > 0.2 ? '#ff0' : '#f00';
    ctx.fillStyle = shieldColor;
    ctx.fillRect(10, 10, shieldRatio * 100, 8);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 100, 8);
  }

  let lastTime = performance.now();
  let frameId;
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (update(dt)) {
      draw();
      frameId = requestAnimationFrame(loop);
    }
  }
  loop();
})();
