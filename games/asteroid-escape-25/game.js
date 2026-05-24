// Simple Asteroid Escape game targeting <canvas id="game"></canvas>

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playTone = (freq, duration) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  };
  const playThrust = () => playTone(300, 0.1);
  const playExplosion = () => playTone(80, 0.5);

  // Adjust canvas to its displayed size
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Ship definition
  const STAR_COUNT = 120;
  const stars = [];
  const initStars = () => {
    stars.length = 0;
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 0.5 + Math.random() * 1.5,
      });
    }
  };
  initStars();
  const ship = {
    x: 60,
    y: canvas.height / 2,
    radius: 12,
    vy: 0,
    color: '#0f0',
  };

  const GRAVITY = 0.3;
  const THRUST = -6;

  // Asteroid pool
  const asteroids = [];
  const SPAWN_INTERVAL = 1500; // ms
  const ASTEROID_SPEED = 2;
  const ASTEROID_MIN_R = 10;
  const ASTEROID_MAX_R = 30;

  let lastSpawn = 0;
  let lastTime = 0;
  let gameOver = false;

  const spawnAsteroid = () => {
    const radius = ASTEROID_MIN_R + Math.random() * (ASTEROID_MAX_R - ASTEROID_MIN_R);
    const y = radius + Math.random() * (canvas.height - 2 * radius);
    asteroids.push({ x: canvas.width + radius, y, radius, color: '#aaa' });
  };

  const reset = () => {
    ship.y = canvas.height / 2;
    ship.vy = 0;
    asteroids.length = 0;
    lastSpawn = 0;
    lastTime = 0;
    gameOver = false;
    requestAnimationFrame(loop);
  };

  const handleInput = (e) => {
    // Resume audio context on first user interaction
    audioCtx.resume();
    e.preventDefault();
    if (gameOver) {
      reset();
      return;
    }
    ship.vy = THRUST;
    playThrust();
  };

  canvas.addEventListener('mousedown', handleInput);
  canvas.addEventListener('touchstart', handleInput);

  const loop = (timestamp) => {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw starfield
    for (const s of stars) {
      ctx.fillStyle = 'white';
      ctx.fillRect(s.x, s.y, 2, 2);
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
      }
    }

    // Update ship
    ship.vy += GRAVITY;
    ship.y += ship.vy;
    // Draw ship with glow
    const shipGrad = ctx.createRadialGradient(ship.x, ship.y, ship.radius * 0.2, ship.x, ship.y, ship.radius);
    shipGrad.addColorStop(0, '#7fff7f');
    shipGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.radius, 0, Math.PI * 2);
    ctx.fill();

    // Spawn asteroids
    if (timestamp - lastSpawn > SPAWN_INTERVAL) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    // Update asteroids
    ctx.fillStyle = '#888';
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= ASTEROID_SPEED;
      // Draw asteroid with gradient
      const astroGrad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      astroGrad.addColorStop(0, '#bbb');
      astroGrad.addColorStop(1, '#777');
      ctx.fillStyle = astroGrad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();

      // Collision detection (circle)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.radius) {
        if (!gameOver) playExplosion();
        gameOver = true;
      }

      // Remove off‑screen
      if (a.x + a.radius < 0) {
        asteroids.splice(i, 1);
      }
    }

    // Check bounds
    if (ship.y - ship.radius > canvas.height || ship.y + ship.radius < 0) {
      gameOver = true;
    }

    // Game Over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over – Click to Restart', canvas.width / 2, canvas.height / 2);
    } else {
      requestAnimationFrame(loop);
    }
  };

  // Start the game
  requestAnimationFrame(loop);
})();
