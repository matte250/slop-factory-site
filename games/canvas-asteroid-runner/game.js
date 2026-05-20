// Minimal Canvas Asteroid Runner game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width;
  const height = canvas.height;
  // Generate simple starfield background
  const stars = Array.from({ length: 120 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.5,
    speed: Math.random() * 0.5 + 0.2,
  }));

  // Particle trail for the ship
  let particles = [];

  function drawStars() {
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.fill();
    });
  }

  // Game state
  const ship = { x: 80, y: height / 2, size: 20, speed: 3 };
  let asteroids = [];
  let fuels = [];
  let keys = {};
  let fuel = 100; // percentage
  let distance = 0;
  let collected = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const radius = 15 + Math.random() * 15;
    asteroids.push({ x: width + radius, y: Math.random() * height, r: radius, speed: 2 + Math.random() * 2 });
  }

  function spawnFuel() {
    const size = 12;
    fuels.push({ x: width + size, y: Math.random() * height, size, speed: 2 });
  }

  function update() {
    if (gameOver) return;
    // Move ship
    const moved = (keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight);
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp to canvas
    ship.x = Math.max(0, Math.min(width, ship.x));
    ship.y = Math.max(0, Math.min(height, ship.y));

    // Emit particles when moving
    if (moved) {
      particles.push({
        x: ship.x,
        y: ship.y,
        size: 4,
        alpha: 1,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
      // Play thrust sound (short beep)
      playTone(300, 0.05);
    }
    // Update particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.02;
      p.size *= 0.96;
    });
    // Remove faded particles
    particles = particles.filter(p => p.alpha > 0 && p.size > 0.5);

    // Decrease fuel
    fuel -= 0.02;
    if (fuel <= 0) endGame();

    // Update stars for parallax effect
    stars.forEach(star => {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = width;
        star.y = Math.random() * height;
        star.alpha = Math.random() * 0.5 + 0.5;
      }
    });

    // Update asteroids
    asteroids.forEach(a => a.x -= a.speed);
    asteroids = asteroids.filter(a => a.x + a.r > 0);

    // Update fuels
    fuels.forEach(f => f.x -= f.speed);
    fuels = fuels.filter(f => f.x + f.size > 0);

    // Spawn new obstacles
    if (Math.random() < 0.02) spawnAsteroid();
    if (Math.random() < 0.005) spawnFuel();

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      if (Math.hypot(dx, dy) < a.r + ship.size / 2) {
        playTone(100, 0.2); // crash sound
        return endGame();
      }
    }
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      if (Math.abs(f.x - ship.x) < (f.size + ship.size) / 2 && Math.abs(f.y - ship.y) < (f.size + ship.size) / 2) {
        fuel = Math.min(100, fuel + 20);
        collected++;
        fuels.splice(i, 1);
        playTone(600, 0.07); // collect sound
      }
    }

    distance += 0.5; // arbitrary distance unit per frame
  }

  function drawShip() {
    // Ship as a gradient triangle with a thin stroke
    const grad = ctx.createLinearGradient(-ship.size / 2, -ship.size / 2, ship.size / 2, ship.size / 2);
    grad.addColorStop(0, '#00f');
    grad.addColorStop(1, '#0ff');
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.size / 2);
    ctx.lineTo(ship.size / 2, ship.size / 2);
    ctx.lineTo(-ship.size / 2, ship.size / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawAsteroids() {
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#777';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawFuels() {
    fuels.forEach(f => {
      const grad = ctx.createLinearGradient(f.x - f.size / 2, f.y - f.size / 2, f.x + f.size / 2, f.y + f.size / 2);
      grad.addColorStop(0, '#ff0');
      grad.addColorStop(1, '#ffa500');
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
    });
  }

  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Fuel: ${fuel.toFixed(0)}%`, 10, 20);
    ctx.fillText(`Score: ${Math.floor(distance)}`, 10, 40);
    ctx.fillText(`Collected: ${collected}`, 10, 60);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function endGame() {
    gameOver = true;
  }

  function loop() {
    // Draw dark space background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    drawStars();
    update();
    drawShip();
    drawAsteroids();
    drawFuels();
    drawHUD();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
