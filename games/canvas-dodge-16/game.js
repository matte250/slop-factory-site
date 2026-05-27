// Game: Canvas Dodge – enhanced graphics
// Requires a <canvas id="game"></canvas> in the HTML.

(() => {
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  const canvas = document.getElementById('game');
  if (!canvas) return; // abort if missing canvas
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);

  // ----- Starfield background -----
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      // simple twinkle
      s.y += 0.2;
      if (s.y > h) s.y = 0;
    }
  }

  // ----- Ship -----
  const ship = {
    x: w / 2,
    y: h * 0.8,
    width: 20,
    height: 30,
    speed: 2,
    boost: 4,
    vx: 0,
    drifting: 0.5, // forward drift (downward movement)
  };

  // ----- Asteroids -----
  const asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 1500; // ms
  let lastTime = 0;
  let difficulty = 1; // multiplier for speed/interval
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    if (e.key === ' ') {
      // Play boost sound
      beep(800, 0.08);
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 10;
    const x = Math.random() * (w - radius * 2) + radius;
    const y = -radius;
    const speed = 1.5 * difficulty + Math.random();
    const hue = Math.random() * 360;
    asteroids.push({ x, y, radius, speed, hue });
  }

  function update(dt) {
    // Ship input
    ship.vx = 0;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    const boost = keys[' '] ? ship.boost : ship.speed;
    ship.x += ship.vx;
    ship.y += ship.drifting * boost; // forward drift (downward)

    // Keep ship inside canvas
    ship.x = Math.max(0, Math.min(w - ship.width, ship.x));
    ship.y = Math.max(0, Math.min(h - ship.height, ship.y));

    // Asteroids lifecycle
    asteroidTimer += dt;
    if (asteroidTimer > asteroidInterval) {
      asteroidTimer = 0;
      spawnAsteroid();
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * boost;
      if (a.y - a.radius > h) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - (ship.x + ship.width / 2);
      const dy = a.y - (ship.y + ship.height / 2);
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + Math.max(ship.width, ship.height) / 2) {
        // Collision - play crash sound
        beep(200, 0.3);
        running = false;
        break;
      }
    }

    // Difficulty ramp
    difficulty += dt * 0.00005;
    asteroidInterval = Math.max(300, 1500 / difficulty);
  }

  function drawShip() {
    // Ship with a simple gradient
    const grad = ctx.createLinearGradient(
      ship.x,
      ship.y,
      ship.x + ship.width,
      ship.y + ship.height
    );
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#030');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x,
        a.y,
        a.radius * 0.3,
        a.x,
        a.y,
        a.radius
      );
      grad.addColorStop(0, `hsl(${a.hue}, 70%, 80%)`);
      grad.addColorStop(1, `hsl(${a.hue}, 70%, 40%)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    drawStars();
    drawShip();
    drawAsteroids();
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over overlay
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  requestAnimationFrame(loop);
})();

