// Simple arcade game based on IDEA.md
// Targets a <canvas id="game"></canvas> element in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  let thrustGain = null;
  const startThrustSound = () => {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustGain = audioCtx.createGain();
    thrustOsc.frequency.value = 80;
    thrustGain.gain.value = 0.1;
    thrustOsc.connect(thrustGain).connect(audioCtx.destination);
    thrustOsc.start();
  };
  const stopThrustSound = () => {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustGain.disconnect();
    thrustOsc = null;
    thrustGain = null;
  };
  const playPickupSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
  };
  const playCollisionSound = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  };
  const stars = [];
  const generateStars = () => {
    stars.length = 0;
    const count = Math.floor(canvas.width * canvas.height / 8000);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  };
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  // ----- Game state -------------------------------------------------------
  const ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    angle: 0, // radians, 0 points up
    vx: 0,
    vy: 0,
    thrust: 0.15,
    turnSpeed: Math.PI / 60,
    fuel: 100,
    maxFuel: 100,
    fuelBurn: 0.04,
    fuelGain: 20,
  };

  const asteroids = [];
  const pickups = [];
  const maxAsteroids = 8;
  const asteroidMinDist = 80; // distance from center to start orbit
  const asteroidSpeed = 0.005; // radians per frame
  const pickupSpawnInterval = 5000; // ms
  let lastPickupTime = 0;
  let gameOver = false;
  let score = 0;

  // ----- Input ------------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowUp') {
      audioCtx.resume();
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowUp') {
      stopThrustSound();
    }
  });

  // ----- Helper functions -------------------------------------------------
  const dist = (x1, y1, x2, y2) => Math.hypot(x1 - x2, y1 - y2);

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const distFromCenter = asteroidMinDist + Math.random() * 150;
    const x = canvas.width / 2 + Math.cos(angle) * distFromCenter;
    const y = canvas.height / 2 + Math.sin(angle) * distFromCenter;
    const radius = 15 + Math.random() * 10;
    const orbitRadius = distFromCenter;
    const orbitAngle = angle;
    const orbitSpeed = asteroidSpeed * (0.5 + Math.random());
    asteroids.push({ x, y, radius, orbitRadius, orbitAngle, orbitSpeed });
  }

  function spawnPickup() {
    const angle = Math.random() * Math.PI * 2;
    const radius = 8;
    const distFromCenter = asteroidMinDist + Math.random() * 150;
    const x = canvas.width / 2 + Math.cos(angle) * distFromCenter;
    const y = canvas.height / 2 + Math.sin(angle) * distFromCenter;
    pickups.push({ x, y, radius, collected: false });
  }

  // Initialize asteroids
  for (let i = 0; i < maxAsteroids; i++) spawnAsteroid();

  // ----- Game loop --------------------------------------------------------
  function update(dt) {
    if (gameOver) return;

    // Input handling
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ship.vx += Math.sin(ship.angle) * ship.thrust;
      ship.vy -= Math.cos(ship.angle) * ship.thrust;
      ship.fuel = Math.max(0, ship.fuel - ship.fuelBurn);
    }

    // Move ship
    ship.x += ship.vx;
    ship.y += ship.vy;
    // wrap around edges
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;

    // Asteroid orbit update
    asteroids.forEach(a => {
      a.orbitAngle += a.orbitSpeed;
      a.x = canvas.width / 2 + Math.cos(a.orbitAngle) * a.orbitRadius;
      a.y = canvas.height / 2 + Math.sin(a.orbitAngle) * a.orbitRadius;
    });

    // Collision detection
    for (const a of asteroids) {
if (dist(ship.x, ship.y, a.x, a.y) < ship.radius + a.radius) {
          playCollisionSound();
          stopThrustSound();
          gameOver = true;
          break;
        }
    }
    // Pickups
    const now = Date.now();
    if (now - lastPickupTime > pickupSpawnInterval) {
      spawnPickup();
      lastPickupTime = now;
    }
    for (const p of pickups) {
if (!p.collected && dist(ship.x, ship.y, p.x, p.y) < ship.radius + p.radius) {
          p.collected = true;
          playPickupSound();
          ship.fuel = Math.min(ship.maxFuel, ship.fuel + ship.fuelGain);
          score += 10;
        }
    }
    // Fuel depletion loss
    if (ship.fuel <= 0) gameOver = true;
  }

  function draw() {
    // Clear with space gradient and stars
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship with gradient hull
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // hull gradient
    const hullGrad = ctx.createRadialGradient(0, 0, ship.radius * 0.2, 0, 0, ship.radius);
    hullGrad.addColorStop(0, '#0f0');
    hullGrad.addColorStop(1, '#030');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 2, ship.radius);
    ctx.lineTo(-ship.radius / 2, ship.radius);
    ctx.closePath();
    ctx.fill();
    // thrust flame
    if (keys['ArrowUp'] && ship.fuel > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 3, ship.radius + ship.radius * 1.5);
      ctx.lineTo(-ship.radius / 3, ship.radius + ship.radius * 1.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pickups
    ctx.fillStyle = '#ff0';
    pickups.forEach(p => {
      if (p.collected) return;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 20);
    ctx.fillText(`Score: ${score}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
