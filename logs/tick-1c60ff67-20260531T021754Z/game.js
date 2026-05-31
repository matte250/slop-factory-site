// Asteroid Escape game implementation targeting <canvas id="game">
(() => {
  // Create starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  // Ship state
  const ship = {
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 10,
    rotating: 0, // -1 left, 1 right, 0 none
    thrusting: false,
  };

  const asteroids = [];
  const maxAsteroids = 5;
  const asteroidMinSize = 15;
  const asteroidMaxSize = 30;

  const keys = {};
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
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
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }

  document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft') ship.rotating = -1;
    if (e.key === 'ArrowRight') ship.rotating = 1;
    if (e.key === 'ArrowUp') {
      ship.thrusting = true;
      startThrustSound();
    }
  });
  document.addEventListener('keyup', e => {
    keys[e.key] = false;
    if (e.key === 'ArrowLeft' && ship.rotating === -1) ship.rotating = 0;
    if (e.key === 'ArrowRight' && ship.rotating === 1) ship.rotating = 0;
    if (e.key === 'ArrowUp') {
      ship.thrusting = false;
      stopThrustSound();
    }
  });

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const size = Math.random() * (asteroidMaxSize - asteroidMinSize) + asteroidMinSize;
    switch (side) {
      case 0: // top
        x = Math.random() * width;
        y = -size;
        vx = (Math.random() - 0.5) * 1.5;
        vy = Math.random() * 1.5 + 0.5;
        break;
      case 1: // right
        x = width + size;
        y = Math.random() * height;
        vx = -Math.random() * 1.5 - 0.5;
        vy = (Math.random() - 0.5) * 1.5;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + size;
        vx = (Math.random() - 0.5) * 1.5;
        vy = -Math.random() * 1.5 - 0.5;
        break;
      case 3: // left
        x = -size;
        y = Math.random() * height;
        vx = Math.random() * 1.5 + 0.5;
        vy = (Math.random() - 0.5) * 1.5;
        break;
    }
    asteroids.push({ x, y, vx, vy, radius: size });
  }

  function update(dt) {
    // Ship rotation
    if (ship.rotating) ship.angle += ship.rotating * 0.05 * dt;
    // Thrust
    if (ship.thrusting) {
      ship.vx += Math.cos(ship.angle) * 0.1 * dt;
      ship.vy += Math.sin(ship.angle) * 0.1 * dt;
    }
    // Friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;

    // Keep ship inside bounds (lose if leaves)
    if (ship.x < 0 || ship.x > width || ship.y < 0 || ship.y > height) {
      gameOver();
    }

    // Asteroids movement
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -a.radius || a.x > width + a.radius || a.y < -a.radius || a.y > height + a.radius) {
        asteroids.splice(i, 1);
      }
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = ship.x - a.x;
      const dy = ship.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ship.radius + a.radius) {
        gameOver();
        break;
      }
    }
    // Spawn new asteroids
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Ship (triangle with outline)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Thrust flame
    if (ship.thrusting) {
      ctx.beginPath();
      ctx.moveTo(-10, -5);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.restore();
    // Asteroids (irregular with gradient)
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let last = performance.now();
  let over = false;
  function loop(now) {
    const dt = (now - last) / 16; // normalized to ~60fps steps
    last = now;
    if (!over) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    }
  }
  function gameOver() {
    over = true;
    // Play explosion sound
    playExplosionSound();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'red';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', width / 2, height / 2);
  }

  requestAnimationFrame(loop);
})();
