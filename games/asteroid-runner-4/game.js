// Simple endless side‑scroll runner based on IDEA.md
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 400;

  // Ship
  const ship = { x: 80, y: H / 2, w: 30, h: 15, dy: 0, fuel: 100 };

  // Asteroids
  const asteroids = [];
  const AST_SPEED = 3; // speed leftwards

  // Starfield background
  const stars = [];
  function initStars() {
    const count = Math.floor(W * H / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  initStars();
  // Input handling and sound setup
  const keys = {};
  // Create audio context (will be resumed on first user interaction)
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur / 1000);
  }
  function playThrust() { beep(500, 80); }
  function playCollision() { beep(150, 400); }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // Play thrust sound when moving
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') playThrust();
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    const y = Math.random() * (H - size);
    asteroids.push({ x: W + size, y, w: size, h: size });
  }

  let lastSpawn = 0;
  const SPAWN_INTERVAL = 1500; // ms

  function update(dt) {
    // Ship control (up/down arrows)
    ship.dy = 0;
    if (keys['ArrowUp']) ship.dy = -4;
    if (keys['ArrowDown']) ship.dy = 4;
    ship.y = Math.max(0, Math.min(H - ship.h, ship.y + ship.dy));

    // Fuel consumption
    ship.fuel -= 0.02 * dt; // drain per ms
    if (ship.fuel <= 0) ship.fuel = 0;

    // Spawn asteroids
    lastSpawn += dt;
    if (lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = 0;
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= AST_SPEED;
      // Remove off‑screen
      if (a.x + a.w < 0) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (ship.x < a.x + a.w && ship.x + ship.w > a.x &&
          ship.y < a.y + a.h && ship.y + ship.h > a.y) {
        // Play collision sound
        playCollision();
        // Game over: stop animation
        cancelAnimationFrame(rAf);
        alert('Game Over!');
        return false;
      }
    }
    // Fuel depletion end
    if (ship.fuel <= 0) {
      // Play collision (or empty) sound
      playCollision();
      cancelAnimationFrame(rAf);
      alert('Out of fuel! Game Over.');
      return false;
    }
    return true;
  }

  function draw() {
    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle pointing right)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w, ship.y + ship.h / 2); // tip
    ctx.lineTo(ship.x, ship.y); // top left
    ctx.lineTo(ship.x, ship.y + ship.h); // bottom left
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles with gradient)
    for (const a of asteroids) {
      const rad = a.w / 2;
      const grad = ctx.createRadialGradient(a.x + rad, a.y + rad, rad * 0.2, a.x + rad, a.y + rad, rad);
      grad.addColorStop(0, '#555');
      grad.addColorStop(1, '#111');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + rad, a.y + rad, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel bar (bordered)
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, 100, 10);
    ctx.fillStyle = '#f80';
    ctx.fillRect(10, 10, ship.fuel, 10);
    // Fuel text
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.fillText('Fuel', 115, 18);
  }

  let lastTime = performance.now();
  let rAf;
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!update(dt)) return; // stop on game over
    draw();
    rAf = requestAnimationFrame(loop);
  }
  rAf = requestAnimationFrame(loop);
})();
