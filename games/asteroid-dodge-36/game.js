// Asteroid Dodge game (simple implementation)
// Canvas with id="game" defined in HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // safety if not present
  const ctx = canvas.getContext('2d');
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    // Ensure audio context is running (required after user interaction)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function playThrust() { playTone(200, 100); }
  function playExplosion() { playTone(100, 300); }
  function playCollect() { playTone(500, 100); }
  function playGameOver() { playTone(50, 500); }
  const WIDTH = canvas.width = canvas.offsetWidth;
  const HEIGHT = canvas.height = canvas.offsetHeight;

  // Ship
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    w: 30,
    h: 40,
    speed: 4,
    fuel: 100,
    color: '#0f0',
  };

  // Asteroids
  const asteroids = [];
  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 2 + 1 });
  }
  const asteroidSpawnInterval = 1500; // ms
  let lastAsteroid = 0;

  // Fuel cells
  const fuels = [];
  // Particle trail for ship thrust
  const particles = [];
  const fuelSpawnInterval = 5000;
  let lastFuel = 0;

  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 15;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
    asteroids.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      r: size,
      speed: Math.random() * 2 + 1,
      angle: angle,
      rotSpeed: rotSpeed,
    });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      r: size,
      speed: 1.5,
    });
  }

  function update(dt) {
    // Ship movement
    if (keys['ArrowLeft'] && ship.x - ship.speed > 0) ship.x -= ship.speed;
    if (keys['ArrowRight'] && ship.x + ship.w + ship.speed < WIDTH) ship.x += ship.speed;
    if (keys['ArrowUp'] && ship.y - ship.speed > 0) ship.y -= ship.speed;
    if (keys['ArrowDown'] && ship.y + ship.h + ship.speed < HEIGHT) ship.y += ship.speed;

    // Fuel consumption
    ship.fuel -= dt * 0.01; // drain per ms
    if (ship.fuel <= 0) {
      playGameOver();
      alert('Out of fuel! Game over.');
      document.location.reload();
    }

    // Asteroids update (movement + rotation)
    asteroids.forEach(a => {
      a.y += a.speed;
      a.angle += a.rotSpeed;
    });
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y - asteroids[0].r > HEIGHT) asteroids.shift();

    // Fuel cells update
    fuels.forEach(f => f.y += f.speed);
    while (fuels.length && fuels[0].y - fuels[0].r > HEIGHT) fuels.shift();

    // Background stars scroll (parallax)
    stars.forEach(s => {
      s.y += 0.3; // slower than asteroids
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
      }
    });

    // Ship thrust particles (generated when moving up)
    if (keys['ArrowUp']) {
      playThrust();
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: ship.x + ship.w / 2 + (Math.random() - 0.5) * 10,
          y: ship.y + ship.h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: Math.random() * 1 + 1,
          life: 30,
        });
      }
    }
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Collision detection
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = (ship.x + ship.w / 2) - (a.x + a.r / 2);
      const dy = (ship.y + ship.h / 2) - (a.y + a.r / 2);
      const dist = Math.hypot(dx, dy);
if (dist < a.r / 2 + Math.max(ship.w, ship.h) / 2) {
          playExplosion();
          alert('Crashed! Game over.');
          document.location.reload();
        }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const dx = (ship.x + ship.w / 2) - (f.x + f.r / 2);
      const dy = (ship.y + ship.h / 2) - (f.y + f.r / 2);
      const dist = Math.hypot(dx, dy);
if (dist < f.r / 2 + Math.max(ship.w, ship.h) / 2) {
          playCollect();
          ship.fuel = Math.min(100, ship.fuel + 20);
          fuels.splice(i, 1);
        }
    }

    // Spawn new asteroids/fuel based on timers
    const now = performance.now();
    if (now - lastAsteroid > asteroidSpawnInterval) { spawnAsteroid(); lastAsteroid = now; }
    if (now - lastFuel > fuelSpawnInterval) { spawnFuel(); lastFuel = now; }
  }

  function draw() {
    // Space background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // Draw background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw ship as triangle with gradient
    const shipGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#090');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Draw thrust particles
    ctx.fillStyle = 'rgba(255,165,0,0.8)'; // orange
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Draw asteroids with rotation and glow
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.r / 2, a.y + a.r / 2);
      ctx.rotate(a.angle || 0);
      ctx.shadowColor = 'rgba(255,255,255,0.4)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(0, 0, a.r / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // Draw fuel cells with subtle glow
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x + f.r / 2, f.y + f.r / 2, f.r / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel bar with border
    ctx.fillStyle = '#0ff';
    ctx.fillRect(10, 10, ship.fuel * 2, 10);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, 200, 10);
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
