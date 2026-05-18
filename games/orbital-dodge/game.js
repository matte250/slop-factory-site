// Simple orbital‑dodge game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 10,
    angle: 0,
    thrust: 0,
    vx: 0,
    vy: 0,
    maxSpeed: 4,
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastAsteroid = 0;

  // Starfield background (static stars)
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Background hum
  const bgOsc = audioCtx.createOscillator();
  const bgGain = audioCtx.createGain();
  bgOsc.frequency.value = 30;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain).connect(audioCtx.destination);
  bgOsc.start();
  // Helper to play short beeps
  function playBeep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  // Input handling
  const keys = {};
  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  document.addEventListener('keyup', e => keys[e.key] = false);

  // Thrust sound cooldown
  let lastThrustSound = 0;

  // Score (distance travelled)
  let startTime = performance.now();
  let score = 0;

  function spawnAsteroid() {
    const size = Math.random() * 20 + 15;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    // spawn off‑screen on the right
    const x = width + size;
    const y = Math.random() * height;
    asteroids.push({x, y, r: size, angle, rotSpeed: (Math.random() - 0.5) * 0.04, vx: -speed, vy: 0});
  }

  function update(dt) {
    // Ship controls
    if (keys.ArrowLeft) ship.angle -= 0.05;
    if (keys.ArrowRight) ship.angle += 0.05;
    if (keys.ArrowUp) {
      ship.thrust = 0.1;
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // Play thrust sound (limited rate)
      const now = performance.now();
      if (now - lastThrustSound > 100) {
        playBeep(400, 0.05);
        lastThrustSound = now;
      }
    } else {
      ship.thrust = 0;
    }
    // Apply simple drag
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Clamp speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > ship.maxSpeed) {
      ship.vx *= ship.maxSpeed / speed;
      ship.vy *= ship.maxSpeed / speed;
    }
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep ship on screen (wrap)
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Asteroids
    const now = performance.now();
    if (now - lastAsteroid > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroid = now;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotSpeed;
      // Remove off‑screen
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Collision detection (circle vs circle)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        // Collision sound
        playBeep(200, 0.3);
        // Game over – stop animation loop
        alert('Collision! Your score: ' + Math.floor(score));
        window.location.reload();
        return;
      }
    }

    // Update score (distance ≈ time * speed)
    score = (now - startTime) * 0.01; // simple scaling
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield (twinkling)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship with optional thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    // Thrust flame
    if (keys.ArrowUp) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // Draw asteroids with gradient shading
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.3, 0, 0, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#333');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
  }

  function loop(timestamp) {
    const dt = timestamp - (lastRender || timestamp);
    lastRender = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let lastRender = null;
  requestAnimationFrame(loop);
})();
