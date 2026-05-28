// Simple Space Minefield game
// Canvas element with id="game" must exist in the HTML.
// Controls: ArrowLeft/ArrowRight rotate, ArrowUp thrust.
// Collect fuel cells to extend thrust time. Crash into asteroids = game over.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.clientWidth || 800;
  const H = canvas.height = canvas.clientHeight || 600;

  // ---- Game objects ----
  const ship = {
    x: W / 2,
    y: H / 2,
    angle: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    thrust: 0.2,
    fuel: 100, // frames of thrust remaining
  };

  // starfield for background
  const stars = Array.from({ length: 80 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * 0.5,
  }));

  // audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, type = 'sine', duration = 0.1) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }

  const asteroids = [];
  const fuels = [];

  const MAX_ASTEROIDS = 8;
  const ASTEROID_SPEED = 1.2;
  const FUEL_SPAWN_INTERVAL = 300; // frames
  let frame = 0;
  let gameOver = false;

  // ---- Input handling ----
  const keys = {};
  window.addEventListener('keydown', e => {
    // resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 30 + 15;
    const x = Math.random() * W;
    const y = Math.random() * H;
    const vx = Math.cos(angle) * ASTEROID_SPEED;
    const vy = Math.sin(angle) * ASTEROID_SPEED;
    // generate irregular polygon points
    const points = [];
    const sides = Math.floor(Math.random() * 5) + 5; // 5-9 sides
    for (let i = 0; i < sides; i++) {
      const theta = (i / sides) * Math.PI * 2;
      const radius = r * (0.7 + Math.random() * 0.3);
      points.push({
        x: Math.cos(theta) * radius,
        y: Math.sin(theta) * radius,
      });
    }
    asteroids.push({ x, y, vx, vy, r, points });
  }

  function spawnFuel() {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = 8;
    fuels.push({ x, y, r, ttl: 600 }); // disappear after 10s
  }

  function update() {
    if (gameOver) return;
    frame++;
    // Input
    if (keys['ArrowLeft']) ship.angle -= 0.07;
    if (keys['ArrowRight']) ship.angle += 0.07;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.fuel--;
      playTone(200, 'square', 0.05); // thrust sound
    }
    // Move ship
    ship.x = (ship.x + ship.vx + W) % W;
    ship.y = (ship.y + ship.vy + H) % H;
    // Friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Asteroids
    if (asteroids.length < MAX_ASTEROIDS && Math.random() < 0.02) spawnAsteroid();
    asteroids.forEach(a => {
      a.x = (a.x + a.vx + W) % W;
      a.y = (a.y + a.vy + H) % H;
    });
    // Fuel cells
    if (frame % FUEL_SPAWN_INTERVAL === 0) spawnFuel();
    fuels.forEach(f => f.ttl--);
    // Collision detection
    for (const a of asteroids) {
      const d = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (d < ship.radius + a.r) { gameOver = true; break; }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      const d = Math.hypot(ship.x - f.x, ship.y - f.y);
      if (d < ship.radius + f.r) { ship.fuel = Math.min(ship.fuel + 100, 300); fuels.splice(i, 1); }
      else if (f.ttl <= 0) { fuels.splice(i, 1); }
    }
  }

  function draw() {
    // background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    // stars (twinkle)
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      // simple twinkle by modulating radius
      const radius = s.r + Math.sin(Date.now() / 200 + s.twinkle) * 0.3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.2, radius), 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship with gradient
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    const shipGrad = ctx.createLinearGradient(-15, -10, 15, 10);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#003');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids as irregular polygons
    ctx.strokeStyle = '#555';
    ctx.fillStyle = '#444';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      const pts = a.points;
      if (pts && pts.length) {
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
    // Fuel cells with glow
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#550');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText('Fuel: ' + ship.fuel, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', W / 2 - 120, H / 2);
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();
})();
