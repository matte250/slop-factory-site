// Asteroid Dodger – enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Player ship (drawn as triangle)
  const ship = { w: 30, h: 30, x: width / 2, y: height - 40, speed: 6 };

  // Asteroids list
  const asteroids = [];
  let asteroidTimer = 0;
  const asteroidInterval = 60; // frames
  // Background stars
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
  // Explosion effect placeholder
  let explosion = null;

  // Score
  let startTime = performance.now();
  let running = true;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function beep(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 3,
    });
    // Play spawn sound
    beep(200, 0.05);
  }

  function update() {
    // Move ship
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Spawn asteroids
    if (asteroidTimer-- <= 0) {
      spawnAsteroid();
      asteroidTimer = asteroidInterval;
    }

    // Move asteroids
    asteroids.forEach(a => (a.y += a.speed));
    // Remove off‑screen
    while (asteroids.length && asteroids[0].y > height) asteroids.shift();

    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < ship.x + ship.w &&
        a.x + a.w > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.h > ship.y
      ) {
        running = false;
        // create explosion effect at ship position
        explosion = { x: ship.x, y: ship.y, radius: ship.w / 2, age: 0, maxAge: 30 }; beep(400, 0.2);
        break;
      }
    }

    // Update explosion
    if (explosion) {
      explosion.age++;
      if (explosion.age > explosion.maxAge) explosion = null;
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Stars
    ctx.fillStyle = '#555';
    stars.forEach(s => ctx.beginPath() || ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2) && ctx.fill());
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles with gradient)
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, a.w * 0.2, a.x + a.w / 2, a.y + a.h / 2, a.w / 2);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Explosion (simple expanding circle)
    if (explosion) {
      ctx.fillStyle = 'rgba(255,100,0,' + (1 - explosion.age / explosion.maxAge) + ')';
      ctx.beginPath();
      ctx.arc(explosion.x, explosion.y, explosion.radius + explosion.age * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!running) {
      draw();
      return;
    }
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
