// Orbital Dodge game implementation
// Targets a <canvas id="game"> element in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function playThrust() {
    if (thrustOsc) return; // already playing
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrust() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playCrash() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  // Unlock audio on first user interaction
  window.addEventListener('keydown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }, {once: true});
  // Set canvas size if not already set
  if (!canvas.width) canvas.width = 800;
  if (!canvas.height) canvas.height = 600;

  const center = { x: canvas.width / 2, y: canvas.height / 2 };

  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.5,
    });
  }

  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.globalAlpha = s.opacity;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Ship state
  const ship = {
    x: center.x,
    y: center.y,
    angle: 0, // radians, 0 points up
    vx: 0,
    vy: 0,
    radius: 10,
  };

  // Asteroid definition (circular orbit)
  class Asteroid {
    constructor(radius, orbitRadius, speed) {
      this.radius = radius; // visual radius
      this.orbitRadius = orbitRadius; // distance from center
      this.speed = speed; // angular speed rad/s
      this.angle = Math.random() * Math.PI * 2;
    }
    update(dt) {
      this.angle += this.speed * dt;
    }
    get position() {
      return {
        x: center.x + Math.cos(this.angle) * this.orbitRadius,
        y: center.y + Math.sin(this.angle) * this.orbitRadius,
      };
    }
  }

  // Create a few asteroids with varying orbits
  const asteroids = [];
  for (let i = 0; i < 8; i++) {
    const orbitRadius = 80 + i * 40;
    const radius = 12 + (i % 3) * 4;
    const speed = (i % 2 === 0 ? 1 : -1) * (0.2 + Math.random() * 0.3);
    asteroids.push(new Asteroid(radius, orbitRadius, speed));
  }

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function updateShip(dt) {
    // Rotation
    if (keys['ArrowLeft']) ship.angle -= 2 * dt; // rotate left
    if (keys['ArrowRight']) ship.angle += 2 * dt; // rotate right
    // Thrust
    ship.thrusting = false;
    if (keys['ArrowUp']) {
      const thrust = 200; // pixels per second^2
      ship.vx += Math.sin(ship.angle) * thrust * dt;
      ship.vy -= Math.cos(ship.angle) * thrust * dt;
      ship.thrusting = true;
      playThrust();
    } else {
      stopThrust();
    }
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within bounds (wrap around)
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
  }
    // Apply velocity
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    // Keep ship within bounds (wrap around)
    if (ship.x < 0) ship.x += canvas.width;
    if (ship.x > canvas.width) ship.x -= canvas.width;
    if (ship.y < 0) ship.y += canvas.height;
    if (ship.y > canvas.height) ship.y -= canvas.height;
  }

  function checkCollisions() {
    for (const ast of asteroids) {
      const pos = ast.position;
      const dx = ship.x - pos.x;
      const dy = ship.y - pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + ast.radius) {
        // Collision – simple game over
        playCrash();
        alert('Game Over!');
        // Reset ship
        ship.x = center.x;
        ship.y = center.y;
        ship.vx = ship.vy = 0;
        ship.angle = 0;
        break;
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body with gradient
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius / 2, ship.radius);
    ctx.lineTo(-ship.radius / 2, ship.radius);
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(0, ship.radius);
      ctx.lineTo(ship.radius / 3, ship.radius + 10);
      ctx.lineTo(-ship.radius / 3, ship.radius + 10);
      ctx.closePath();
      const flameGrad = ctx.createRadialGradient(0, ship.radius + 5, 2, 0, ship.radius + 5, 8);
      flameGrad.addColorStop(0, '#ff0');
      flameGrad.addColorStop(1, '#f00');
      ctx.fillStyle = flameGrad;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroids() {
    for (const ast of asteroids) {
      const p = ast.position;
      // Asteroid gradient shading
      const grad = ctx.createRadialGradient(p.x, p.y, ast.radius * 0.2, p.x, p.y, ast.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, '#844');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, ast.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let lastTime = performance.now();
  function drawBackground() {
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  function loop(now) {
    const dt = (now - lastTime) / 1000; // seconds
    lastTime = now;

    // Update
    asteroids.forEach(a => a.update(dt));
    updateShip(dt);
    checkCollisions();

    // Render
    drawBackground();
    drawStars();
    drawAsteroids();
    drawShip();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
