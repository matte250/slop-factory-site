// Minimal Orbit Escape game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = {
    angle: 0,            // radians
    radius: 150,         // distance from planet centre
    speed: 0.02,         // angular speed
    thrustPower: -0.5,   // change radius per frame when thrusting
    fuel: 100,
    radiusSize: 10,
  };

  const planet = { x: width / 2, y: height / 2, radius: 30 };

  const asteroids = [];
  const asteroidConfig = {
    count: 5,
    speed: 1.5,
    size: 12,
    spawnRadius: Math.max(width, height) / 2 + 20,
  };

  // Input handling – space or ArrowUp for thrust
  let thrust = false;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let thrustOsc = null;
  function startThrustSound() {
    if (thrustOsc) return;
    thrustOsc = audioCtx.createOscillator();
    thrustOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    thrustOsc.connect(gain).connect(audioCtx.destination);
    thrustOsc.start();
  }
  function stopThrustSound() {
    if (!thrustOsc) return;
    thrustOsc.stop();
    thrustOsc.disconnect();
    thrustOsc = null;
  }
  function playExplosion() {
    const bufferSize = audioCtx.sampleRate * 0.2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    noise.connect(filter).connect(audioCtx.destination);
    noise.start();
  }
  window.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { thrust = true; startThrustSound(); audioCtx.resume(); } });
  window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { thrust = false; stopThrustSound(); } });

  function spawnAsteroid() {
    const angle = Math.random() * Math.PI * 2;
    const x = planet.x + Math.cos(angle) * asteroidConfig.spawnRadius;
    const y = planet.y + Math.sin(angle) * asteroidConfig.spawnRadius;
    const vx = (planet.x - x) / asteroidConfig.spawnRadius * asteroidConfig.speed;
    const vy = (planet.y - y) / asteroidConfig.spawnRadius * asteroidConfig.speed;
    asteroids.push({ x, y, vx, vy, radius: asteroidConfig.size });
  }

  // Initialize asteroids
  for (let i = 0; i < asteroidConfig.count; i++) spawnAsteroid();

  function update(dt) {
    // Update ship orbit
    ship.angle += ship.speed;
    if (thrust && ship.fuel > 0) {
      ship.radius += ship.thrustPower * dt;
      ship.fuel -= 0.05 * dt;
    }
    // Prevent radius from going inside planet or off canvas
    ship.radius = Math.max(planet.radius + ship.radiusSize, Math.min(ship.radius, Math.min(width, height) / 2 - ship.radiusSize));

    // Update asteroids
    for (const a of asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
    }
    // Re‑spawn any asteroid that passed the planet
    for (let i = 0; i < asteroids.length; i++) {
      const a = asteroids[i];
      const dx = a.x - planet.x;
      const dy = a.y - planet.y;
      if (Math.hypot(dx, dy) < planet.radius) {
        // collision with planet – remove and spawn new
        asteroids.splice(i, 1, null);
        spawnAsteroid();
        i--;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Background stars
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // draw simple starfield
    for (let i = 0; i < 50; i++) {
      const sx = Math.random() * width;
      const sy = Math.random() * height;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + Math.random() * 0.5) + ')';
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Planet with gradient
    const grad = ctx.createRadialGradient(planet.x, planet.y, planet.radius * 0.2, planet.x, planet.y, planet.radius);
    grad.addColorStop(0, '#98fb98');
    grad.addColorStop(1, '#2e8b57');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ship (triangle)
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    const shipDir = ship.angle;
    const size = ship.radiusSize;
    ctx.fillStyle = '#1e90ff';
    ctx.beginPath();
    ctx.moveTo(
      shipX + Math.cos(shipDir) * size,
      shipY + Math.sin(shipDir) * size
    );
    ctx.lineTo(
      shipX + Math.cos(shipDir + Math.PI * 0.75) * size * 0.6,
      shipY + Math.sin(shipDir + Math.PI * 0.75) * size * 0.6
    );
    ctx.lineTo(
      shipX + Math.cos(shipDir - Math.PI * 0.75) * size * 0.6,
      shipY + Math.sin(shipDir - Math.PI * 0.75) * size * 0.6
    );
    ctx.closePath();
    ctx.fill();
    // Thrust flame
    if (thrust && ship.fuel > 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(
        shipX - Math.cos(shipDir) * size * 0.8,
        shipY - Math.sin(shipDir) * size * 0.8
      );
      ctx.lineTo(
        shipX + Math.cos(shipDir + Math.PI * 0.5) * size * 0.4,
        shipY + Math.sin(shipDir + Math.PI * 0.5) * size * 0.4
      );
      ctx.lineTo(
        shipX + Math.cos(shipDir - Math.PI * 0.5) * size * 0.4,
        shipY + Math.sin(shipDir - Math.PI * 0.5) * size * 0.4
      );
      ctx.closePath();
      ctx.fill();
    }

    // Asteroids with gradient shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#d2691e');
      grad.addColorStop(1, '#8b4513');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fuel bar
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#ff0';
    ctx.fillRect(10, 10, ship.fuel, 10);
  }

  function checkCollision() {
    const shipX = planet.x + Math.cos(ship.angle) * ship.radius;
    const shipY = planet.y + Math.sin(ship.angle) * ship.radius;
    for (const a of asteroids) {
      const dx = a.x - shipX;
      const dy = a.y - shipY;
      if (Math.hypot(dx, dy) < a.radius + ship.radiusSize) {
        return true;
      }
    }
    return false;
  }

  let last = performance.now();
  let gameOver = false;
  function loop(now) {
    const dt = (now - last) / 16; // normalise to ~60fps units
    last = now;
    if (!gameOver) {
      update(dt);
      draw();
      if (ship.fuel <= 0 || checkCollision()) {
        gameOver = true;
        playExplosion();
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', width / 2, height / 2);
      } else {
        requestAnimationFrame(loop);
      }
    }
  }

  requestAnimationFrame(loop);
})();
