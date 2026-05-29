// Simple Canvas Dodger game
// Assumes a <canvas id="game"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth || 400;
  const height = canvas.height = canvas.offsetHeight || 300;

  // Player ship (triangle)
  const ship = {
    x: 50,
    y: height / 2,
    size: 12,
    radius: 12, // for collision and bounds
    speed: 3,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));
  // Simple sound effects using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function beep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
    osc.start(now);
    osc.stop(now + duration / 1000);
  }
  let lastThrustTime = 0;
  function playThrust() {
    const now = performance.now();
    if (now - lastThrustTime > 150) { // limit rate
      beep(300, 80);
      lastThrustTime = now;
    }
  }
  function playExplosion() {
    beep(100, 400);
  }

  // Asteroids
  const asteroids = [];
  // starfield background
  const stars = [];
  const STAR_COUNT = 100;
  // generate static stars
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      phase: Math.random() * Math.PI * 2,
    });
  }
  const asteroidSpawnRate = 1500; // ms
  const asteroidSpeed = 2;
  const maxAsteroidSize = 30;

  let lastSpawn = 0;
  let score = 0;
  let running = true;

  function spawnAsteroid() {
    const size = Math.random() * maxAsteroidSize + 5;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size * 2) + size,
      r: size,
      speed: asteroidSpeed + Math.random(),
    });
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // play thrust sound when moving
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      playThrust();
    }
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));

    // spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnRate) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
      // collision
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) {
        playExplosion();
        running = false;
      }
    }

    score += dt / 1000;
  }

  function draw() {
    // background gradient (space nebula)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#000020');
    bgGrad.addColorStop(1, '#001030');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // starfield with twinkling
    ctx.fillStyle = 'white';
    const t = performance.now() * 0.002;
    for (let s of stars) {
      const alpha = 0.5 + 0.5 * Math.sin(t + s.phase);
      ctx.globalAlpha = alpha;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    // ship (triangle) with optional thrust
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size);
    ctx.lineTo(ship.x - ship.size, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();
    // thrust flame when moving
    if (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.size);
      ctx.lineTo(ship.x - ship.size * 0.4, ship.y + ship.size + ship.size * 0.6);
      ctx.lineTo(ship.x + ship.size * 0.4, ship.y + ship.size + ship.size * 0.6);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with simple shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`,
      10, 20);
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      // Game over screen
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'red';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2 - 10);
      ctx.fillText(`Score: ${Math.floor(score)}`,
        width / 2, height / 2 + 20);
    }
  }

  requestAnimationFrame(loop);
})();
