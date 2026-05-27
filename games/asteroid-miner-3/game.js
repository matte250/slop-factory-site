// Simple Asteroid Miner game
// Canvas with id "game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.offsetWidth || 800;
  const HEIGHT = canvas.height = canvas.offsetHeight || 600;

  // Player ship
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    size: 20,
    speed: 3,
    dx: 0,
    dy: 0,
    color: 'cyan'
  };

  // Game objects
  const minerals = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key] = true);
  window.addEventListener('keyup', e => keys[e.key] = false);

  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, duration = 0.1) {
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

  function spawnMineral() {
    minerals.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: 8,
      color: 'gold'
    });
  }

  function spawnAsteroid() {
    const side = Math.floor(Math.random() * 4);
    const speed = 1 + Math.random() * 2;
    let x, y, dx, dy;
    switch (side) {
      case 0: // top
        x = Math.random() * WIDTH; y = -20; dx = (Math.random() - 0.5) * speed; dy = speed; break;
      case 1: // right
        x = WIDTH + 20; y = Math.random() * HEIGHT; dx = -speed; dy = (Math.random() - 0.5) * speed; break;
      case 2: // bottom
        x = Math.random() * WIDTH; y = HEIGHT + 20; dx = (Math.random() - 0.5) * speed; dy = -speed; break;
      case 3: // left
        x = -20; y = Math.random() * HEIGHT; dx = speed; dy = (Math.random() - 0.5) * speed; break;
    }
    asteroids.push({ x, y, dx, dy, r: 15 + Math.random() * 10, color: 'gray' });
  }

  // Initial spawns
  for (let i = 0; i < 5; i++) spawnMineral();
  for (let i = 0; i < 3; i++) spawnAsteroid();

  function update() {
    if (gameOver) return;
    // Move ship based on input
    ship.dx = ship.dy = 0;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    ship.x = Math.max(0, Math.min(WIDTH, ship.x + ship.dx));
    ship.y = Math.max(0, Math.min(HEIGHT, ship.y + ship.dy));

    // Move asteroids
    asteroids.forEach(a => {
      a.x += a.dx;
      a.y += a.dy;
    });
    // Remove off‑screen asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (a.x < -30 || a.x > WIDTH + 30 || a.y < -30 || a.y > HEIGHT + 30) asteroids.splice(i, 1);
    }

    // Check collisions ship‑asteroid
    for (const a of asteroids) {
      const dist = Math.hypot(ship.x - a.x, ship.y - a.y);
      if (dist < ship.size / 2 + a.r) {
        gameOver = true;
        // Play collision sound
        playSound(200, 0.3);
        break;
      }
    }

    // Collect minerals
    for (let i = minerals.length - 1; i >= 0; i--) {
      const m = minerals[i];
      const dist = Math.hypot(ship.x - m.x, ship.y - m.y);
      if (dist < ship.size / 2 + m.r) {
        score++;
        // Play collection sound
        playSound(800, 0.05);
        minerals.splice(i, 1);
        spawnMineral();
      }
    }

    // Occasionally add new asteroids
    if (Math.random() < 0.01) spawnAsteroid();
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001020');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw ship as triangle with stroke
    ctx.fillStyle = ship.color;
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.size / 2);
    ctx.lineTo(ship.x - ship.size / 2, ship.y + ship.size / 2);
    ctx.lineTo(ship.x + ship.size / 2, ship.y + ship.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw minerals with radial glow
    for (const m of minerals) {
      const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      grad.addColorStop(0, 'rgba(255,215,0,0.9)');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
