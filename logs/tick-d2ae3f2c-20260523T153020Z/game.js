// Simple Orbit Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Handle high‑DPI displays
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width = canvas.clientWidth * dpr;
  const height = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);
  // generate static stars for background
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    radius: Math.random() * 1.5 + 0.5
  }));
  // generate static stars for background
  const stars = Array.from({length: 80}, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5
  }));
  // ---- Game objects ----
  const planet = { x: width / 2, y: height / 2, r: 30 };
  const ship = {
    angle: 0, // radians around planet
    radius: 80, // distance from planet centre
    size: 10,
    vx: 0,
    vy: 0,
    thrust: 0.2,
    friction: 0.99
  };
  const asteroids = [];
  const orbs = [];
  let fuel = 100;
  let score = 0;
  let gameOver = false;

  // ---- Helpers ----
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  function spawnAsteroid() {
    const edge = Math.floor(rand(0, 4)); // 0 top,1 right,2 bottom,3 left
    let x, y, dx, dy;
    const speed = rand(0.5, 2);
    switch (edge) {
      case 0: x = rand(0, width); y = -20; dx = rand(-1, 1); dy = speed; break;
      case 1: x = width + 20; y = rand(0, height); dx = -speed; dy = rand(-1, 1); break;
      case 2: x = rand(0, width); y = height + 20; dx = rand(-1, 1); dy = -speed; break;
      case 3: x = -20; y = rand(0, height); dx = speed; dy = rand(-1, 1); break;
    }
    const r = rand(10, 25);
    asteroids.push({ x, y, dx, dy, r });
  }
  function spawnOrb() {
    const angle = rand(0, Math.PI * 2);
    const radius = rand(60, 120);
    const x = planet.x + Math.cos(angle) * radius;
    const y = planet.y + Math.sin(angle) * radius;
    orbs.push({ x, y, r: 5, collected: false });
  }

  // ---- Audio setup ----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    // Ensure audio context is running (required by some browsers)
    if (audioCtx.state !== 'running') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  function playThrust() { playTone(200, 100); }
  function playCollect() { playTone(600, 100); }
  function playExplosion() { playTone(80, 400); }

  // ---- Input ----
  let thrusting = false;
  canvas.addEventListener('mousedown', () => { thrusting = true; playThrust(); });
  canvas.addEventListener('mouseup', () => thrusting = false);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrusting = true; playThrust(); }, { passive: false });
  canvas.addEventListener('touchend', () => thrusting = false);

  // ---- Game Loop ----
  function update(dt) {
    if (gameOver) return;
    // ship orbit update
    ship.angle += 0.01; // constant orbital speed
    // thrust changes velocity relative to ship direction (tangent)
    if (thrusting && fuel > 0) {
      const tx = Math.cos(ship.angle + Math.PI / 2) * ship.thrust;
      const ty = Math.sin(ship.angle + Math.PI / 2) * ship.thrust;
      ship.vx += tx;
      ship.vy += ty;
      fuel = Math.max(0, fuel - 0.1);
    }
    // apply friction
    ship.vx *= ship.friction;
    ship.vy *= ship.friction;
    // update ship position relative to planet
    const sx = Math.cos(ship.angle) * ship.radius + ship.vx;
    const sy = Math.sin(ship.angle) * ship.radius + ship.vy;
    ship.x = planet.x + sx;
    ship.y = planet.y + sy;

    // asteroids move
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.dx; a.y += a.dy;
      // collision with ship
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.size) { gameOver = true; }
      // remove off‑screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
      }
    }

    // orbs collection
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (!o.collected) {
        const d = Math.hypot(o.x - ship.x, o.y - ship.y);
        if (d < o.r + ship.size) {
          o.collected = true;
          score += 10;
          fuel = Math.min(100, fuel + 20);
          orbs.splice(i, 1);
        }
      }
    }

    // spawn logic
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnOrb();
  }

function draw() {
    // clear with dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // planet with radial gradient (already set in draw)
    const planetGrad = ctx.createRadialGradient(
      planet.x, planet.y, planet.r * 0.2,
      planet.x, planet.y, planet.r
    );
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // ship as triangle pointing forward
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle + Math.PI / 2);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(ship.size * 0.8, ship.size);
    ctx.lineTo(-ship.size * 0.8, ship.size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids with subtle gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x, a.y, a.r * 0.3,
        a.x, a.y, a.r
      );
      grad.addColorStop(0, '#b44');
      grad.addColorStop(1, '#511');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // orbs with glow effect
    orbs.forEach(o => {
      const orbGrad = ctx.createRadialGradient(
        o.x, o.y, 0,
        o.x, o.y, o.r
      );
      orbGrad.addColorStop(0, '#ff0');
      orbGrad.addColorStop(1, 'rgba(255,165,0,0)');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
