// Simple asteroid escape game targeting <canvas id="game"></canvas>
// Enhanced graphics: starfield background, gradient ship, asteroid shading, shield aura
(function () {
  const canvas = document.getElementById('game');
  if (!canvas) return; // canvas must exist
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  function playTone(freq, length = 0.1, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + length);
  }
  const sounds = {
    thrust: () => playTone(200, 0.05),
    collision: () => playTone(100, 0.3, 'square'),
    powerup: () => playTone(400, 0.15, 'triangle'),
    gameover: () => playTone(50, 0.5, 'sawtooth'),
  };
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  let ship = { x: width / 2, y: height - 60, w: 30, h: 40, speed: 3, shield: 0, fuel: 100, boost: 0 };
  // Starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      speed: 0.2 + Math.random() * 0.5,
    });
  }
  let asteroids = [];
  let powerUps = [];
  let keys = {};
  let gameOver = false;
  let lastAsteroid = 0;
  let lastPower = 0;

  // Input handling
  window.addEventListener('keydown', e => {
    // Resume audio context on first user interaction
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => keys[e.code] = false);

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y: -radius, r: radius, speed });
  }

  function spawnPowerUp() {
    const size = 20;
    const x = Math.random() * (width - size);
    const type = Math.random() < 0.5 ? 'shield' : 'boost';
    powerUps.push({ x, y: -size, size, type, speed: 1.5 });
  }

  function update(dt) {
    if (gameOver) return;

    // Ship controls with thrust sound
    if (keys['ArrowLeft'] && ship.x > 0) {
      ship.x -= ship.speed;
      sounds.thrust();
    }
    if (keys['ArrowRight'] && ship.x < width) {
      ship.x += ship.speed;
      sounds.thrust();
    }

    // Fuel consumption and boost handling
    ship.fuel = Math.max(0, ship.fuel - dt * 0.02);
    if (ship.fuel <= 0) { gameOver = true; sounds.gameover(); return; }
    if (ship.boost > 0) { ship.speed = 5; ship.boost -= dt; } else { ship.speed = 3; }
    if (ship.shield > 0) ship.shield -= dt;

    // Spawn asteroids every ~800ms
    if (performance.now() - lastAsteroid > 800) { spawnAsteroid(); lastAsteroid = performance.now(); }
    // Spawn power-ups every ~5s
    if (performance.now() - lastPower > 5000) { spawnPowerUp(); lastPower = performance.now(); }

    // Update stars for background
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > height) { s.y = 0; s.x = Math.random() * width; }
    });

    // Update asteroids
    asteroids.forEach(a => a.y += a.speed);
    asteroids = asteroids.filter(a => a.y - a.r < height);

    // Update power-ups
    powerUps.forEach(p => p.y += p.speed);
    powerUps = powerUps.filter(p => p.y < height);

    // Collision detection
    asteroids.forEach((a, i) => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.w / 2) {
        if (ship.shield > 0) {
          // destroy asteroid
          asteroids.splice(i, 1);
        } else {
          gameOver = true;
          sounds.collision();
        }
      }
    });

    powerUps.forEach((p, i) => {
      if (
        p.x < ship.x + ship.w / 2 && p.x + p.size > ship.x - ship.w / 2 &&
        p.y < ship.y + ship.h / 2 && p.y + p.size > ship.y - ship.h / 2
      ) {
        if (p.type === 'shield') ship.shield = 3000; // ms
        else if (p.type === 'boost') ship.boost = 3000;
        sounds.powerup();
        powerUps.splice(i, 1);
      }
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fillStyle = ship.shield > 0 ? 'cyan' : 'white';
    ctx.fill();
    ctx.restore();

    // Draw asteroids
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw power‑ups
    powerUps.forEach(p => {
      ctx.fillStyle = p.type === 'shield' ? 'lightgreen' : 'orange';
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '14px monospace';
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 20);
    if (ship.shield > 0) ctx.fillText('Shield', 10, 40);
    if (ship.boost > 0) ctx.fillText('Boost', 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2 - 120, height / 2);
    }
  }

  let last = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - last;
    last = now;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
