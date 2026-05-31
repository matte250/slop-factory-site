// Simple dodge‑the‑drones game with improved graphics
// Target canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas not present
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Audio context and simple beep function
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq = 300, duration = 0.1) {
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

  // Starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Player ship
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 10,
    speed: 4,
    vx: 0,
    vy: 0,
  };

  // Drones (enemies)
  const drones = [];
  const droneSpawnInterval = 1000; // ms
  const droneSpeed = 1.5;

  let lastSpawn = 0;
  let lastTime = 0;
  let running = true;

  // Input handling (mouse moves ship)
  canvas.addEventListener('mousemove', e => {
    // Resume AudioContext on first user interaction
    if (audioCtx.state !== 'running') audioCtx.resume();
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
    ship.y = e.clientY - rect.top;
  });

  // Arrow keys as fallback
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function update(dt) {
    // Move ship with arrow keys if mouse not used
    if (!keys['ArrowLeft'] && !keys['ArrowRight'] && !keys['ArrowUp'] && !keys['ArrowDown']) {
      // no keys pressed
    } else {
      if (keys['ArrowLeft']) ship.x -= ship.speed;
      if (keys['ArrowRight']) ship.x += ship.speed;
      if (keys['ArrowUp']) ship.y -= ship.speed;
      if (keys['ArrowDown']) ship.y += ship.speed;
    }
    // Keep ship inside bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));

    // Spawn drones
    if (performance.now() - lastSpawn > droneSpawnInterval) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.max(width, height);
      const x = ship.x + Math.cos(angle) * radius;
      const y = ship.y + Math.sin(angle) * radius;
      const dx = ship.x - x;
      const dy = ship.y - y;
      const len = Math.hypot(dx, dy);
      drones.push({ x, y, vx: (dx / len) * droneSpeed, vy: (dy / len) * droneSpeed, r: 8 });
      beep(500, 0.05); // spawn sound
      lastSpawn = performance.now();
    }

    // Move drones
    for (const d of drones) {
      d.x += d.vx;
      d.y += d.vy;
    }
    // Collision detection
    for (const d of drones) {
      const dx = d.x - ship.x;
      const dy = d.y - ship.y;
      if (Math.hypot(dx, dy) < d.r + ship.r) {
        running = false;
        break;
      }
    }
    // Remove off‑screen drones
    for (let i = drones.length - 1; i >= 0; i--) {
      const d = drones[i];
      if (d.x < -d.r || d.x > width + d.r || d.y < -d.r || d.y > height + d.r) {
        drones.splice(i, 1);
      }
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#444';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with gradient triangle
    ctx.save();
    ctx.translate(ship.x, ship.y);
    const shipGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, ship.r);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r * 0.8, ship.r);
    ctx.lineTo(-ship.r * 0.8, ship.r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Drones with stroke and fill
    for (const d of drones) {
      ctx.fillStyle = '#f44';
      ctx.strokeStyle = '#800';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over overlay
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  requestAnimationFrame(loop);
})();
