// Simple Asteroid Escape game with enhanced graphics
// Canvas element with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  const playThrust = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrust = () => {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  };
  const playCrash = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };
  // Resize canvas to fill the window
  // Create starfield for background
  const starCount = 200;
  const stars = [];
  const createStars = () => {
    stars.length = 0;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
  };
  const drawStars = () => {
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };
  let backgroundGradient;
const resize = () => {
    // Ensure canvas covers full viewport
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recreate stars on resize
    createStars();
    // Create radial gradient background (dark space)
    backgroundGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      Math.min(canvas.width, canvas.height) * 0.1,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.7
    );
    backgroundGradient.addColorStop(0, '#001');
    backgroundGradient.addColorStop(1, '#000');
  };
  // Initial setup
  createStars();
  resize();
  // Keep canvas and stars in sync on window resize
  window.addEventListener('resize', resize);

  // ----- Game state -----
  const keys = {};
  const ship = {
    // trail of previous positions for motion blur
    trail: [],
    x: canvas.width * 0.2,
    y: canvas.height / 2,
    angle: 0, // radians, 0 points to the right
    speedX: 0,
    speedY: 0,
    radius: 12,
  };

  const asteroids = [];
  let lastAsteroidTime = 0;
  const asteroidInterval = 1500; // ms
  let score = 0;
  let startTime = performance.now();
  let running = true;

  // ----- Input -----
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    // Ensure audio context is resumed on user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helper functions -----
  const rand = (min, max) => Math.random() * (max - min) + min;

  const spawnAsteroid = () => {
    const size = rand(15, 35);
    asteroids.push({
      x: canvas.width + size,
      y: rand(size, canvas.height - size),
      radius: size,
      speed: rand(2, 5),
    });
  };

  const updateShip = dt => {
    const thrust = 0.1;
    const rotateSpeed = 0.003 * dt; // rad per ms
    if (keys['ArrowLeft'] || keys['KeyA']) ship.angle -= rotateSpeed;
    if (keys['ArrowRight'] || keys['KeyD']) ship.angle += rotateSpeed;
    if (keys['ArrowUp'] || keys['KeyW']) {
      ship.speedX += Math.cos(ship.angle) * thrust;
      ship.speedY += Math.sin(ship.angle) * thrust;
      playThrust();
    } else {
      stopThrust();
    }
    // Apply friction
    ship.speedX *= 0.99;
    ship.speedY *= 0.99;
    // Update position
    ship.x += ship.speedX * dt * 0.06; // scale for reasonable speed
    ship.y += ship.speedY * dt * 0.06;
    // Keep within bounds (wrap around vertically and horizontally)
    if (ship.y < -ship.radius) ship.y = canvas.height + ship.radius;
    if (ship.y > canvas.height + ship.radius) ship.y = -ship.radius;
    if (ship.x < -ship.radius) ship.x = canvas.width + ship.radius;
    if (ship.x > canvas.width + ship.radius) ship.x = -ship.radius;
    // Record trail for motion blur
    ship.trail.push({ x: ship.x, y: ship.y, angle: ship.angle });
    if (ship.trail.length > 12) ship.trail.shift();
  };

  const updateAsteroids = dt => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt * 0.06;
      if (a.x < -a.radius) asteroids.splice(i, 1);
    }
    // Spawn new asteroids
    const now = performance.now();
    if (now - lastAsteroidTime > asteroidInterval) {
      spawnAsteroid();
      lastAsteroidTime = now;
    }
  };

  const checkCollision = () => {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < a.radius + ship.radius) {
          playCrash();
          running = false;
          break;
        }
    }
  };

  const drawShip = () => {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // ship body with gradient
    const grad = ctx.createLinearGradient(-12, -12, 12, 12);
    grad.addColorStop(0, '#0ff');
    grad.addColorStop(1, '#006');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    // thrust flame when accelerating
    if (keys['ArrowUp'] || keys['KeyW']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-18, -5);
      ctx.lineTo(-18, 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  const drawTrail = () => {
    ctx.save();
    for (let i = 0; i < ship.trail.length; i++) {
      const p = ship.trail[i];
      const alpha = (i + 1) / ship.trail.length * 0.4;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, ship.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  };

    const drawAsteroids = () => {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);
  };

  const updateStars = dt => {
    const speed = 0.02; // pixels per ms
    for (const s of stars) {
      s.x -= speed * dt;
      if (s.x < 0) s.x = canvas.width;
    }
  };

  const gameLoop = timestamp => {
    const dt = timestamp - (gameLoop.last ?? timestamp);
    gameLoop.last = timestamp;
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
      ctx.font = '24px sans-serif';
      ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 40);
      return; // stop loop
    }
    // Update
    updateShip(dt);
    updateAsteroids(dt);
    updateStars(dt);
    checkCollision();
    // Score based on survival time
    score = (timestamp - startTime) / 1000;
    // Render
    ctx.fillStyle = backgroundGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawStars();
    drawTrail();
    drawShip();
    drawAsteroids();
    drawScore();
    requestAnimationFrame(gameLoop);
  };

  requestAnimationFrame(gameLoop);
})();
