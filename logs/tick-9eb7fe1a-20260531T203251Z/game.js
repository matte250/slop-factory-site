// Simple Rocket Escape game
// Canvas id="game". Rocket can thrust (ArrowUp) and rotate (ArrowLeft/Right).
// Asteroids drift left to right, fuel cells appear occasionally.
// Survive as long as possible.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // ----- Game objects -----
  // Star field for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  const rocket = {
    x: width / 2,
    y: height - 50,
    angle: -Math.PI / 2, // pointing up
    vx: 0,
    vy: 0,
    size: 20,
    thrust: 0.1,
    rotateSpeed: 0.07,
    fuel: 100,
  };

  const asteroids = [];
  const fuels = [];
  let keys = {};
  // Audio context for sound effects
  let audioCtx = null;
  function playSound(freq, duration) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playThrustSound() { playSound(300, 0.05); }
  function playCollisionSound() { playSound(150, 0.4); }
  let score = 0;
  let gameOver = false;

  // ----- Input handling -----
  window.addEventListener('keydown', e => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  // ----- Helpers -----
  function spawnAsteroid() {
    const size = 15 + Math.random() * 30;
    const speed = 1 + Math.random() * 2;
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const y = Math.random() * (height / 2);
    const rotation = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02;
    asteroids.push({
      x: side === 'left' ? -size : width + size,
      y,
      vx: side === 'left' ? speed : -speed,
      vy: 0,
      size,
      rotation,
      rotSpeed,
    });
  }


  function spawnFuel() {
    const size = 10;
    const x = Math.random() * (width - size * 2) + size;
    const y = Math.random() * (height / 2) + size;
    fuels.push({ x, y, size, collected: false });
  }

  function updateRocket() {
    if (keys['ArrowLeft']) rocket.angle -= rocket.rotateSpeed;
    if (keys['ArrowRight']) rocket.angle += rocket.rotateSpeed;
if (keys['ArrowUp'] && rocket.fuel > 0) {
    rocket.vx += Math.cos(rocket.angle) * rocket.thrust;
    rocket.vy += Math.sin(rocket.angle) * rocket.thrust;
    rocket.fuel -= 0.2;
    playThrustSound();
  }
    // Apply simple drag & gravity-like pull downwards
    rocket.vx *= 0.99;
    rocket.vy *= 0.99;
    rocket.vy += 0.02; // slight gravity
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    // Keep within bounds
    if (rocket.x < 0) rocket.x = width;
    if (rocket.x > width) rocket.x = 0;
    if (rocket.y < 0) rocket.y = 0;
    if (rocket.y > height) { gameOver = true; }
  }

  function updateObjects() {
    // Move stars slowly to create parallax (twinkle)
    stars.forEach(s => {
      s.y += 0.2; // slow downward drift
      if (s.y > height) s.y = 0;
      // tiny random size change for twinkle
      s.radius += (Math.random() - 0.5) * 0.1;
      if (s.radius < 0.5) s.radius = 0.5;
      if (s.radius > 2) s.radius = 2;
    });
    // Asteroids move and rotate
    asteroids.forEach(a => {
      a.x += a.vx;
      a.y += a.vy;
      a.rotation += a.rotSpeed;
    });
    // Remove off‑screen
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroids[i].x < -50 || asteroids[i].x > width + 50) asteroids.splice(i, 1);
    }
    // Fuels remain static
  }
  }

  function checkCollisions() {
    // Rocket vs asteroids
    for (let a of asteroids) {
      const dx = rocket.x - a.x;
      const dy = rocket.y - a.y;
      const dist = Math.hypot(dx, dy);
if (dist < rocket.size + a.size) {
          playCollisionSound();
          gameOver = true;
          return;
        }
    }
    // Rocket vs fuels
    for (let f of fuels) {
      if (f.collected) continue;
      const dx = rocket.x - f.x;
      const dy = rocket.y - f.y;
      if (Math.hypot(dx, dy) < rocket.size + f.size) {
        f.collected = true;
        rocket.fuel = Math.min(rocket.fuel + 30, 100);
        score += 10;
      }
    }
  }

  function draw() {
    // Clear and draw star field background
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#555';
    for (let s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Rocket with optional thrust flame
    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle);
    // Flame when thrusting
    if (keys['ArrowUp'] && rocket.fuel > 0) {
      ctx.beginPath();
      ctx.moveTo(-rocket.size / 2, 0);
      ctx.lineTo(-rocket.size, rocket.size / 2);
      ctx.lineTo(-rocket.size / 2, rocket.size);
      ctx.closePath();
      ctx.fillStyle = 'orange';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(rocket.size, 0);
    ctx.lineTo(-rocket.size / 2, rocket.size / 2);
    ctx.lineTo(-rocket.size / 2, -rocket.size / 2);
    ctx.closePath();
    ctx.fillStyle = '#ff0';
    ctx.fill();
    ctx.restore();
    // Asteroids with rotation
    for (let a of asteroids) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.rotation);
      ctx.fillStyle = '#777';
      ctx.beginPath();
      ctx.arc(0, 0, a.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Fuel cells
    ctx.fillStyle = '#0f0';
    for (let f of fuels) {
      if (f.collected) continue;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // HUD
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(rocket.fuel)}`, 10, 40);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  // ----- Main loop -----
  let lastSpawn = 0;
  let lastFuelSpawn = 0;
  function loop(timestamp) {
    if (gameOver) {
      draw();
      return;
    }
    const delta = timestamp - (lastSpawn || timestamp);
    // Spawn asteroids every 1–2 seconds
    if (timestamp - lastSpawn > 1000 + Math.random() * 1000) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }
    // Spawn fuel cells occasionally
    if (timestamp - lastFuelSpawn > 8000) {
      spawnFuel();
      lastFuelSpawn = timestamp;
    }
    updateRocket();
    updateObjects();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
