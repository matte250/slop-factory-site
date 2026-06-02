// Solar Flare Escape – enhanced graphics
// Requires <canvas id="game"></canvas> in the host HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ----- Helpers ---------------------------------------------------
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // Audio context and simple tone generator
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume AudioContext on first user interaction (required by many browsers)
  const resumeAudio = () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  };
  window.addEventListener('click', resumeAudio, { once: true });
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  };
  let lastThrustSound = 0;

  // ----- Ship ------------------------------------------------------
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 10,
    thrusting: false,
  };
  const TURN_SPEED = 0.07; // rad per frame
  const THRUST = 0.12;
  const FRICTION = 0.995;

  // ----- Asteroids -------------------------------------------------
  const asteroids = [];
  const ASTEROID_MIN_SPEED = 0.5;
  const ASTEROID_MAX_SPEED = 2.0;
  const ASTEROID_MIN_SIZE = 15;
  const ASTEROID_MAX_SIZE = 40;
  const ASTEROID_VERTICES_MIN = 8;
  const ASTEROID_VERTICES_MAX = 12;
  const SPAWN_INTERVAL = 1500; // ms

  const makeAsteroidShape = radius => {
    const vertices = Math.floor(rand(ASTEROID_VERTICES_MIN, ASTEROID_VERTICES_MAX));
    const points = [];
    for (let i = 0; i < vertices; i++) {
      const angle = (Math.PI * 2 / vertices) * i + rand(-0.2, 0.2);
      const r = radius * rand(0.7, 1.0);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    return points;
  };

  const spawnAsteroid = () => {
    const size = rand(ASTEROID_MIN_SIZE, ASTEROID_MAX_SIZE);
    // spawn at a random edge
    const edge = Math.floor(rand(0, 4));
    let x, y, vx, vy;
    if (edge === 0) { // top
      x = rand(0, width); y = -size;
    } else if (edge === 1) { // right
      x = width + size; y = rand(0, height);
    } else if (edge === 2) { // bottom
      x = rand(0, width); y = height + size;
    } else { // left
      x = -size; y = rand(0, height);
    }
    const angle = Math.atan2(height / 2 - y, width / 2 - x) + rand(-0.5, 0.5);
    const speed = rand(ASTEROID_MIN_SPEED, ASTEROID_MAX_SPEED);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, vx, vy, radius: size, shape: makeAsteroidShape(size) });
  };

  // ----- Starfield (once) ------------------------------------------
  const stars = (() => {
    const count = Math.min(200, Math.floor(width * height / 5000));
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
    }
    return arr;
  })();

  // ----- Input ------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // ----- Game Loop -------------------------------------------------
  let lastSpawn = 0;
  let gameOver = false;
  let lastTime = 0;

  const update = delta => {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= TURN_SPEED;
    if (keys['ArrowRight']) ship.angle += TURN_SPEED;
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
      ship.thrusting = true;
      // Play thrust sound (max ~5 per second)
      const now = performance.now();
      if (now - lastThrustSound > 150) {
        playTone(400, 0.05);
        lastThrustSound = now;
      }
    } else {
      ship.thrusting = false;
    }
    // Apply friction
    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap ship
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Spawn asteroids
    const now = performance.now();
    if (now - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = now;
    }
    // Move asteroids
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.radius) a.x = width + a.radius;
      if (a.x > width + a.radius) a.x = -a.radius;
      if (a.y < -a.radius) a.y = height + a.radius;
      if (a.y > height + a.radius) a.y = -a.radius;
    });

    // Collision detection with sound
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius) {
        gameOver = true;
        // play collision sound
        playTone(200, 0.2);
        break;
      }
    }
  };

  const draw = () => {
    // Background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-8, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    // Thrust flame
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // Asteroids (irregular polygons)
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      const pts = a.shape;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  };

  const loop = timestamp => {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
