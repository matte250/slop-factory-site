// Simple Space Escape game implementation
// Canvas with id="game" must exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Track previous key state to avoid spamming thrust sound
  const prevKeys = {};

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Game state
  const ship = { x: 80, y: height / 2, radius: 12, speed: 3 };
  let fuel = 100; // percent
  const fuelDrain = 0.02; // per frame
  let asteroids = [];
  let asteroidTimer = 0;
  let asteroidInterval = 120; // frames
  let speedFactor = 1;
  let gameOver = false;

  // Input handling
  const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };
  window.addEventListener('keydown', e => {
    if (e.key in keys) {
      keys[e.key] = true;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (e.key === 'ArrowUp' && !prevKeys.ArrowUp) {
        playTone(300, 0.08);
        prevKeys.ArrowUp = true;
      }
    }
  });
  window.addEventListener('keyup', e => {
    if (e.key in keys) {
      keys[e.key] = false;
      if (e.key === 'ArrowUp') prevKeys.ArrowUp = false;
    }
  });

  // Helpers
  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const y = Math.random() * (height - radius * 2) + radius;
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04; // rotate slowly
    asteroids.push({ x: width + radius, y, radius, speed: 2 * speedFactor, angle, rotSpeed });
  }

  function update() {
    if (gameOver) return;
    // Move ship based on input
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp ship inside canvas
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y));

    // Fuel consumption
    fuel -= fuelDrain;
    if (fuel <= 0) {
      fuel = 0;
      endGame('Out of fuel');
    }

    // Asteroid spawning and movement
    asteroidTimer++;
    if (asteroidTimer >= asteroidInterval) {
      spawnAsteroid();
      asteroidTimer = 0;
      // gradually increase difficulty
      if (asteroidInterval > 30) asteroidInterval -= 1;
      speedFactor += 0.01;
    }
    // Move and rotate asteroids
    asteroids.forEach(a => {
      a.x -= a.speed;
      if (typeof a.angle !== 'undefined') {
        a.angle += a.rotSpeed;
      }
    });
    // Remove off‑screen asteroids
    asteroids = asteroids.filter(a => a.x + a.radius > 0);

    // Collision detection
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        endGame('Collision');
        break;
      }
    }
  }

  function drawStarfield() {
    // Enhanced starfield with moving stars
    // Initialize starfield if not already
    if (!window._stars) {
      const starCount = 100;
      window._stars = [];
      for (let i = 0; i < starCount; i++) {
        window._stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.2,
          hue: Math.random() * 60 + 200, // bluish
        });
      }
    }
    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    // Update and draw stars
    ctx.fillStyle = '#fff';
    for (const s of window._stars) {
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${s.hue}, 80%, 80%)`;
      ctx.fill();
    }
  }

  function draw() {
    drawStarfield();
    // Ship (triangle with gradient and thrust)
    const shipGrad = ctx.createLinearGradient(ship.x - ship.radius, ship.y, ship.x + ship.radius, ship.y);
    shipGrad.addColorStop(0, '#0f0');
    shipGrad.addColorStop(1, '#0c0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x - ship.radius, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y);
    ctx.closePath();
    ctx.fill();
    // Simple thrust when moving forward (up arrow)
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x - ship.radius, ship.y);
      ctx.lineTo(ship.x - ship.radius - 8, ship.y - 4);
      ctx.lineTo(ship.x - ship.radius - 8, ship.y + 4);
      ctx.closePath();
      ctx.fill();
    }
    // Asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#b5651d'); // lighter core
      grad.addColorStop(1, '#5c3317'); // darker edge
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    // Fuel bar
    ctx.fillStyle = '#ff0';
    const barWidth = 100;
    ctx.fillRect(10, 10, (fuel / 100) * barWidth, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 10, barWidth, 10);
  }

  function loop() {
    if (!gameOver) {
      update();
      draw();
      requestAnimationFrame(loop);
    }
  }

  function endGame(reason) {
    // Play a tone based on failure reason
    if (reason === 'Collision') {
      playTone(150, 0.4);
    } else if (reason === 'Out of fuel') {
      playTone(80, 0.6);
    } else {
      playTone(200, 0.3);
    }
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over: ' + reason, width / 2, height / 2);
  }

  // Start the game loop
  requestAnimationFrame(loop);
})();
