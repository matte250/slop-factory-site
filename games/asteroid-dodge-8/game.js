// game.js – Simple Asteroid Dodge prototype
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----------------------------------------------------
  const ship = {
    x: width / 2,
    y: height - 80,
    radius: 15,
    direction: 0, // -1 left, 1 right, 0 none
    speed: 3,
    fuel: 100,
  };

  const asteroids = [];
  const starCount = 100;
  const stars = [];

  // Create static star field (tiny white points)
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
    });
  }

  let lastTime = 0;
  let spawnTimer = 0;

  // ----- Input ----------------------------------------------------------
  // Click or tap toggles steering direction left/right and plays thrust sound.
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  }
  function playThrust() { playTone(200, 100); }
  function playCollision() { playTone(100, 400); }
  function playBackground() {
    // simple low hum loop
    playTone(50, 1000);
  }
  // start background hum after first interaction
  let bgStarted = false;
  canvas.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (!bgStarted) { bgStarted = true; setInterval(playBackground, 1500); }
    ship.direction = ship.direction === -1 ? 1 : -1; // toggle
    playThrust();
  });

  // ----- Helper functions ------------------------------------------------
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    // ship gradient: bright nose fading to transparent tail
    const grad = ctx.createLinearGradient(0, -ship.radius, 0, ship.radius);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#003300');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -ship.radius);
    ctx.lineTo(ship.radius, ship.radius);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    // optional thrust flame when moving
    if (ship.direction !== 0) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(-ship.radius / 2, ship.radius);
      ctx.lineTo(0, ship.radius + Math.random() * 8 + 4);
      ctx.lineTo(ship.radius / 2, ship.radius);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAsteroid(a) {
    // radial gradient for depth effect
    const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#555');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStars() {
    // stars are drawn as small circles for a softer look
    stars.forEach(s => {
      // twinkle effect: occasional brightness change
      const twinkle = Math.random() < 0.02 ? 0.5 : 1;
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // simple vertical scroll to give forward motion
      s.y += 0.5;
      if (s.y > height) s.y = 0;
    });
  }

  function drawFuel() {
    const barWidth = 100;
    const barHeight = 10;
    const x = 10;
    const y = 10;
    // background of fuel bar
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, barWidth, barHeight);
    // gradient fuel level
    const fuelGrad = ctx.createLinearGradient(x, 0, x + barWidth, 0);
    fuelGrad.addColorStop(0, '#0f0');
    fuelGrad.addColorStop(0.5, '#ff0');
    fuelGrad.addColorStop(1, '#f00');
    ctx.fillStyle = fuelGrad;
    ctx.fillRect(x, y, Math.max(0, (ship.fuel / 100) * barWidth), barHeight);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(x, y, barWidth, barHeight);
  }

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size * 2) + size;
    asteroids.push({ x, y: -size, r: size, speed: Math.random() * 2 + 1 });
  }

  function update(dt) {
    // Ship movement
    ship.x += ship.direction * ship.speed;
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    // Fuel consumption
    ship.fuel -= dt * 0.01; // drain over time
    // Asteroid update & spawn
    spawnTimer += dt;
    if (spawnTimer > 1000) { // every second
      spawnAsteroid();
      spawnTimer = 0;
    }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
  }

  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) return true;
    }
    if (ship.fuel <= 0) return true;
    return false;
  }

  // ----- Main loop -------------------------------------------------------
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    ctx.clearRect(0, 0, width, height);
    drawStars();
    update(dt);
    drawShip();
    asteroids.forEach(drawAsteroid);
    drawFuel();
    if (checkCollisions()) {
      // play collision sound
      if (typeof playCollision === 'function') playCollision();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  }

  requestAnimationFrame(loop);
})();
