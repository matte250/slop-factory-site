// Simple Asteroid Escape game based on IDEA.md
// Canvas with id "game" must exist in the HTML.
(() => {
  // ----- Audio -----
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  let thrustNode = null;
  function playThrust() {
    if (thrustNode) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustNode = { osc, gain };
  }
  function stopThrust() {
    if (!thrustNode) return;
    thrustNode.osc.stop();
    thrustNode = null;
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  function playGameOver() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Utility -----
  const rand = (a, b) => Math.random() * (b - a) + a;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  // ----- Game State -----
  const ship = {
    x: width / 2,
    y: height / 2,
    r: 12,
    angle: 0,
    vx: 0,
    vy: 0,
    thrust: false,
    left: false,
    right: false,
  };
  const asteroids = [];
  const powerUps = [];
  let score = 0;
  let fuel = 100; // percent
  let gameOver = false;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowUp') { ship.thrust = true; playThrust(); }
    if (e.code === 'ArrowLeft') ship.left = true;
    if (e.code === 'ArrowRight') ship.right = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowUp') { ship.thrust = false; stopThrust(); }
    if (e.code === 'ArrowLeft') ship.left = false;
    if (e.code === 'ArrowRight') ship.right = false;
  });

  // ----- Entity Creation -----
  // Create starfield
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({ x: rand(0, width), y: rand(0, height), size: rand(0.5, 2) });
  }

  function spawnAsteroid() {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(0.5, 2);
    const radius = rand(15, 40);
    // spawn at edges
    const edge = Math.floor(rand(0, 4));
    let x, y;
    if (edge === 0) { x = -radius; y = rand(0, height); }
    else if (edge === 1) { x = width + radius; y = rand(0, height); }
    else if (edge === 2) { x = rand(0, width); y = -radius; }
    else { x = rand(0, width); y = height + radius; }
    // create rough polygon points for visual variety
    const points = [];
    const sides = Math.floor(rand(5, 9));
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const r = radius * rand(0.7, 1.0);
      points.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    asteroids.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: radius, points });
  }

  // initial asteroids
  for (let i = 0; i < 5; i++) spawnAsteroid();

  // ----- Game Loop -----
  function update(dt) {
    if (gameOver) return;
    // ship rotation
    if (ship.left) ship.angle -= 3 * dt;
    if (ship.right) ship.angle += 3 * dt;
    // thrust
    if (ship.thrust) {
      const thrustPower = 100; // pixels per second^2
      ship.vx += Math.cos(ship.angle) * thrustPower * dt;
      ship.vy += Math.sin(ship.angle) * thrustPower * dt;
    }
    // apply friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // move ship
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // wrap around
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // fuel consumption
    fuel -= dt * 5; // 5% per second
    if (fuel <= 0 && !gameOver) {
      gameOver = true;
      playGameOver();
    }

    // move asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      if (a.x < -a.r) a.x = width + a.r;
      if (a.x > width + a.r) a.x = -a.r;
      if (a.y < -a.r) a.y = height + a.r;
      if (a.y > height + a.r) a.y = -a.r;
    }
    // spawn new asteroids over time
    if (Math.random() < dt * 0.5) spawnAsteroid();

    // collision detection (ship-asteroid)
    for (const a of asteroids) {
      if (dist(ship, a) < ship.r + a.r) { if (!gameOver) { playExplosion(); } gameOver = true; break; }
    }

    // score based on survival time
    score += dt * 10;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }

    // ship
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    // thrust flame
    if (ship.thrust) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();

    // asteroids (draw as rough polygons)
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 2;
    for (const a of asteroids) {
      if (a.points) {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.beginPath();
        const pts = a.points;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.max(0, Math.floor(fuel))}%`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px monospace';
      ctx.fillText('GAME OVER', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000; // seconds
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
