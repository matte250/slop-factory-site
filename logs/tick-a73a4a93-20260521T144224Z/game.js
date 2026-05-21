// Enhanced Asteroid Dodge game with richer graphics and sound effects
(() => {
  // Audio setup
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure audio context is running after user interaction
  canvas.addEventListener('click', () => { audioCtx.resume(); }, {once: true});
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;

  // ----- Starfield background -----
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.5 + 0.5
    });
  }
  function drawStars() {
    ctx.save();
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // ----- Ship -----
  const ship = {
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 40,
    fuel: 100
  };
  // Input handling
  let mouseX = ship.x;
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
  });
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // ----- Asteroids & fuel pickups -----
  const asteroids = [];
  const fuels = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 2 + Math.random() * 2,
      angle: 0,
      spin: (Math.random() - 0.5) * 0.04 // radians per frame
    });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 2
    });
  }

  function update(dt) {
    // Ship movement (keyboard & smooth mouse follow)
    if (keys.ArrowLeft) ship.x -= 200 * dt;
    if (keys.ArrowRight) ship.x += 200 * dt;
    ship.x += (mouseX - ship.x) * 0.1;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // Fuel consumption
    ship.fuel -= dt * 5;
    if (ship.fuel <= 0) gameOver = true;

    // Spawn logic
    if (frame % 60 === 0) spawnAsteroid();
    if (frame % 300 === 0) spawnFuel();

    // Update positions
    asteroids.forEach(a => {
      a.y += a.speed;
      a.angle += a.spin;
    });
    fuels.forEach(f => (f.y += f.speed));

    // Remove off‑screen objects
    while (asteroids.length && asteroids[0].y > height) asteroids.shift();
    while (fuels.length && fuels[0].y > height) fuels.shift();

    // Collision detection
    for (const a of asteroids) {
      if (
        a.x < ship.x + ship.w &&
        a.x + a.size > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.size > ship.y
      ) {
        gameOver = true;
        // Play collision sound
        playTone(150, 0.3);
        break;
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (
        f.x < ship.x + ship.w &&
        f.x + f.size > ship.x &&
        f.y < ship.y + ship.h &&
        f.y + f.size > ship.y
      ) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        // Play fuel pickup sound
        playTone(600, 0.15);
        fuels.splice(i, 1);
      }
    }

    score += dt * 10;
    frame++;
  }

  function drawShip() {
    ctx.save();
    // Gradient for ship hull
    const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#060');
    ctx.fillStyle = grad;
    // Draw as a simple triangle
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawAsteroids() {
    ctx.save();
    ctx.fillStyle = '#888';
    asteroids.forEach(a => {
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.angle);
      ctx.beginPath();
      // Rough polygon to simulate rock
      const steps = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < steps; i++) {
        const theta = (i / steps) * Math.PI * 2;
        const radius = a.size / 2 * (0.7 + Math.random() * 0.3);
        const px = Math.cos(theta) * radius;
        const py = Math.sin(theta) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    });
    ctx.restore();
  }

  function drawFuel() {
    ctx.save();
    fuels.forEach(f => {
      const grad = ctx.createRadialGradient(
        f.x + f.size / 2,
        f.y + f.size / 2,
        0,
        f.x + f.size / 2,
        f.y + f.size / 2,
        f.size / 2
      );
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#c90');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.size / 2, f.y + f.size / 2, f.size / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    drawShip();
    drawAsteroids();
    drawFuel();
    // UI overlay
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Fuel: ' + Math.ceil(ship.fuel), 10, 20);
    ctx.fillText('Score: ' + Math.floor(score), 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 1000;
    last = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

