// Simple Asteroid Courier game based on IDEA.md
// Canvas id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = 800);
  const height = (canvas.height = 400);

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playSound(type) {
    switch (type) {
      case 'thrust':
        playTone(400, 0.05);
        break;
      case 'cargo':
        playTone(800, 0.2);
        break;
      case 'collision':
        playTone(200, 0.5);
        break;
    }
  }

  // Game state
  const ship = { x: 60, y: height / 2, w: 30, h: 20, fuel: 100 };
  let score = 0;
  let gameOver = false;

  const asteroids = [];
  const cargos = [];

  // Input handling (up/down thrust)
  const keys = {};
  window.addEventListener('keydown', e => {
    // Resume audio context on first interaction (required by some browsers)
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.code] = true;
  });
  window.addEventListener('keyup', e => (keys[e.code] = false));

  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
    });
  }

  function spawnCargo() {
    const size = 15;
    cargos.push({
      x: width + size,
      y: Math.random() * (height - size),
      w: size,
      h: size,
      speed: 3,
    });
  }

  let asteroidTimer = 0;
  let cargoTimer = 0;

  function update(delta) {
    if (gameOver) return;

    // Ship control
    if (keys['ArrowUp']) {
      ship.y -= 200 * delta;
      ship.fuel -= 30 * delta;
      playSound('thrust');
    }
    if (keys['ArrowDown']) {
      ship.y += 200 * delta;
      ship.fuel -= 30 * delta;
      playSound('thrust');
    }
    // Keep ship in bounds
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // Fuel depletion over time
    ship.fuel -= 5 * delta;
    if (ship.fuel <= 0) ship.fuel = 0;

    // Spawn asteroids/cargo
    asteroidTimer += delta;
    cargoTimer += delta;
    if (asteroidTimer > 1.5) { spawnAsteroid(); asteroidTimer = 0; }
    if (cargoTimer > 3) { spawnCargo(); cargoTimer = 0; }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) asteroids.splice(i, 1);
      // Collision with ship
      if (rectIntersect(ship, a)) { gameOver = true; }
    }

    // Move cargos
    for (let i = cargos.length - 1; i >= 0; i--) {
      const c = cargos[i];
      c.x -= c.speed;
      if (c.x + c.w < 0) cargos.splice(i, 1);
      // Collect cargo
      if (rectIntersect(ship, c)) {
        score++;
        cargos.splice(i, 1);
      }
    }

    if (ship.fuel <= 0) gameOver = true;
  }

  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw ship as triangle
    ctx.fillStyle = 'lime';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids as circles
    ctx.fillStyle = 'dimgray';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw cargos as stars
    ctx.fillStyle = 'gold';
    cargos.forEach(c => {
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const r = c.w / 2;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        ctx.lineTo(x, y);
        const angle2 = angle + Math.PI / 5;
        const x2 = cx + (r / 2) * Math.cos(angle2);
        const y2 = cy + (r / 2) * Math.sin(angle2);
        ctx.lineTo(x2, y2);
      }
      ctx.closePath();
      ctx.fill();
    });

    // UI: score and fuel
    ctx.fillStyle = 'black';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.floor(ship.fuel)}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let last = performance.now();
  function loop(now) {
    const delta = (now - last) / 1000; // seconds
    last = now;
    update(delta);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
