// Cosmic Dodge – simple canvas game
// The HTML contains a <canvas id="game"></canvas>
// This script creates a player ship that rotates with ←/→ and thrusts with ↑.
// Asteroids appear at random edges and move toward the centre. Collision ends the game.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Ensure canvas fills its container (HTML may set size via CSS)
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;
  const { width, height } = canvas;
  const center = { x: width / 2, y: height / 2 };

  // Pre‑generate star field for background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, r: Math.random() * 1.5 + 0.5 });
  }

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    thrustOsc = { osc, gain };
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
    thrustOsc.osc.stop(audioCtx.currentTime + 0.06);
    thrustOsc = null;
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  /*** Ship ***/
  const ship = {
    x: center.x,
    y: center.y,
    angle: 0, // radians, 0 points right
    vx: 0,
    vy: 0,
    radius: 10,
  };
  const shipControls = { left: false, right: false, thrust: false };
  const ROT_SPEED = 0.07; // radians per frame
  const THRUST = 0.12;
  const FRICTION = 0.99;

  /*** Asteroids ***/
  const asteroids = [];
  const ASTEROID_MIN_SPEED = 1.0;
  const ASTEROID_MAX_SPEED = 2.5;
  const SPAWN_INTERVAL = 1500; // ms

  function spawnAsteroid() {
    // Choose a random edge: 0=top,1=right,2=bottom,3=left
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -20;
    } else if (edge === 1) { // right
      x = width + 20;
      y = Math.random() * height;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + 20;
    } else { // left
      x = -20;
      y = Math.random() * height;
    }
    // Direction toward centre
    const dx = center.x - x;
    const dy = center.y - y;
    const dist = Math.hypot(dx, dy);
    const speed = ASTEROID_MIN_SPEED + Math.random() * (ASTEROID_MAX_SPEED - ASTEROID_MIN_SPEED);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;
    const radius = 15 + Math.random() * 15;
    const angle = Math.random() * Math.PI * 2;
    const rotationSpeed = (Math.random() - 0.5) * 0.02; // small rotation per frame
    asteroids.push({ x, y, vx, vy, radius, angle, rotationSpeed });
  }

  // Input handling
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') shipControls.left = true;
    else if (e.code === 'ArrowRight') shipControls.right = true;
    else if (e.code === 'ArrowUp') {
      shipControls.thrust = true;
      audioCtx.resume && audioCtx.resume();
      startThrustSound();
    }
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') shipControls.left = false;
    else if (e.code === 'ArrowRight') shipControls.right = false;
    else if (e.code === 'ArrowUp') {
      shipControls.thrust = false;
      stopThrustSound();
    }
  });

  let running = true;
  function update() {
    // Ship rotation
    if (shipControls.left) ship.angle -= ROT_SPEED;
    if (shipControls.right) ship.angle += ROT_SPEED;
    // Ship thrust
    if (shipControls.thrust) {
      ship.vx += Math.cos(ship.angle) * THRUST;
      ship.vy += Math.sin(ship.angle) * THRUST;
    }
    // Apply friction
    ship.vx *= FRICTION;
    ship.vy *= FRICTION;
    // Update position
    ship.x += ship.vx;
    ship.y += ship.vy;

    // Keep ship within bounds (wrap around)
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Update asteroids (movement & rotation)
    for (const a of asteroids) {
      a.x += a.vx;
      a.y += a.vy;
      a.angle += a.rotationSpeed;
    }

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        running = false;
        playExplosionSound();
        break;
      }
    }
  }

  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    // Ship body
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-8, -6);
    ctx.lineTo(-8, 6);
    ctx.closePath();
    ctx.fillStyle = '#0ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Thrust flame
    if (shipControls.thrust) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.beginPath();
      const points = 7;
      const step = (Math.PI * 2) / points;
      for (let i = 0; i < points; i++) {
        const angle = i * step + Math.random() * step * 0.5;
        const r = a.radius * (0.7 + Math.random() * 0.3);
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fillStyle = '#999';
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawStars() {
    ctx.fillStyle = '#555';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

function render() {
    // Dark space background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    drawShip();
    drawAsteroids();
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    if (!running) {
      render();
      return; // stop animation
    }
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Start spawning asteroids and game loop
  const spawnTimer = setInterval(() => {
    if (!running) { clearInterval(spawnTimer); return; }
    spawnAsteroid();
  }, SPAWN_INTERVAL);

  // Initial asteroids
  for (let i = 0; i < 3; i++) spawnAsteroid();
  requestAnimationFrame(loop);
})();
