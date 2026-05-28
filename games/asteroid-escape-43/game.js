// Game: Asteroid Escape (enhanced graphics)
// Canvas element with id="game" must exist in the HTML.
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }
  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  // Ship definition
  const ship = {
    angle: 0, // direction in radians
    x: width / 2,
    y: height - 40,
    size: 20,
    speed: 3,
    fuel: 100,
    vx: 0,
    vy: 0,
    color: '#0f0',
  };

  // Input handling
  const keys = {};
  let audioUnlocked = false;
  function unlockAudio() {
    if (!audioUnlocked) {
      audioCtx.resume();
      audioUnlocked = true;
    }
  }
  window.addEventListener('keydown', e => {
    keys[e.key] = true;
    unlockAudio();
    // Play thrust sound on movement keys
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      playTone(200, 0.05);
    }
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  // Asteroids and fuel cells
  const asteroids = [];
  const fuels = [];
  const maxAsteroids = 8;
  const maxFuels = 3;

  function spawnAsteroid() {
    const r = Math.random() * 20 + 10; // radius
    asteroids.push({
      x: Math.random() * (width - 2 * r) + r,
      y: -r,
      r,
      speed: Math.random() * 1.5 + 0.5,
      color: '#aaa',
    });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({
      x: Math.random() * (width - size),
      y: -size,
      size,
      speed: 1,
      collected: false,
      color: '#ff0',
    });
  }

  function update() {
    // Update starfield for parallax effect
    stars.forEach(s => {
      s.y += 0.5;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // Ship movement
    ship.vx = ship.vy = 0;
    if (keys.ArrowLeft) ship.vx = -ship.speed;
    if (keys.ArrowRight) ship.vx = ship.speed;
    if (keys.ArrowUp) ship.vy = -ship.speed;
    if (keys.ArrowDown) ship.vy = ship.speed;
    // Update ship angle when moving
    if (ship.vx !== 0 || ship.vy !== 0) {
      ship.angle = Math.atan2(ship.vy, ship.vx);
    }
    ship.x = Math.max(0, Math.min(width, ship.x + ship.vx));
    ship.y = Math.max(0, Math.min(height, ship.y + ship.vy));
    // Fuel consumption
    ship.fuel -= 0.05;
    if (ship.fuel <= 0) return endGame('Out of fuel');

    // Asteroids
    if (asteroids.length < maxAsteroids && Math.random() < 0.02) spawnAsteroid();
    asteroids.forEach(a => {
      a.y += a.speed;
    });
    // Remove off-screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].y - asteroids[i].r > height) asteroids.splice(i, 1);
    }
    // Fuel cells
    if (fuels.length < maxFuels && Math.random() < 0.01) spawnFuel();
    fuels.forEach(f => {
      f.y += f.speed;
    });
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (f.y - f.size > height) fuels.splice(i, 1);
    }
    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.size / 2) return endGame('Hit an asteroid');
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (!f.collected && f.x < ship.x + ship.size / 2 && f.x + f.size > ship.x - ship.size / 2 && f.y < ship.y + ship.size / 2 && f.y + f.size > ship.y - ship.size / 2) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        f.collected = true;
        fuels.splice(i, 1);
        // Play fuel collection sound
        playTone(500, 0.1);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship with rotation
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw fuel cells as glowing circles
    for (const f of fuels) {
      const grad = ctx.createRadialGradient(f.x + f.size/2, f.y + f.size/2, 0, f.x + f.size/2, f.y + f.size/2, f.size);
      grad.addColorStop(0, 'rgba(255,255,0,0.9)');
      grad.addColorStop(1, 'rgba(255,255,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x + f.size/2, f.y + f.size/2, f.size/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel bar
    ctx.fillStyle = '#555';
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = '#0f0';
    ctx.fillRect(10, 10, ship.fuel, 10);
  }

  let animationId;
  function loop() {
    update();
    draw();
    animationId = requestAnimationFrame(loop);
  }

  function endGame(reason) {
    // Play sound based on reason
    if (reason.includes('Hit')) {
      playTone(80, 0.5); // collision beep
    } else if (reason.includes('fuel')) {
      playTone(300, 0.3);
    } else {
      playTone(200, 0.4);
    }
    cancelAnimationFrame(animationId);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over: ' + reason, width / 2, height / 2);
  }

  // Start the game loop
  animationId = requestAnimationFrame(loop);
})();
