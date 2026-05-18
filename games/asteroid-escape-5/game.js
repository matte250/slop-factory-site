// Simple Asteroid Escape game based on IDEA.md
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Audio context and helper
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration) {
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
  function playThrust() { playSound(200, 0.05); }
  function playCollision() { playSound(100, 0.5); }
  function playFuel() { playSound(400, 0.2); }

  // Starfield background
  const stars = [];
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.2 + 0.3,
    });
  }

  // Thrust particles storage
  const particles = [];
  const maxParticles = 300;

  // Ship state with visual enhancements
  const ship = {
    x: width / 2,
    y: height * 0.8,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.1,
    turnSpeed: 0.07,
  };

  // Game objects
  const asteroids = [];
  const fuels = [];
  let fuel = 100; // percent
  let gameOver = false;
  let frames = 0;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * width;
    const y = -size;
    const speed = Math.random() * 1.5 + 0.5;
    const angle = Math.random() * Math.PI * 2;
    const spin = (Math.random() - 0.5) * 0.02; // rotation per frame
    asteroids.push({x, y, size, speed, angle, spin});
  }

  function spawnFuel() {
    const size = 8;
    const x = Math.random() * width;
    const y = -size;
    const speed = 1;
    fuels.push({x, y, size, speed});
  }

  function update() {
    if (gameOver) return;
    // Controls
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      // play thrust sound
      playThrust();
      // generate thrust particle
      if (particles.length < maxParticles) {
        particles.push({
          x: ship.x - Math.cos(ship.angle) * ship.radius,
          y: ship.y - Math.sin(ship.angle) * ship.radius,
          vx: -Math.cos(ship.angle) * (Math.random() * 0.5 + 0.5),
          vy: -Math.sin(ship.angle) * (Math.random() * 0.5 + 0.5),
          life: 30,
          size: Math.random() * 2 + 1,
        });
      }
    }

    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Wrap around edges horizontally
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    // Keep ship inside vertical bounds
    if (ship.y < 0) ship.y = 0;
    if (ship.y > height) ship.y = height;

    // Spawn objects
    if (frames % 120 === 0) spawnAsteroid(); // every 2 seconds at 60fps
    if (frames % 300 === 0) spawnFuel(); // every 5 seconds

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      a.angle += a.spin; // rotate asteroid
      // collision with ship (approximate with distance)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.radius) {
        playCollision();
        gameOver = true;
      }
      // remove off‑screen
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }

    // Update fuel orbs
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      const dx = f.x - ship.x;
      const dy = f.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < f.size + ship.radius) {
          playFuel();
          fuel = Math.min(100, fuel + 20);
          fuels.splice(i, 1);
        }
      if (f.y - f.size > height) fuels.splice(i, 1);
    }

    // Update thrust particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.size *= 0.96;
      if (p.life <= 0 || p.size < 0.5) {
        particles.splice(i, 1);
      }
    }


    fuel -= 0.02; // drain per frame
    if (fuel <= 0) gameOver = true;

    frames++;
  }

  function draw() {
    // Clear and draw starfield background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#111';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thrust particles (fade out)
    ctx.fillStyle = 'rgba(255,255,0,0.7)';
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.restore();

    // Asteroids (rotating polygons)
    ctx.fillStyle = '#888';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      const s = a.size;
      ctx.moveTo(s, 0);
      ctx.lineTo(s * Math.cos(0.6), s * Math.sin(0.6));
      ctx.lineTo(s * Math.cos(1.2), s * Math.sin(1.2));
      ctx.lineTo(s * Math.cos(1.8), s * Math.sin(1.8));
      ctx.lineTo(s * Math.cos(2.4), s * Math.sin(2.4));
      ctx.lineTo(s * Math.cos(3.0), s * Math.sin(3.0));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Fuel orbs
    ctx.fillStyle = '#ff0';
    for (const f of fuels) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel meter
    ctx.fillStyle = '#222';
    ctx.fillRect(10, 10, 104, 14);
    ctx.fillStyle = '#0ff';
    ctx.fillRect(12, 12, fuel, 10);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
