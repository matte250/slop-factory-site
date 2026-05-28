// Game: Asteroid Escape
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  const W = (canvas.width = canvas.clientWidth);
  const H = (canvas.height = canvas.clientHeight);
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playThrust(start) {
    if (start) {
      if (thrustOsc) return;
      thrustOsc = audioCtx.createOscillator();
      thrustOsc.type = 'sawtooth';
      thrustOsc.frequency.setValueAtTime(150, audioCtx.currentTime);
      thrustOsc.connect(audioCtx.destination);
      thrustOsc.start();
    } else {
      if (thrustOsc) {
        thrustOsc.stop();
        thrustOsc.disconnect();
        thrustOsc = null;
      }
    }
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  }
  function playShield() {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  }

  // ----- Settings -----
  const GRAVITY = 0.4;
  const THRUST = -8;
  const SHIP_SIZE = 20;
  const ASTEROID_MIN = 20;
  const ASTEROID_MAX = 60;
  const ASTEROID_SPEED = 4;
  const ASTEROID_SPAWN_INTERVAL = 1500; // ms
  const STAR_COUNT = 100;
  const SHIELD_DURATION = 4000; // ms

  // ----- State -----
  let ship = { x: 80, y: H / 2, vy: 0, shield: false, shieldTimer: 0 };
  const asteroids = [];
  const stars = [];
  let lastAsteroid = 0;
  let thrusting = false;
  let score = 0;
  let lastTime = performance.now();

  // Init stars for parallax background
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2,
      // slight twinkle phase
      twinkle: Math.random() * Math.PI * 2
    });
  }
  // Particle system for shield and explosions
  const particles = [];

  // Event handling
  const setThrust = (on) => {
    thrusting = on;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    playThrust(on);
  };
  canvas.addEventListener('mousedown', () => setThrust(true));
  canvas.addEventListener('mouseup', () => setThrust(false));
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); setThrust(true); }, { passive: false });
  canvas.addEventListener('touchend', (e) => { e.preventDefault(); setThrust(false); }, { passive: false });

  // Helper: create a new asteroid
  function spawnAsteroid() {
    const size = ASTEROID_MIN + Math.random() * (ASTEROID_MAX - ASTEROID_MIN);
    const y = Math.random() * (H - size) + size / 2;
    asteroids.push({ x: W + size, y, r: size / 2, vx: -ASTEROID_SPEED });
  }

  // Helper: simple AABB circle collision
  function circleCollide(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const rad = ar + br;
    return dx * dx + dy * dy < rad * rad;
  }

  // Main loop
  function update(dt) {
    // background stars move left for parallax effect
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = W;
    }

    // Ship physics
    if (thrusting) ship.vy = THRUST;
    else ship.vy += GRAVITY;
    ship.y += ship.vy * dt / 16; // normalize to ~60fps steps
    // Keep ship within vertical bounds
    if (ship.y < SHIP_SIZE) { ship.y = SHIP_SIZE; ship.vy = 0; }
    if (ship.y > H - SHIP_SIZE) { ship.y = H - SHIP_SIZE; ship.vy = 0; }

    // Engine thrust particles
    if (thrusting) {
      particles.push({
        x: ship.x - SHIP_SIZE / 2,
        y: ship.y,
        vx: -2 - Math.random() * 1,
        vy: (Math.random() - 0.5) * 1,
        size: 2 + Math.random() * 2,
        life: 20,
        color: '#0ff'
      });
    }

    // Shield timer
    if (ship.shield) {
      ship.shieldTimer -= dt;
      if (ship.shieldTimer <= 0) ship.shield = false;
    }

    // Spawn asteroids
    if (performance.now() - lastAsteroid > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      lastAsteroid = performance.now();
    }

    // Update asteroids and check collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * dt / 16;
      // Remove off‑screen asteroids and increase score
      if (a.x + a.r < 0) { asteroids.splice(i, 1); score++; continue; }
      // Collision with ship
      if (!ship.shield && circleCollide(ship.x, ship.y, SHIP_SIZE / 2, a.x, a.y, a.r)) {
        // Explosion particles and sound
        playExplosion();
        for (let p = 0; p < 30; p++) {
          particles.push({
            x: ship.x,
            y: ship.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: 2 + Math.random() * 3,
            life: 40,
            color: '#f80'
          });
        }
        // Game over – display simple message and stop animation
        alert(`Game Over! Score: ${score}`);
        // Reset state
        ship = { x: 80, y: H / 2, vy: 0, shield: false, shieldTimer: 0 };
        asteroids.length = 0;
        score = 0;
        return; // skip drawing this frame
      }
    }

    // Randomly grant shield power‑up (simple 1% chance per frame)
    if (!ship.shield && Math.random() < 0.01) {
      ship.shield = true;
      ship.shieldTimer = SHIELD_DURATION;
      playShield();
    }

    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.96;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    // Background gradient (dark space)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);
    // Stars with twinkle effect
    const now = performance.now() / 1000;
    for (const s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin(now * 2 + s.twinkle);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = ship.shield ? 'cyan' : 'lime';
    ctx.beginPath();
    ctx.moveTo(-SHIP_SIZE / 2, SHIP_SIZE / 2);
    ctx.lineTo(SHIP_SIZE / 2, SHIP_SIZE / 2);
    ctx.lineTo(0, -SHIP_SIZE / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#ff8888');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Particles (explosions)
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    // Shield timer UI
    if (ship.shield) {
      ctx.fillText(`Shield: ${(ship.shieldTimer / 1000).toFixed(1)}s`, 10, 40);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
