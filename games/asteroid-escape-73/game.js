// Game: Asteroid Escape
// Canvas with id="game" is assumed in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration, type = 'sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration / 1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration / 1000);
  };

  // Ship definition
  const ship = {
    x: width / 2,
    y: height / 2,
    size: 20,
    angle: 0,
    speed: 0,
    maxSpeed: 3,
    turnSpeed: 0.07,
    shield: false,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (!keys[e.key]) {
      // Play thrust sound on first press of Up arrow
      if (e.key === 'ArrowUp') playTone(300, 100, 'sawtooth');
    }
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => (keys[e.key] = false));

  // Game objects
  const asteroids = [];
  const powerUps = [];
  let spawnTimer = 0;
  let difficulty = 1;
  let shieldTimer = 0;
  let gameOver = false;

  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    // Spawn from random edge with random rotation
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = randRange(0.5, 1.5) * difficulty;
    if (edge === 0) { // top
      x = randRange(0, width);
      y = -20;
    } else if (edge === 1) { // right
      x = width + 20;
      y = randRange(0, height);
    } else if (edge === 2) { // bottom
      x = randRange(0, width);
      y = height + 20;
    } else { // left
      x = -20;
      y = randRange(0, height);
    }
    const angle = Math.atan2(height / 2 - y, width / 2 - x);
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    const size = randRange(15, 30);
    const rot = randRange(0, Math.PI * 2);
    const rotSpeed = randRange(-0.02, 0.02);
    asteroids.push({ x, y, vx, vy, size, rot, rotSpeed });
  }

  function spawnPowerUp() {
    const x = randRange(30, width - 30);
    const y = randRange(30, height - 30);
    const type = Math.random() < 0.5 ? 'shield' : 'speed';
    powerUps.push({ x, y, type, radius: 10, ttl: 600 });
  }

  function playCollision() {
    // Low crash sound
    playTone(150, 200, 'triangle');
  }

  function playPowerUp(type) {
    // Higher pitch for speed, medium for shield
    const freq = type === 'speed' ? 600 : 400;
    playTone(freq, 120, 'square');
  }

  function playGameOver() {
    // Descending tone sequence
    playTone(400, 150);
    setTimeout(() => playTone(200, 300), 180);
  }

  function update() {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) ship.speed = Math.min(ship.maxSpeed, ship.speed + 0.1);
    else ship.speed = Math.max(0, ship.speed - 0.05);
    if (keys['ArrowDown']) ship.speed = Math.max(0, ship.speed - 0.1);

    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Update asteroids (including rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotSpeed; // rotate asteroid
      // Remove if offscreen far enough
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size / 2) {
        if (ship.shield) {
          // destroy asteroid, lose shield
          ship.shield = false;
          asteroids.splice(i, 1);
        } else {
          gameOver = true;
          playGameOver();
        }
        playCollision();
      }
    }

    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.ttl--;
      if (p.ttl <= 0) { powerUps.splice(i, 1); continue; }
      const dx = p.x - ship.x;
      const dy = p.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < p.radius + ship.size / 2) {
        if (p.type === 'shield') ship.shield = true;
        else if (p.type === 'speed') ship.maxSpeed = 5;
        powerUps.splice(i, 1);
        shieldTimer = p.type === 'shield' ? 600 : 0; // shield lasts 10s
        playPowerUp(p.type);
      }
    }

    // Shield timer
    if (ship.shield) {
      shieldTimer--;
      if (shieldTimer <= 0) ship.shield = false;
    }

    // Spawning logic
    spawnTimer++;
    if (spawnTimer % Math.max(30, 120 - difficulty * 10) === 0) {
      spawnAsteroid();
      if (Math.random() < 0.02) spawnPowerUp();
    }

    // Difficulty increase
    if (spawnTimer % 600 === 0) difficulty += 0.2;
  }

  function update() {
    if (gameOver) return;
    // Ship controls
    if (keys['ArrowLeft']) ship.angle -= ship.turnSpeed;
    if (keys['ArrowRight']) ship.angle += ship.turnSpeed;
    if (keys['ArrowUp']) ship.speed = Math.min(ship.maxSpeed, ship.speed + 0.1);
    else ship.speed = Math.max(0, ship.speed - 0.05);
    if (keys['ArrowDown']) ship.speed = Math.max(0, ship.speed - 0.1);

    ship.x += Math.cos(ship.angle) * ship.speed;
    ship.y += Math.sin(ship.angle) * ship.speed;

    // Keep ship within bounds (wrap)
    if (ship.x < 0) ship.x = width;
    if (ship.x > width) ship.x = 0;
    if (ship.y < 0) ship.y = height;
    if (ship.y > height) ship.y = 0;

    // Update asteroids (including rotation)
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      a.rot += a.rotSpeed; // rotate asteroid
      // Remove if offscreen far enough
      if (a.x < -100 || a.x > width + 100 || a.y < -100 || a.y > height + 100) {
        asteroids.splice(i, 1);
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.size + ship.size / 2) {
        if (ship.shield) {
          // destroy asteroid, lose shield
          ship.shield = false;
          asteroids.splice(i, 1);
        } else {
          gameOver = true;
        }
      }
    }

    // Update power-ups
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const p = powerUps[i];
      p.ttl--;
      if (p.ttl <= 0) { powerUps.splice(i, 1); continue; }
      const dx = p.x - ship.x;
      const dy = p.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < p.radius + ship.size / 2) {
        if (p.type === 'shield') ship.shield = true;
        else if (p.type === 'speed') ship.maxSpeed = 5;
        powerUps.splice(i, 1);
        shieldTimer = p.type === 'shield' ? 600 : 0; // shield lasts 10s
      }
    }

    // Shield timer
    if (ship.shield) {
      shieldTimer--;
      if (shieldTimer <= 0) ship.shield = false;
    }

    // Spawning logic
    spawnTimer++;
    if (spawnTimer % Math.max(30, 120 - difficulty * 10) === 0) {
      spawnAsteroid();
      if (Math.random() < 0.02) spawnPowerUp();
    }

    // Difficulty increase
    if (spawnTimer % 600 === 0) difficulty += 0.2;
  }

  function draw() {
    // Background gradient (space)
    const bgGrad = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.1, width / 2, height / 2, Math.max(width, height));
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Starfield with varied brightness
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 80; i++) {
      const starSize = Math.random() * 2;
      ctx.globalAlpha = Math.random();
      ctx.fillRect(randRange(0, width), randRange(0, height), starSize, starSize);
    }
    ctx.globalAlpha = 1.0;

    // Draw ship (triangle with outline)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.fillStyle = ship.shield ? '#0ff' : '#0f0';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.size, 0);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, -ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Draw asteroids as rotating polygons
    ctx.fillStyle = '#555';
    const sides = 6; // hexagonal base shape
    asteroids.forEach((a) => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rot || 0);
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i / sides) * Math.PI * 2;
        const radius = a.size * (0.8 + Math.random() * 0.4);
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw power-ups with glow
    powerUps.forEach((p) => {
      ctx.save();
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.type === 'shield' ? '#0ff' : '#ff0';
      ctx.fillStyle = p.type === 'shield' ? '#0ff' : '#ff0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Game over text
    if (gameOver) {
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start loop after short delay to ensure canvas size set
  setTimeout(loop, 100);
})();
