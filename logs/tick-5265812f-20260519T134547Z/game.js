// Simple Asteroid Escape game based on IDEA.md
// Canvas with id="game" must exist in the HTML.

(() => {
  // ----- Visual enhancements -----
  // Create star field background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  // Helper to draw background
  function drawBackground() {
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001020');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = 'white';
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ----- Particle thrust -----
  const particles = [];
  function spawnThrust() {
    const speed = 2;
    const angle = ship.angle + Math.PI;
    particles.push({
      x: ship.x + Math.cos(ship.angle) * ship.radius,
      y: ship.y + Math.sin(ship.angle) * ship.radius,
      vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
      vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 0.5,
      life: 20,
    });
  }
  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles() {
    ctx.fillStyle = 'orange';
    particles.forEach((p) => {
      ctx.globalAlpha = p.life / 20;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Continue with original code
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  // ----- Audio -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCollisionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  }
  function playGameOverSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // ----- Game objects -----
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    angle: -Math.PI / 2,
    radius: 12,
    vx: 0,
    vy: 0,
    thrust: false,
    rotation: 0,
    health: 3,
  };

  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // ----- Input -----
  canvas.addEventListener('mousedown', () => {
    ship.thrust = true;
    startThrustSound();
    // resume context if needed
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  canvas.addEventListener('mouseup', () => {
    ship.thrust = false;
    stopThrustSound();
  });
  canvas.addEventListener('mouseleave', () => {
    ship.thrust = false;
    stopThrustSound();
  });
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const cx = canvas.width / 2;
    const deadZone = 20;
    if (mx < cx - deadZone) ship.rotation = -0.07;
    else if (mx > cx + deadZone) ship.rotation = 0.07;
    else ship.rotation = 0;
  });

  // ----- Helpers -----
  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * canvas.width;
    const y = -size;
    const speed = Math.random() * 1.5 + 0.5;
    const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4; // mostly downwards
    asteroids.push({ x, y, size, speed, angle });
  }

  function update(dt) {
    // ship rotation & thrust
    ship.angle += ship.rotation;
    if (ship.thrust) {
      const thrustPower = 0.1;
      ship.vx += Math.cos(ship.angle) * thrustPower;
      ship.vy += Math.sin(ship.angle) * thrustPower;
      // create thrust particles
      spawnThrust();
    }
    // apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // update particles
    updateParticles();

    // asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += Math.cos(a.angle) * a.speed * dt;
      a.y += Math.sin(a.angle) * a.speed * dt;
      // remove off‑screen
      if (a.y - a.size > canvas.height) asteroids.splice(i, 1);
    }

    // collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.radius) {
        ship.health--;
        asteroids.splice(i, 1);
        playCollisionSound();
        if (ship.health <= 0) {
          gameOver = true;
          playGameOverSound();
        }
      }
    }

    // spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
  }

  function draw() {
    // background
    drawBackground();
    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = ship.thrust ? 'orange' : '#00ffcc'; // brighter ship
    ctx.fill();
    ctx.restore();
    // particles
    drawParticles();
    // asteroids with shading
    asteroids.forEach((a) => {
      const gradient = ctx.createRadialGradient(a.x, a.y, a.size * 0.2, a.x, a.y, a.size);
      gradient.addColorStop(0, '#888888');
      gradient.addColorStop(1, '#222222');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // health bar
    ctx.fillStyle = 'red';
    for (let i = 0; i < ship.health; i++) {
      ctx.fillRect(10 + i * 20, 10, 15, 5);
    }
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    const dt = (timestamp - lastTime) / 16; // approximate 60fps factor
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  })();
})();
