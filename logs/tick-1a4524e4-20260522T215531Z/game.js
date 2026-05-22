// Orbit Dodger game
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playCollision() { playTone(150, 0.3); }
  function playThrust() { playTone(300, 0.1); }
  // Background hum (low volume)
  const humOsc = audioCtx.createOscillator();
  const humGain = audioCtx.createGain();
  humOsc.type = 'triangle';
  humOsc.frequency.value = 60;
  humGain.gain.setValueAtTime(0.02, audioCtx.currentTime);
  humOsc.connect(humGain);
  humGain.connect(audioCtx.destination);
  humOsc.start();
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.width = canvas.clientWidth * dpr;
  const height = canvas.height = canvas.clientHeight * dpr;
  ctx.scale(dpr, dpr);

  const planet = { x: width / 2, y: height / 2, r: 30 }; // central planet
  let ship = { angle: 0, radius: 100, size: 10 }; // ship size is radius of triangle base
  // generate starfield based on CSS size
  function initStars() {
    stars.length = 0;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    for (let i = 0; i < maxStars; i++) {
      stars.push({ x: Math.random() * cssWidth, y: Math.random() * cssHeight });
    }
  }
  initStars();
  const asteroids = [];
  const stars = []; // background stars
  const asteroidSpawnInterval = 1500; // ms
  const maxStars = 200; // starfield density
  const asteroidSpeed = 0.06; // radial speed per frame
  let lastSpawn = 0;
  let startTime = performance.now();
  let score = 0;

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.max(width, height) / 2 + 20;
    asteroids.push({ angle, distance, size: 12 + Math.random() * 8 });
  }

  function update(dt) {
    // Ship control: up/down arrows adjust orbit radius
    // We'll listen to keydown events globally
    // (handled below)
    // Move ship along its orbit
    ship.angle += 0.0015 * dt; // constant angular speed
    // Update asteroids (move inward)
    for (let a of asteroids) {
      a.distance -= asteroidSpeed * dt;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].distance < planet.r) asteroids.splice(i, 1);
    }
    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Collision detection
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    for (let a of asteroids) {
      const ax = planet.x + Math.cos(a.angle) * a.distance;
      const ay = planet.y + Math.sin(a.angle) * a.distance;
      const dx = shipX - ax;
      const dy = shipY - ay;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.size + a.size) {
        // Game over
        playCollision();
        alert('Game Over! Time survived: ' + Math.floor((performance.now() - startTime) / 1000) + 's');
        // Reset
        asteroids.length = 0;
        startTime = performance.now();
        ship.radius = 100;
        break;
      }
    }
    // Score
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#444';
    for (let s of stars) {
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // Planet with radial gradient
    const planetGrad = ctx.createRadialGradient(planet.x, planet.y, planet.r * 0.2, planet.x, planet.y, planet.r);
    planetGrad.addColorStop(0, '#777');
    planetGrad.addColorStop(1, '#222');
    ctx.fillStyle = planetGrad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.r, 0, Math.PI * 2);
    ctx.fill();
    // Ship as triangle pointing forward
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    const heading = ship.angle + Math.PI / 2; // point outward
    const size = ship.size;
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(shipX + Math.cos(heading) * size, shipY + Math.sin(heading) * size);
    ctx.lineTo(shipX + Math.cos(heading + Math.PI * 2 / 3) * size * 0.6, shipY + Math.sin(heading + Math.PI * 2 / 3) * size * 0.6);
    ctx.lineTo(shipX + Math.cos(heading - Math.PI * 2 / 3) * size * 0.6, shipY + Math.sin(heading - Math.PI * 2 / 3) * size * 0.6);
    ctx.closePath();
    ctx.fill();
    // Asteroids with radial gradient
    for (let a of asteroids) {
      const ax = planet.x + Math.cos(a.angle) * a.distance;
      const ay = planet.y + Math.sin(a.angle) * a.distance;
      const grad = ctx.createRadialGradient(ax, ay, a.size * 0.2, ax, ay, a.size);
      grad.addColorStop(0, '#f66');
      grad.addColorStop(1, '#900');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score text
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Time: ' + score + 's', 10, 20);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Input handling with sound
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (e.key === 'ArrowUp') {
      ship.radius = Math.max(planet.r + 20, ship.radius - 5);
      playThrust();
    }
    if (e.key === 'ArrowDown') {
      ship.radius = Math.min(Math.min(width, height) / 2 - 20, ship.radius + 5);
      playThrust();
    }
  });

  // Start loop
  loop();
})();
