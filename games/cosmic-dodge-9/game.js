// Minimal Cosmic Dodge game targeting <canvas id="game"></canvas>
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.type = 'square';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  // Resize canvas and generate starfield background
  const stars = [];
  function generateStars(count = 200) {
    stars.length = 0;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
  }
  generateStars();
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  };
  resize();
  window.addEventListener('resize', resize);

  // Ship state
  const ship = { x: 100, y: 100, radius: 8, angle: 0, speed: 0, vx: 0, vy: 0, fuel: 100 };
  const thrust = 0.2; // acceleration per frame
  const maxSpeed = 4;

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;

  let lastSpawn = 0;
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 20;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const y = Math.random() * canvas.height;
    const x = side === 'left' ? -radius : canvas.width + radius;
    const vx = side === 'left' ? asteroidSpeed : -asteroidSpeed;
    asteroids.push({ x, y, radius, vx, vy: 0 });
  }

  function update(dt) {
    if (gameOver) return;
    // Determine if thrusting
    const thrusting = ship.fuel > 0 && (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d']);
    // Ship thrust
    if (thrusting) {
      if (keys['ArrowUp'] || keys['w']) ship.vy -= thrust;
      if (keys['ArrowDown'] || keys['s']) ship.vy += thrust;
      if (keys['ArrowLeft'] || keys['a']) ship.vx -= thrust;
      if (keys['ArrowRight'] || keys['d']) ship.vx += thrust;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // Limit speed
    const speed = Math.hypot(ship.vx, ship.vy);
    if (speed > maxSpeed) {
      ship.vx *= maxSpeed / speed;
      ship.vy *= maxSpeed / speed;
    }
    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Keep within bounds
    ship.x = Math.max(ship.radius, Math.min(canvas.width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(canvas.height - ship.radius, ship.y));
    // Fuel consumption
    ship.fuel -= dt * 0.02; // fuel per ms
    if (ship.fuel <= 0) ship.fuel = 0;

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }
    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove off-screen
      if (a.x < -a.radius || a.x > canvas.width + a.radius) asteroids.splice(i, 1);
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        gameOver = true;
        playExplosionSound();
        break;
      }
    }
    if (ship.fuel <= 0) {
      gameOver = true;
      playExplosionSound();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw starfield background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.brightness;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    ctx.globalAlpha = 1;
    // Draw ship with gradient and thrust flame
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(Math.atan2(ship.vy, ship.vx) + Math.PI / 2);
    const shipGrad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    shipGrad.addColorStop(0, '#0ff');
    shipGrad.addColorStop(1, '#005');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 2, ship.radius);
    ctx.lineTo(-ship.radius / 2, ship.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (ship.fuel > 0 && (keys['ArrowUp'] || keys['w'] || keys['ArrowDown'] || keys['s'] || keys['ArrowLeft'] || keys['a'] || keys['ArrowRight'] || keys['d'])) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 4, ship.radius + ship.radius * 1.5);
      ctx.lineTo(-ship.radius / 4, ship.radius + ship.radius * 1.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.3, a.x, a.y, a.radius);
      grad.addColorStop(0, '#888');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel bar
    ctx.fillStyle = '#0f0';
    const barWidth = 100;
    ctx.fillRect(10, 10, (ship.fuel / 100) * barWidth, 8);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(10, 10, barWidth, 8);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
