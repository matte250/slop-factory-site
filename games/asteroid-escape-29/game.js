// Asteroid Escape Game – enhanced graphics with sound
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // ----- Audio Setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return; // already playing
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = {osc, gain};
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    thrustOsc.osc.stop(audioCtx.currentTime + 0.1);
    thrustOsc = null;
  }
  function playExplosion() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.stop(audioCtx.currentTime + 0.5);
  }

  // ----- Starfield (background) -----
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0,
    radius: 12,
    speed: 0,
    thrust: 0.12,
    drag: 0.99,
    rotateSpeed: 0.07,
  };

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidCount = 5;
  const asteroidMinSize = 15;
  const asteroidMaxSize = 40;
  const asteroidSpeed = 1.2;

  // Generate an irregular polygon shape for an asteroid
  function createAsteroidShape(size) {
    const points = [];
    const count = Math.floor(Math.random() * 5) + 7; // 7‑11 vertices
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i;
      const radius = size * (0.6 + Math.random() * 0.4); // vary radius 60‑100%
      points.push({x: Math.cos(angle) * radius, y: Math.sin(angle) * radius});
    }
    return points;
  }

  function spawnAsteroid() {
    const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // spawn just outside canvas
    if (side === 0) { x = -size; y = Math.random() * height; }
    else if (side === 1) { x = width + size; y = Math.random() * height; }
    else if (side === 2) { x = Math.random() * width; y = -size; }
    else { x = Math.random() * width; y = height + size; }
    // move roughly towards centre
    const angle = Math.atan2(height/2 - y, width/2 - x) + (Math.random() - 0.5) * 0.5;
    vx = Math.cos(angle) * asteroidSpeed;
    vy = Math.sin(angle) * asteroidSpeed;
    const shape = createAsteroidShape(size);
    asteroids.push({x, y, vx, vy, size, shape});
  }

  for (let i = 0; i < asteroidCount; i++) spawnAsteroid();

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Start thrust sound on first thrust press
    if ((e.key === 'ArrowUp' || e.key === 'w') && !keys['thrustActive']) {
      keys['thrustActive'] = true;
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp' || e.key === 'w') {
      keys['thrustActive'] = false;
      stopThrustSound();
    }
  });

  let score = 0;
  let gameOver = false;

  function update(dt) {
    if (gameOver) return;
    // Ship controls
    if (keys.ArrowLeft || keys.a) ship.angle -= ship.rotateSpeed;
    if (keys.ArrowRight || keys.d) ship.angle += ship.rotateSpeed;
    if (keys.ArrowUp || keys.w) ship.speed += ship.thrust;
    if (keys.ArrowDown || keys.s) ship.speed *= 0.98; // slight brake
    // Apply drag
    ship.speed *= ship.drag;
    // Move ship
    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;
    // Wrap ship
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;
    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      // wrap
      if (a.x < -a.size) a.x = width + a.size;
      if (a.x > width + a.size) a.x = -a.size;
      if (a.y < -a.size) a.y = height + a.size;
      if (a.y > height + a.size) a.y = -a.size;
      // collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.radius) {
        gameOver = true;
        playExplosion();
      }
    }
    // Occasionally add new asteroids
    if (Math.random() < 0.01) spawnAsteroid();
    score += dt;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship – gradient fill for depth
    const shipGrad = ctx.createLinearGradient(-ship.radius, -ship.radius, ship.radius, ship.radius);
    shipGrad.addColorStop(0, '#00ff00');
    shipGrad.addColorStop(1, '#006400');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.restore();
    // Asteroids – irregular polygons with shading
    ctx.strokeStyle = '#555';
    ctx.fillStyle = '#777';
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.beginPath();
      const pts = a.shape;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);
    // Game Over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
