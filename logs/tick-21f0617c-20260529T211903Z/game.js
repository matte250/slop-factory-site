// Simple endless‑runner based on IDEA.md
// Canvas with id="game"
(() => {
  // ----- Visual Enhancements -----
  // Starfield background
  const stars = [];
  function initStars(count = 100) {
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  }
  function updateStars() {
    for (const s of stars) {
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
        s.speed = Math.random() * 0.5 + 0.2;
      }
    }
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;
  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  let lastThrust = 0;
  // Resume audio context on first user interaction
  const resumeAudio = () => { audioCtx.resume(); window.removeEventListener('click', resumeAudio); window.removeEventListener('keydown', resumeAudio); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // ----- Ship -----
  const ship = {
    x: width * 0.1,
    y: height / 2,
    size: 20,
    speed: 4,
    angle: 0,
    radius: 12,
  };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Asteroids -----
  const asteroids = [];
  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    asteroids.push({
      x: width + size,
      y: Math.random() * height,
      r: size,
      vx: -(Math.random() * 2 + 2),
      angle: Math.random() * Math.PI * 2,
      av: (Math.random() - 0.5) * 0.04,
    });
  }
  let asteroidTimer = 0;

  // ----- Helpers -----
  function drawShip() {
    // Glow effect
    ctx.shadowColor = 'lime';
    ctx.shadowBlur = 8;
    // Gradient for ship body
    const shipGrad = ctx.createRadialGradient(0, 0, ship.size * 0.2, 0, 0, ship.size);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, -ship.size / 2);
    ctx.closePath();
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }
  }

  function drawAsteroid(a) {
  // Draw asteroid with radial gradient fill for depth
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.angle);
    ctx.beginPath();
    const sides = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const rad = a.r * (0.7 + Math.random() * 0.3);
      ctx.lineTo(Math.cos(theta) * rad, Math.sin(theta) * rad);
    }
    ctx.closePath();
    // Radial gradient for depth
    const grad = ctx.createRadialGradient(0, 0, a.r*0.3, 0, 0, a.r);
    grad.addColorStop(0, '#888');
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.stroke();
    ctx.restore();
  }

  function update() {
    // Play thrust sound if moving
    const moving = keys.ArrowUp || keys.w || keys.ArrowDown || keys.s || keys.ArrowLeft || keys.a || keys.ArrowRight || keys.d;
    if (moving && (performance.now() - lastThrust) > 100) {
      playTone(300, 0.05);
      lastThrust = performance.now();
    }
    // Update background stars
    updateStars();
    // Input handling
    if (keys.ArrowUp || keys.w) ship.y -= ship.speed;
    if (keys.ArrowDown || keys.s) ship.y += ship.speed;
    if (keys.ArrowLeft || keys.a) ship.x -= ship.speed;
    if (keys.ArrowRight || keys.d) ship.x += ship.speed;
    // Keep inside canvas
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));
    ship.angle = Math.atan2(
      (keys.ArrowDown || keys.s) - (keys.ArrowUp || keys.w),
      (keys.ArrowRight || keys.d) - (keys.ArrowLeft || keys.a)
    );

    // Asteroid logic
    asteroidTimer -= 1;
    if (asteroidTimer <= 0) {
      spawnAsteroid();
      asteroidTimer = Math.random() * 60 + 30; // 0.5‑2 sec
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.angle += a.av;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }

    // Collision detection (circle‑based)
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.r + ship.radius) {
          // Collision sound
          playTone(150, 0.5);
          // Game over – stop animation
          cancelAnimationFrame(frameId);
          ctx.fillStyle = 'red';
          ctx.font = '48px sans-serif';
          ctx.fillText('Game Over', width / 2 - 120, height / 2);
          return;
        }
    }
  }

  function render() {
    // Draw background with stars
    drawStars();
    // Draw ship and asteroids on top
    drawShip();
    for (const a of asteroids) drawAsteroid(a);
  }

  function loop() {
    update();
    render();
    frameId = requestAnimationFrame(loop);
  }
  let frameId = requestAnimationFrame(loop);
})();
