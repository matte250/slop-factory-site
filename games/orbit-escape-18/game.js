// Simple Orbit Escape game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    // Ensure the audio context is running (required after user gesture)
    if (audioCtx.state !== 'running') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain).connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrust() { playTone(600, 0.05); }
  function playExplosion() { playTone(150, 0.3); }

  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Planet at centre
  const stars = [];
  // generate background stars
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }
  const planet = { x: width / 2, y: height / 2, radius: 30 };

  // Ship state
  const ship = {
    x: planet.x,
    y: planet.y - 150, // start above planet
    radius: 8,
    vx: 0,
    vy: 0,
    angle: 0,
  };

  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, w: false, a: false, s: false, d: false };
  const thrust = 0.05; // acceleration per frame
  const gravity = 0.02; // pull toward planet
  const safeRadius = planet.radius + 20; // crash if closer

  // Asteroids list
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let lastAsteroidTime = 0;

  // Score
  let startTime = performance.now();
  let gameOver = false;
  let explosionPlayed = false;

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
        keys[e.key] = true;
        // Play thrust sound on any thrust key press
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) {
            playThrust();
        }
    }
});
  window.addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) * 0.6;
    const x = planet.x + Math.cos(angle) * distance;
    const y = planet.y + Math.sin(angle) * distance;
    const speed = 1 + Math.random() * 1.5;
    const vx = (planet.x - x) / distance * speed;
    const vy = (planet.y - y) / distance * speed;
    asteroids.push({ x, y, vx, vy, radius: 12 + Math.random() * 8 });
  }

  function update(dt) {
    if (gameOver) return;
    // Ship thrust based on input
    let ax = 0, ay = 0;
    if (keys.ArrowUp || keys.w) { ay -= thrust; }
    if (keys.ArrowDown || keys.s) { ay += thrust; }
    if (keys.ArrowLeft || keys.a) { ax -= thrust; }
    if (keys.ArrowRight || keys.d) { ax += thrust; }
    ship.vx += ax;
    ship.vy += ay;

    // Gravity toward planet
    const dx = planet.x - ship.x;
    const dy = planet.y - ship.y;
    const dist = Math.hypot(dx, dy);
    const gv = gravity * (dist / 200); // stronger when farther
    ship.vx += (dx / dist) * gv;
    ship.vy += (dy / dist) * gv;

    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Update ship orientation based on velocity
    ship.angle = Math.atan2(ship.vy, ship.vx);

    // Crash into planet?
    if (dist < safeRadius) {
        gameOver = true;
        if (!explosionPlayed) { playExplosion(); explosionPlayed = true; }
      }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // collision with ship
      if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.radius + ship.radius) {
          if (!explosionPlayed) { playExplosion(); explosionPlayed = true; }
        gameOver = true;
      }
      // remove if off-screen
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
      }
    }

    // Spawn new asteroid
    if (performance.now() - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      lastAsteroidTime = performance.now();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw background stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.radius * 0.2, planet.x, planet.y, planet.radius);
    planetGrad.addColorStop(0, '#888');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    // Ship (triangle pointing forward)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius / 2);
    ctx.lineTo(-ship.radius, -ship.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Asteroids
    ctx.fillStyle = '#a33';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Score / Game Over
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Time: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Survived ${elapsed}s`, width / 2, height / 2 + 40);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - (prev ?? timestamp);
    prev = timestamp;
    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  let prev;
  requestAnimationFrame(loop);
})();
