// Minimal Asteroid Escape game with enhanced graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio context and helper
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrustTime = 0;

  // Star field background
  const stars = [];
  const STAR_COUNT = 100;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship (triangle with rotation and gradient)
  const ship = { x: width / 2, y: height - 30, size: 10, speed: 4, angle: 0 };
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume AudioContext on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
    // Play thrust sound when moving keys pressed
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
      const now = performance.now();
      if (now - lastThrustTime > 100) { // prevent spamming
        playBeep(200, 0.05);
        lastThrustTime = now;
      }
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Ship trail particles
  const particles = [];

  // Asteroids array (will use radial gradient when drawn)
  const asteroids = [];
  let lastSpawn = 0;
  let spawnInterval = 2000; // ms
  let asteroidSpeed = 1.5;
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 8 + Math.random() * 12;
    const x = Math.random() * (width - radius * 2) + radius;
    asteroids.push({ x, y: -radius, r: radius, v: asteroidSpeed + Math.random() });
  }

  function update(dt) {
    // ship movement & angle
    let moving = false;
    if (keys.ArrowLeft) { ship.x -= ship.speed; ship.angle = -Math.PI / 2; moving = true; }
    if (keys.ArrowRight) { ship.x += ship.speed; ship.angle = Math.PI / 2; moving = true; }
    if (keys.ArrowUp) { ship.y -= ship.speed; ship.angle = 0; moving = true; }
    if (keys.ArrowDown) { ship.y += ship.speed; ship.angle = Math.PI; moving = true; }
    // keep within bounds
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // generate trail particles when moving
    if (moving) {
      particles.push({
        x: ship.x,
        y: ship.y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        life: 30,
        size: Math.random() * 2 + 1,
      });
    }
    // update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // spawn logic
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.v;
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }

    // collision detection (simple point‑to‑circle)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size) {
        gameOver = true;
        // Play collision sound
        playBeep(100, 0.3);
        break;
      }
    }

    // difficulty ramp
    const elapsed = (performance.now() - startTime) / 1000;
    score = Math.floor(elapsed);
    // speed up every 10 seconds
    asteroidSpeed = 1.5 + elapsed * 0.1;
    spawnInterval = Math.max(300, 2000 - elapsed * 100);
  }

  function draw() {
    // Clear canvas with dark space color
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, width, height);

    // Draw star field
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship trail particles (fade out)
    for (const p of particles) {
      const alpha = p.life / 30;
      ctx.fillStyle = `rgba(0,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with gradient and rotation
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const grad = ctx.createLinearGradient(0, -ship.size, 0, ship.size);
    grad.addColorStop(0, '#00ffff');
    grad.addColorStop(1, '#0066ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(-ship.size, ship.size);
    ctx.lineTo(ship.size, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids with radial gradient
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      radGrad.addColorStop(0, '#777777');
      radGrad.addColorStop(1, '#222222');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score text
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const dt = timestamp - (lastRender || timestamp);
      update(dt);
    }
    draw();
    lastRender = timestamp;
    requestAnimationFrame(loop);
  }
  let lastRender = 0;
  requestAnimationFrame(loop);
})();
