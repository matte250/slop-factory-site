// Simple Orbit Dodger game
// Canvas with id="game" must exist in the page.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Full‑screen canvas
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const center = () => ({ x: canvas.width / 2, y: canvas.height / 2 });

  // Ship state
  const ship = {
    angle: 0,          // radians
    radius: 120,        // distance from centre
    angularVel: 0,      // rad/s
    fuel: 100,
    size: 8,
  };

  // Obstacles
  const obstacles = [];
  const maxObstacles = 30;
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;

  // Game state
  let score = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling (thrust changes angular velocity)
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  };

  const playThrust = () => playTone(440, 100);
  const playCollision = () => playTone(150, 300);

  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  const update = dt => {
    if (gameOver) return;
    // fuel consumption
    if (ship.fuel > 0) {
      if (keys['ArrowUp']) {
        ship.angularVel += 0.0008 * dt;
        ship.fuel -= 0.02 * dt;
        playThrust();
      }
      if (keys['ArrowDown']) {
        ship.angularVel -= 0.0008 * dt;
        ship.fuel -= 0.02 * dt;
      }
    }
    // natural drag
    ship.angularVel *= 0.9995;
    ship.angle += ship.angularVel * dt;
    // keep radius constant (orbit), could add radial thrust later

    // Spawn obstacles
    if (Date.now() - lastSpawn > spawnInterval && obstacles.length < maxObstacles) {
      const ang = Math.random() * Math.PI * 2;
      obstacles.push({ angle: ang, radius: Math.max(canvas.width, canvas.height), speed: 0.04 + Math.random() * 0.06, size: 6 + Math.random() * 4 });
      lastSpawn = Date.now();
    }
    // Update obstacles (move inward)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.radius -= o.speed * dt;
      if (o.radius < 0) obstacles.splice(i, 1);
    }
    // Collision detection
    const shipPos = polarToCart(ship.radius, ship.angle);
    for (const o of obstacles) {
      const pos = polarToCart(o.radius, o.angle);
      const dx = shipPos.x - pos.x;
      const dy = shipPos.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + o.size) {
        gameOver = true;
        playCollision();
        break;
      }
    }
    // Update score
    score = ((Date.now() - startTime) / 1000).toFixed(1);
  };

  const polarToCart = (r, a) => {
    const { x, y } = center();
    return { x: x + r * Math.cos(a), y: y + r * Math.sin(a) };
  };

  // Pre‑generated starfield for background
  const stars = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.5 + 0.5,
  }));

  const draw = () => {
    // Motion‑blur trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const { x, y } = center();
    // planet with radial gradient
    const planetGrad = ctx.createRadialGradient(x, y, 10, x, y, 30);
    planetGrad.addColorStop(0, '#555');
    planetGrad.addColorStop(1, '#111');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    // ship (triangle with glow)
    const shipPos = polarToCart(ship.radius, ship.angle);
    ctx.save();
    ctx.translate(shipPos.x, shipPos.y);
    ctx.rotate(ship.angle);
    ctx.shadowColor = '#0f0';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size, ship.size / 2);
    ctx.lineTo(-ship.size, -ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // obstacles with slight variation
    for (const o of obstacles) {
      const pos = polarToCart(o.radius, o.angle);
      const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, o.size);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, o.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s Fuel: ${Math.max(0, ship.fuel).toFixed(0)}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Survived ${score}s`, canvas.width / 2, canvas.height / 2 + 40);
    }
  };


  };

  let lastTime = performance.now();
  const loop = now => {
    const dt = now - lastTime;
    lastTime = now;
    if (!startTime) startTime = Date.now();
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
