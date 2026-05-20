// Enhanced graphics for "Cosmic Dodge" game.
// Canvas with id="game" is assumed to exist in the HTML.
(() => {
  // Audio setup using Web Audio API
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  // Ensure AudioContext is resumed on first user interaction
  const resumeAudio = () => { if (audioCtx.state === 'suspended') audioCtx.resume(); };

  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth;
  const height = canvas.height = canvas.clientHeight;

  // Create space background gradient (dark -> slightly lighter)
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#001');
  bgGradient.addColorStop(1, '#000');
  // Start ambient hum after context is ready
  startBackgroundHum();

  // Game state
  let lastTime = 0;
  let elapsed = 0;
  let running = true;
  let gameOverPlayed = false;
  // Ship definition (simple triangle)
  const ship = {
    x: 80,
    y: height / 2,
    vy: 0,
    radius: 12,
    thrust: -0.6,
    gravity: 0.02,
    draw() {
      // Ship as a gradient-filled triangle for depth
      const grad = ctx.createLinearGradient(this.x - 15, this.y - 12, this.x, this.y + 12);
      grad.addColorStop(0, '#0ff');
      grad.addColorStop(1, '#004');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - 15, this.y + 12);
      ctx.lineTo(this.x - 15, this.y - 12);
      ctx.closePath();
      ctx.fill();
    },
    update(dt) {
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      // Keep within bounds (top wrap disabled, bottom ends game)
      if (this.y > height) running = false;
    }
  };

  // Input: click / tap thrust upward
  const thrust = () => {
    // Ensure audio context is running
    if (audioCtx.state === 'suspended') audioCtx.resume();
    ship.vy = ship.thrust;
    ship.thrusting = true;
    // Play thrust sound
    playThrust();
    // Reset thrust visual after short delay
    setTimeout(() => ship.thrusting = false, 100);
  };
  canvas.addEventListener('mousedown', thrust);
  canvas.addEventListener('touchstart', e => { e.preventDefault(); thrust(); });

  // Stars background
  const stars = Array.from({ length: 120 }, () => {
    const baseR = Math.random() * 2 + 0.5;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: baseR,
      baseR,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.3 + 0.1
    };
  });
  const updateStars = dt => {
    for (const s of stars) {
      s.x -= s.speed * dt;
      if (s.x < 0) {
        s.x = width;
        s.y = Math.random() * height;
      }
    }
  };
  const drawStars = () => {
    for (const s of stars) {
      // Twinkling effect using sine wave based on elapsed time
      const twinkleRadius = s.baseR + Math.sin(elapsed / 200 + s.twinkle) * 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, Math.max(0.2, twinkleRadius), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Asteroids
  const asteroids = [];
  const asteroidSpawnInterval = 2000; // ms
  let nextAsteroid = asteroidSpawnInterval;
  const spawnAsteroid = () => {
    const radius = Math.random() * 20 + 10;
    asteroids.push({
      x: width + radius,
      y: Math.random() * (height - radius * 2) + radius,
      r: radius,
      speed: Math.random() * 0.1 + 0.05
    });
  };
  const updateAsteroids = dt => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed * dt;
      if (a.x + a.r < 0) asteroids.splice(i, 1);
    }
  };
  const drawAsteroids = () => {
    ctx.fillStyle = '#a52a2a';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Collision detection
  const checkCollision = () => {
    for (const a of asteroids) {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.radius) return true;
    }
    return false;
  };

  // Score display
  const drawScore = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(elapsed / 1000), 10, 20);
  };

  // Main loop
  const loop = timestamp => {
    if (!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) * 0.06; // speed factor
    lastTime = timestamp;
    if (!running) {
      // Play crash sound once
      if (!gameOverPlayed) {
        playCrash();
        stopBackgroundHum();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
      drawScore();
      return;
    }
    elapsed += dt;

    // Update
    ship.update(dt);
    updateStars(dt);
    updateAsteroids(dt);
    nextAsteroid -= dt;
    if (nextAsteroid <= 0) { spawnAsteroid(); nextAsteroid = asteroidSpawnInterval; }
    if (checkCollision()) running = false;

    // Render
    // Draw space background gradient
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    drawStars();
    ship.draw();
    drawAsteroids();
    drawScore();

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
})();
