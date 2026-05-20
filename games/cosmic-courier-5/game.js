// Minimal Cosmic Courier game
// Assumes an existing <canvas id="game"> in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // Audio context and helper functions
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(400, 0.1);
  const playExplosion = () => playTone(100, 0.5);
  const playGameOver = () => playTone(200, 0.3);

  // Resize to fill parent
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // ----- Game entities ---------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    radius: 10,
    fuel: 100,
  };

  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    z: Math.random() * 2 + 0.5,
  }));

  const asteroids = [];
  const maxAsteroids = 5;
  const spawnAsteroid = () => {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { x = 0; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = 0; }
    else { x = Math.random() * canvas.width; y = canvas.height; }
    const speed = Math.random() * 1 + 0.5;
    const angle = Math.atan2(ship.y - y, ship.x - x);
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: Math.random() * 15 + 5 });
  };

  // ----- Input -----------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Game state ------------------------------------------------------
  let packageTimer = 30; // seconds
  let lastTime = 0;
  let gameOver = false;
  let soundPlayed = false;
  const triggerGameOverSound = () => {
    if (!soundPlayed) {
      playGameOver();
      soundPlayed = true;
    }
  };

  const update = dt => {
    if (gameOver) return;

    // Ship controls
    if (keys.ArrowLeft) ship.angle -= 3 * dt;
    if (keys.ArrowRight) ship.angle += 3 * dt;
    if (keys.ArrowUp && ship.fuel > 0) {
      const thrust = 100 * dt;
      ship.vx += Math.cos(ship.angle) * thrust;
      ship.vy += Math.sin(ship.angle) * thrust;
      ship.fuel = Math.max(0, ship.fuel - 20 * dt);
      playThrust();
    }

    // Apply velocity & wrap around edges
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    ship.vx *= 0.99; // simple drag
    ship.vy *= 0.99;
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Update asteroids
    asteroids.forEach(a => {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      // wrap
      if (a.x < 0) a.x += canvas.width;
      if (a.x > canvas.width) a.x -= canvas.width;
      if (a.y < 0) a.y += canvas.height;
      if (a.y > canvas.height) a.y -= canvas.height;
    });
    // Spawn if needed
    while (asteroids.length < maxAsteroids) spawnAsteroid();

    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        gameOver = true;
        playExplosion();
        break;
      }
    }

    // Fuel & timer loss conditions
    if (ship.fuel <= 0) { gameOver = true; triggerGameOverSound(); }
    packageTimer -= dt;
    if (packageTimer <= 0) { gameOver = true; triggerGameOverSound(); }
  };

  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

// Background gradient (deep space)
  const bgGrad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
  );
  bgGrad.addColorStop(0, '#001');
  bgGrad.addColorStop(1, '#000');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars (twinkling)
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    s.x -= ship.vx * 0.1 * s.z * 0.016;
    s.y -= ship.vy * 0.1 * s.z * 0.016;
    if (s.x < 0) s.x += canvas.width;
    if (s.x > canvas.width) s.x -= canvas.width;
    if (s.y < 0) s.y += canvas.height;
    if (s.y > canvas.height) s.y -= canvas.height;
    const size = Math.random() * 2;
    const alpha = 0.5 + Math.random() * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillRect(s.x, s.y, size, size);
  });
  ctx.globalAlpha = 1.0;

  // Ship (gradient outline)
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  const shipGrad = ctx.createLinearGradient(-10, 0, 10, 0);
  shipGrad.addColorStop(0, '#0f0');
  shipGrad.addColorStop(1, '#080');
  ctx.fillStyle = shipGrad;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(-8, -8);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // Asteroids (irregular polygons)
  ctx.fillStyle = '#888';
  asteroids.forEach(a => {
    const points = 8;
    const variance = 0.4;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radius = a.radius * (1 - variance / 2 + Math.random() * variance);
      const x = a.x + Math.cos(angle) * radius;
      const y = a.y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${ship.fuel.toFixed(0)}`, 10, 20);
    ctx.fillText(`Time: ${Math.max(0, packageTimer).toFixed(1)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = timestamp => {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
