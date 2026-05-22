// Minimal Asteroid Escape game
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = 800;
  const height = canvas.height = 600;

  // Game state
  const ship = { x: width / 2, y: height / 2, r: 15, speed: 4 };
  const asteroids = [];
  const fuelCells = [];
  let fuel = 100; // percent
  let keys = {};
  let gameOver = false;

  // Helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration = 0.1) => {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  };

  // Input
  window.addEventListener('keydown', e => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Spawn objects
  const spawnAsteroid = () => {
    const side = Math.floor(rand(0, 4));
    const obj = { x: 0, y: 0, vx: 0, vy: 0, r: 20 };
    switch (side) {
      case 0: obj.x = 0; obj.y = rand(0, height); break; // left
      case 1: obj.x = width; obj.y = rand(0, height); break; // right
      case 2: obj.x = rand(0, width); obj.y = 0; break; // top
      case 3: obj.x = rand(0, width); obj.y = height; break; // bottom
    }
    const angle = rand(0, Math.PI * 2);
    const speed = rand(1, 3);
    obj.vx = Math.cos(angle) * speed;
    obj.vy = Math.sin(angle) * speed;
    asteroids.push(obj);
  };

  const spawnFuel = () => {
    fuelCells.push({ x: rand(30, width - 30), y: rand(30, height - 30), r: 8 });
  };

  // Game loop
  const update = () => {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowUp']) ship.y -= ship.speed;
    if (keys['ArrowDown']) ship.y += ship.speed;
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Keep within bounds
    ship.x = Math.max(ship.r, Math.min(width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(height - ship.r, ship.y));

    // Move asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // Remove off-screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -50 || a.x > width + 50 || a.y < -50 || a.y > height + 50) asteroids.splice(i, 1);
    }

    // Collision ship-asteroid
    if (asteroids.some(a => distance(a, ship) < a.r + ship.r)) {
      playTone(200); // collision sound
      gameOver = true;
      alert('Game Over: Hit an asteroid');
      return;
    }

    // Fuel consumption & collection
    fuel -= 0.02; // constant drain
    fuelCells.forEach((f, idx) => {
      if (distance(f, ship) < f.r + ship.r) {
        fuel = Math.min(100, fuel + 20);
        fuelCells.splice(idx, 1);
      }
    });
    if (fuel <= 0) {
      gameOver = true;
      alert('Game Over: Fuel depleted');
      return;
    }

    // Render
    // Starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // Draw stars (generated once)
    if (!window._stars) {
      window._stars = [];
      for (let i = 0; i < 100; i++) {
        window._stars.push({ x: Math.random() * width, y: Math.random() * height, size: Math.random() * 2 + 1 });
      }
    }
    ctx.fillStyle = 'white';
    window._stars.forEach(st => {
      ctx.fillRect(st.x, st.y, st.size, st.size);
    });
    // Ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.r, ship.y);
    ctx.lineTo(ship.x - ship.r, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // Asteroids as rotating rocks
    ctx.fillStyle = 'gray';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      const rot = Math.atan2(a.vy, a.vx) + Math.PI / 2;
      ctx.rotate(rot);
      ctx.beginPath();
      // simple 5‑point shape
      const points = 5;
      const step = (Math.PI * 2) / points;
      for (let i = 0; i < points; i++) {
        const radius = a.r * (0.7 + Math.random() * 0.6);
        const angle = i * step;
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    // Fuel cells with glow
    fuelCells.forEach(f => {
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      grad.addColorStop(0, 'rgba(255,255,0,0.8)');
      grad.addColorStop(1, 'rgba(255,255,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Fuel bar background
    ctx.fillStyle = 'white';
    ctx.fillRect(10, 10, 100, 10);
    // Fuel amount
    ctx.fillStyle = 'limegreen';
    ctx.fillRect(10, 10, fuel, 10);
  };

  // Spawn intervals
  setInterval(spawnAsteroid, 1500);
  setInterval(spawnFuel, 5000);
  // Main loop
  function loop() { update(); requestAnimationFrame(loop); }
  loop();
})();
