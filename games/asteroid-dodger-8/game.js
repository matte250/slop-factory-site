// Minimal Asteroid Dodger game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume audio on first user interaction (required by some browsers)
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Player ship
  const ship = {
    x: width / 2,
    y: height - 60,
    radius: 12,
    speed: 4,
    dx: 0,
    dy: 0,
    health: 3,
  };

  // Input handling (arrow keys)
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const maxAsteroidSize = 30;
  // Starfield for background effect
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.5 + Math.random() * 1.5,
      alpha: 0.5 + Math.random() * 0.5,
    });
  }

  let distance = 0;
  let lastTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    const size = Math.random() * maxAsteroidSize + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      radius: size,
      speed: 1 + Math.random() * 2,
    });
  }

  function update(dt) {
    // Player movement
    ship.dx = 0; ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));

    // Asteroid movement
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
    if (dist < a.radius + ship.radius) {
      ship.health--;
      playBeep(200, 0.2);
      a.y = height + a.radius; // move off‑screen to avoid multiple hits this frame
      if (ship.health <= 0) {
        gameOver = true;
        playBeep(100, 0.5);
      }
    }
    }

    // Spawn new asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    distance += dt * 0.1; // arbitrary scaling
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // Starfield
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Update and draw stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
        s.speed = 0.5 + Math.random() * 1.5;
      }
      ctx.fillStyle = 'rgba(255,255,255,' + s.alpha + ')';
      ctx.fillRect(s.x, s.y, 2, 2);
    }

    // Ship – draw as a triangle with gradient
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.radius * 0.2, ship.x, ship.y, ship.radius);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#060');
    ctx.fillStyle = shipGrad;
    const angle = Math.atan2(ship.dy, ship.dx) || -Math.PI / 2;
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius * 0.8, ship.radius);
    ctx.lineTo(-ship.radius * 0.8, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Asteroids – gray radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // HUD – health icons and score
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    // Draw small ship icons for health
    for (let i = 0; i < ship.health; i++) {
      ctx.save();
      ctx.translate(10 + i * 20, 20);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 6);
      ctx.lineTo(-5, 6);
      ctx.closePath();
      ctx.fillStyle = '#0f0';
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#fff';
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 50);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
