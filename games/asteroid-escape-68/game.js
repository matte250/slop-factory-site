// Simple Asteroid Escape game with improved graphics
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Audio setup -----
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // resume on user interaction (required by browsers)
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  // Thrust sound (short low‑pitch beep)
  function playThrust() {
    playTone(150, 50);
  }
  // Explosion sound (quick high‑pitch chirp)
  function playExplosion() {
    playTone(400, 120);
  }

  // ----- Stars background -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // ----- Player -----
  const ship = {
    x: width / 2,
    y: height - 60,
    radius: 15,
    speed: 4,
    dx: 0,
    dy: 0,
    color: 'white',
  };

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidConfig = {
    spawnInterval: 1500, // ms
    minRadius: 10,
    maxRadius: 30,
    maxSpeed: 2,
    count: 0,
  };

  function spawnAsteroid() {
    const radius = Math.random() * (asteroidConfig.maxRadius - asteroidConfig.minRadius) + asteroidConfig.minRadius;
    const x = Math.random() * (width - radius * 2) + radius;
    const y = -radius;
    const speed = Math.random() * asteroidConfig.maxSpeed + 0.5;
    asteroids.push({ x, y, radius, speed });
    asteroidConfig.count++;
  }

  // ----- Input -----
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function updatePlayer() {
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft || keys.a) ship.dx = -ship.speed;
    if (keys.ArrowRight || keys.d) ship.dx = ship.speed;
    if (keys.ArrowUp || keys.w) ship.dy = -ship.speed;
    if (keys.ArrowDown || keys.s) ship.dy = ship.speed;
    // play thrust sound when moving
    if (ship.dx !== 0 || ship.dy !== 0) playThrust();
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * delta * 0.06; // scale speed
      if (a.y - a.radius > height) {
        asteroids.splice(i, 1);
      }
    }
  }

  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Game over
        playExplosion();
        alert('Game Over!');
        // reset
        asteroids.length = 0;
        ship.x = width / 2;
        ship.y = height - 60;
        break;
      }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000011');
    bgGrad.addColorStop(1, '#001133');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ship with thrust
    if (ship.dx !== 0 || ship.dy !== 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.dx * 2, ship.y - ship.dy * 2);
      ctx.lineTo(ship.x - ship.dx * 2 - 5, ship.y - ship.dy * 2 + 5);
      ctx.lineTo(ship.x - ship.dx * 2 + 5, ship.y - ship.dy * 2 + 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.1, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#555555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let lastTime = 0;
  let spawnTimer = 0;
  function loop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    spawnTimer += delta;
    if (spawnTimer > asteroidConfig.spawnInterval) {
      spawnAsteroid();
      spawnTimer = 0;
    }
    updatePlayer();
    updateAsteroids(delta);
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
