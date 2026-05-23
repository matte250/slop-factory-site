// Simple Orbit Escape game
// Canvas element with id "game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  // Resize to fill parent
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    // create planet gradient based on new size
    planet.gradient = ctx.createRadialGradient(
      planet.x,
      planet.y,
      planet.radius * 0.2,
      planet.x,
      planet.y,
      planet.radius
    );
    planet.gradient.addColorStop(0, '#3aa');
    planet.gradient.addColorStop(1, '#113');
    // regenerate stars for new canvas size
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width,
        y: (Math.random() - 0.5) * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
  };
  window.addEventListener('resize', resize);
  resize();

  // Planet (center of canvas)
  const planet = { x: 0, y: 0, radius: 30, gradient: null };
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: (Math.random() - 0.5) * canvas.width,
      y: (Math.random() - 0.5) * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship state
  const ship = {
    x: 0,
    y: -200,
    vx: 0,
    vy: 0,
    angle: Math.PI / 2,
    radius: 8,
    thrust: 0.1,
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastSpawn = 0;

  // Mouse drag handling for thrust
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  canvas.addEventListener('pointerdown', e => {
    // Ensure audio context is resumed on user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    dragging = true;
    const rect = canvas.getBoundingClientRect();
    dragStart.x = e.clientX - rect.left;
    dragStart.y = e.clientY - rect.top;
  });
  canvas.addEventListener('pointerup', e => {
    if (!dragging) return;
    dragging = false;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dx = x - dragStart.x;
    const dy = y - dragStart.y;
    // Apply thrust opposite to drag direction (like pulling back)
    ship.vx += -dx * ship.thrust * 0.01;
    ship.vy += -dy * ship.thrust * 0.01;
    // Play thrust sound
    playTone(600, 0.05);
  });

  const now = () => performance.now();

  const update = (delta) => {
    // Gravity towards planet
    const dx = ship.x - planet.x;
    const dy = ship.y - planet.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    const grav = 200 / distSq; // simple gravity constant
    ship.vx -= (dx / dist) * grav * (delta / 1000);
    ship.vy -= (dy / dist) * grav * (delta / 1000);

    // Update ship position
    ship.x += ship.vx * (delta / 1000);
    ship.y += ship.vy * (delta / 1000);

    // Spawn asteroids
    if (now() - lastSpawn > asteroidSpawnInterval) {
      lastSpawn = now();
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.min(canvas.width, canvas.height) / 2 + 50;
      const ax = Math.cos(angle) * radius;
      const ay = Math.sin(angle) * radius;
      const speed = 50 + Math.random() * 50;
      const vx = -Math.cos(angle) * speed / 1000;
      const vy = -Math.sin(angle) * speed / 1000;
      asteroids.push({ x: ax, y: ay, vx, vy, radius: 10 + Math.random() * 10 });
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx * delta;
      a.y += a.vy * delta;
      // Remove if far away
      if (Math.abs(a.x) > canvas.width * 2 || Math.abs(a.y) > canvas.height * 2) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dxA = a.x - ship.x;
      const dyA = a.y - ship.y;
      const dA = Math.hypot(dxA, dyA);
if (dA < a.radius + ship.radius) {
          // Collision sound
          playTone(200, 0.3);
          alert('Game Over – Collision!');
          resetGame();
          return;
        }
    }

    // Lose if too far from planet
    if (dist > canvas.width) {
      alert('Game Over – Escaped!');
      resetGame();
    }
  };

  const resetGame = () => {
    ship.x = 0;
    ship.y = -200;
    ship.vx = 0;
    ship.vy = 0;
    asteroids.length = 0;
    lastSpawn = now();
  };

  const draw = () => {
    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (drawn in canvas coordinates, no translation)
    for (const s of stars) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Translate to center for game objects
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Planet with gradient
    ctx.fillStyle = planet.gradient || '#2b2b2b';
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ship as triangle pointing direction of velocity
    const shipAngle = Math.atan2(ship.vy, ship.vx) || -Math.PI / 2;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(
      ship.x + Math.cos(shipAngle) * ship.radius * 2,
      ship.y + Math.sin(shipAngle) * ship.radius * 2
    );
    ctx.lineTo(
      ship.x + Math.cos(shipAngle + Math.PI * 0.8) * ship.radius,
      ship.y + Math.sin(shipAngle + Math.PI * 0.8) * ship.radius
    );
    ctx.lineTo(
      ship.x + Math.cos(shipAngle - Math.PI * 0.8) * ship.radius,
      ship.y + Math.sin(shipAngle - Math.PI * 0.8) * ship.radius
    );
    ctx.closePath();
    ctx.fill();

    // Asteroids with simple gray gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  let lastTime = now();
  const loop = () => {
    const nowTime = now();
    const delta = nowTime - lastTime;
    lastTime = nowTime;
    update(delta);
    draw();
    requestAnimationFrame(loop);
  };
  loop();
})();
