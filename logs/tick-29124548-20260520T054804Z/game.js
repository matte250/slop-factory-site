// Orbit Dodge game – minimal implementation
// Assumes an HTML <canvas id="game"></canvas> present in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size to match displayed size
  const w = (canvas.width = canvas.clientWidth || 800);
  const h = (canvas.height = canvas.clientHeight || 600);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Background hum (low frequency pulsing)
  setInterval(() => playTone(80, 0.3), 3000);

  // Generate a simple star field for background
  const starCount = 100;
  const stars = Array.from({ length: starCount }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: Math.random() * 1.5 + 0.5,
  }));

  // Player ship
  const ship = {
    x: w / 2,
    y: h / 2,
    r: 10,
    speed: 2,
    dx: 0,
    dy: 0,
  };

  // Input handling (WASD / Arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume AudioContext on first user interaction (required by browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updateShip() {
    ship.dx = ship.dy = 0;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -1;
    if (keys['ArrowDown'] || keys['s']) ship.dy = 1;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -1;
    if (keys['ArrowRight'] || keys['d']) ship.dx = 1;
    // Normalize diagonal movement
    if (ship.dx && ship.dy) {
      ship.dx *= Math.SQRT1_2;
      ship.dy *= Math.SQRT1_2;
    }
    ship.x = Math.max(ship.r, Math.min(w - ship.r, ship.x + ship.dx * ship.speed));
    ship.y = Math.max(ship.r, Math.min(h - ship.r, ship.y + ship.dy * ship.speed));
  }

  // Orbiting circles definition
  const rings = [
    { radius: 80, count: 4, speed: 0.01 },
    { radius: 130, count: 6, speed: -0.015 },
    { radius: 180, count: 8, speed: 0.02 },
  ];

  // Generate orbiting objects
  const orbits = [];
  rings.forEach(ring => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2;
      orbits.push({
        radius: ring.radius,
        angle,
        speed: ring.speed,
        r: 15,
      });
    }
  });

  function updateOrbits() {
    orbits.forEach(o => {
      o.angle += o.speed;
    });
  }

  function drawShip() {
    // Ship is drawn as a triangle facing movement direction
    const angle = Math.atan2(ship.dy || 0, ship.dx || 0);
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    const size = ship.r * 2;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw background stars
  function drawStars() {
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
    // Draw ship as a triangle pointing in movement direction
    const angle = Math.atan2(ship.dy || 0, ship.dx || 0);
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    const size = ship.r * 2;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawOrbits() {
    // Draw orbiting obstacles with a subtle glow
    orbits.forEach(o => {
      const x = w / 2 + Math.cos(o.angle) * o.radius;
      const y = h / 2 + Math.sin(o.angle) * o.radius;
      const grad = ctx.createRadialGradient(x, y, o.r * 0.2, x, y, o.r);
      // color based on radius (different rings)
      const hue = 200 + (o.radius % 120);
      grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.9)`);
      grad.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.4)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function checkCollision() {
    for (const o of orbits) {
      const x = w / 2 + Math.cos(o.angle) * o.radius;
      const y = h / 2 + Math.sin(o.angle) * o.radius;
      const dx = ship.x - x;
      const dy = ship.y - y;
      const dist2 = dx * dx + dy * dy;
      const radSum = ship.r + o.r;
      if (dist2 < radSum * radSum) return true;
    }
    return false;
  }

  let start = performance.now();
  let gameOver = false;

  function loop(timestamp) {
    const delta = timestamp - start;
    start = timestamp;

    if (!gameOver) {
      updateShip();
      updateOrbits();
      if (checkCollision()) {
        gameOver = true;
        console.log('Game Over! Survived', Math.floor(delta / 1000), 'seconds');
        // Play collision / game over sound
        playTone(300, 0.3);
      }
    }

    // Dark background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // stars
    drawStars();
    // draw static central point for reference
    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
    ctx.fill();
    drawOrbits();
    drawShip();

    if (!gameOver) requestAnimationFrame(loop);
    else {
      ctx.fillStyle = 'white';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  requestAnimationFrame(loop);
})();
