// Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    thrustOsc.type = 'sawtooth';
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (thrustOsc) {
      thrustOsc.stop();
      thrustOsc.disconnect();
      thrustOsc = null;
    }
  }
  function playExplosionSound() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
  if (!canvas) return console.error('Canvas with id="game" not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Ship definition
  // Generate starfield background
  const stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const ship = {
    x: width / 2,
    y: height / 2,
    angle: 0, // radians
    radius: 10,
    thrust: 0,
    vx: 0,
    vy: 0,
    speed: 0.2,
    turnSpeed: 0.07,
  };

  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    // Resume audio context on first interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
  });
  window.addEventListener('keyup', e => {
    keys[e.key] = false;
  });

  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;
  const maxAsteroids = 30;

  function spawnAsteroid() {
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = 1 + Math.random() * 1.5;
    // spawn on random edge
    if (edge === 0) { // top
      x = Math.random() * width;
      y = -20;
      vx = (Math.random() - 0.5) * speed;
      vy = speed;
    } else if (edge === 1) { // right
      x = width + 20;
      y = Math.random() * height;
      vx = -speed;
      vy = (Math.random() - 0.5) * speed;
    } else if (edge === 2) { // bottom
      x = Math.random() * width;
      y = height + 20;
      vx = (Math.random() - 0.5) * speed;
      vy = -speed;
    } else { // left
      x = -20;
      y = Math.random() * height;
      vx = speed;
      vy = (Math.random() - 0.5) * speed;
    }
    const radius = 15 + Math.random() * 20;
    asteroids.push({ x, y, vx, vy, radius });
  }

  function update(dt) {
    // Ship controls
    if (keys['ArrowLeft'] || keys['a']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight'] || keys['d']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp'] || keys['w']) {
      ship.vx += Math.cos(ship.angle) * ship.speed;
      ship.vy += Math.sin(ship.angle) * ship.speed;
      startThrustSound();
    } else {
      stopThrustSound();
    }
    // Apply velocity friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Wrap around edges
    if (ship.x < 0) ship.x += width;
    if (ship.x > width) ship.x -= width;
    if (ship.y < 0) ship.y += height;
    if (ship.y > height) ship.y -= height;

    // Asteroids movement and spawn
    if (Date.now() - lastSpawn > asteroidSpawnInterval && asteroids.length < maxAsteroids) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove off-screen asteroids
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        // Game over: stop loop, play explosion sound
        cancelAnimationFrame(animId);
        playExplosionSound();
        alert('Game Over!');
        return;
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#000014');
    grad.addColorStop(1, '#000814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Starfield
    ctx.fillStyle = 'white';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship (triangle) with outline
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fillStyle = '#00d4ff';
    ctx.fill();
    ctx.strokeStyle = '#0099cc';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // Draw asteroids with fill and stroke
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#555555';
      ctx.fill();
      ctx.strokeStyle = '#999999';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  let lastTime = 0;
  let animId;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
