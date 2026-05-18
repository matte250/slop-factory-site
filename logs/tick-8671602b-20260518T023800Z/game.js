// Simple Space Debris Dodge game
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

// Resize canvas to its displayed size (optional if already set in HTML/CSS)
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // regenerate stars on resize
    generateStars();
  };
  resize();
  window.addEventListener('resize', resize);

  // Background stars for atmosphere
  let stars = [];
  const generateStars = () => {
    const count = Math.max(50, Math.floor((canvas.width * canvas.height) / 8000));
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  generateStars();

  // Ship definition (triangle with gradient)
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    size: 20, // half‑width of base
    speed: 300, // pixels per second
    gradient: null,
  };
  const updateShipGradient = () => {
    ship.gradient = ctx.createLinearGradient(0, ship.y - ship.size, 0, ship.y + ship.size);
    ship.gradient.addColorStop(0, '#00f');
    ship.gradient.addColorStop(1, '#0ff');
  };
  updateShipGradient();

  // Laser visual timer
  let laserTimer = 0; // seconds remaining for visible laser

  // Audio context and sound helpers
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playLaserSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 400;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  const playExplosionSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 100;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };

  // Exhaust particle creation
  const createParticle = () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 20 + Math.random() * 30;
    particles.push({
      x: ship.x + Math.cos(angle) * 2,
      y: ship.y + ship.size,
      r: Math.random() * 2 + 1,
      vx: Math.cos(angle) * speed * 0.2,
      vy: Math.sin(angle) * speed * 0.2 + 30, // slight upward
      alpha: 0.9,
      color: `hsl(${Math.random() * 30}, 100%, 60%)`,
    });
  };

  const updateParticles = (dt) => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.5;
      if (p.alpha <= 0) particles.splice(i, 1);
    }
  };

  // Input state
  const keys = { left: false, right: false, fire: false };
  document.addEventListener('keydown', (e) => {
    // Ensure audio context is running after first user interaction
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (e.code === 'ArrowLeft') keys.left = true;
    else if (e.code === 'ArrowRight') keys.right = true;
    else if (e.code === 'Space') keys.fire = true;
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    else if (e.code === 'ArrowRight') keys.right = false;
    else if (e.code === 'Space') keys.fire = false;
  });

  // Debris array
  const debris = [];
  let spawnAccumulator = 0;
  const BASE_SPAWN_RATE = 1.0; // seconds
  const MIN_SPAWN_RATE = 0.2;
  let laserCooldown = 0; // seconds remaining

  let startTime = null;
  let elapsed = 0; // seconds survived

  // Helper: distance between two points
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  const spawnDebris = () => {
    const radius = 10 + Math.random() * 10;
    const x = radius + Math.random() * (canvas.width - 2 * radius);
    const speedY = 100 + Math.random() * 100 + elapsed * 5; // increase speed over time
    debris.push({ x, y: -radius, radius, speedY });
  };

  const update = (dt) => {
    // Move ship
    if (keys.left) ship.x -= ship.speed * dt;
    if (keys.right) ship.x += ship.speed * dt;
    ship.x = Math.max(ship.size, Math.min(canvas.width - ship.size, ship.x));
    // Update ship gradient after movement
    updateShipGradient();
    // Emit exhaust particles
    createParticle();
    // Update particles
    updateParticles(dt);

    // Laser fire
    if (keys.fire && laserCooldown <= 0) {
      // Find first debris within 30px of ship centre
      const targetIndex = debris.findIndex(d => dist(d.x, d.y, ship.x, ship.y) < d.radius + 30);
      if (targetIndex !== -1) {
        debris.splice(targetIndex, 1);
        playLaserSound();
      }
      laserCooldown = 2.0; // seconds
      laserTimer = 0.2; // visible laser duration
    }
    if (laserCooldown > 0) laserCooldown -= dt;
    if (laserTimer > 0) laserTimer -= dt;

    // Spawn debris
    spawnAccumulator += dt;
    const spawnRate = Math.max(MIN_SPAWN_RATE, BASE_SPAWN_RATE - elapsed * 0.01);
    while (spawnAccumulator >= spawnRate) {
      spawnDebris();
      spawnAccumulator -= spawnRate;
    }

    // Update debris positions and check collisions
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.y += d.speedY * dt;
      // Remove off‑screen
      if (d.y - d.radius > canvas.height) {
        debris.splice(i, 1);
        continue;
      }
      // Collision with ship (approximate ship as circle)
      if (dist(d.x, d.y, ship.x, ship.y) < d.radius + ship.size / 2) {
        // Game over – stop animation loop by not requesting next frame
        gameOver();
        return;
      }
    }
  };

  const draw = () => {
    // Clear and draw space gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001019');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    ctx.fillStyle = '#fff';
    stars.forEach(st => {
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship with gradient
    ctx.fillStyle = ship.gradient;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Draw exhaust particles
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw laser shot if active
    if (laserTimer > 0) {
      ctx.strokeStyle = 'rgba(255,0,0,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - ship.size);
      ctx.lineTo(ship.x, 0);
      ctx.stroke();
    }

    // Draw debris with simple shading
    debris.forEach(d => {
      const grad = ctx.createRadialGradient(d.x, d.y, d.radius * 0.2, d.x, d.y, d.radius);
      grad.addColorStop(0, '#ff7');
      grad.addColorStop(1, '#a33');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Time: ${elapsed.toFixed(1)}s`, 10, 20);

    // Draw laser cooldown indicator
    if (laserCooldown > 0) {
      ctx.fillText(`Laser: ${laserCooldown.toFixed(1)}s`, 10, 40);
    }
  };

  let animationId = null;
  const gameOver = () => {
    cancelAnimationFrame(animationId);
    // Play explosion sound on death
    playExplosionSound();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Game Over! Survived ${elapsed.toFixed(1)} seconds`, canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  };

  const loop = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const dt = (timestamp - (animationId ? lastTimestamp : timestamp)) / 1000;
    elapsed = (timestamp - startTime) / 1000;
    update(dt);
    draw();
    lastTimestamp = timestamp;
    animationId = requestAnimationFrame(loop);
  };
  let lastTimestamp = performance.now();
  animationId = requestAnimationFrame(loop);
})();
