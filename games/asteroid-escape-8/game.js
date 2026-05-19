// Minimal Asteroid Escape game
// Targets <canvas id="game"></canvas> defined elsewhere

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure context is resumed on first interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio);

  const playTone = (freq, duration, type='sine') => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  };

  const playBoost = () => playTone(300, 0.1);
  const playCollision = () => playTone(150, 0.3, 'square');
  const playGameOver = () => {
    // three short beeps
    for (let i = 0; i < 3; i++) {
      playTone(200 - i*50, 0.15, 'triangle');
    }
  };

  // Adjust canvas size to match displayed dimensions
  const stars = [];
  const generateStars = () => {
    stars.length = 0;
    const count = 100;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  };
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    generateStars();
  };
  resize();
  window.addEventListener('resize', resize);

  // Player ship definition
  const ship = {
    width: 40,
    height: 20,
    x: canvas.width / 2,
    y: canvas.height - 30,
    speed: 4,
    dy: 0,
    boostPower: -6,
    boostDuration: 15,
    boostTimer: 0,
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.code] = true; });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Asteroids collection
  const asteroids = [];
  const spawnInterval = 90; // frames between spawns
  let spawnCounter = 0;

  // Game state variables
  let score = 0;
  let gameOver = false;
  let gameOverPlayed = false; // ensure game over sound plays once

  // Utility helpers
  const rand = (min, max) => Math.random() * (max - min) + min;
  const rectCollision = (a, b) => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  };

  const updateShip = () => {
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    // Keep within canvas bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.width, ship.x));

    // Initiate upward boost
    if (keys['ArrowUp'] && ship.boostTimer === 0) {
      ship.dy = ship.boostPower;
      ship.boostTimer = ship.boostDuration;
      playBoost();
    }
    if (ship.boostTimer > 0) {
      ship.y += ship.dy;
      ship.boostTimer--;
      if (ship.boostTimer === 0) ship.dy = 0;
    } else {
      // Gravity pulls ship back down
      ship.y = Math.min(canvas.height - 30, ship.y + 2);
    }
  };

  const spawnAsteroid = () => {
    const radius = rand(10, 30);
    const x = rand(radius, canvas.width - radius);
    const speed = rand(1.5, 3.5);
    asteroids.push({ x, y: -radius, radius, speed });
  };

  const updateAsteroids = () => {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove when it passes bottom, increase score
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
        score++;
        continue;
      }
      // Collision detection with ship (approximate rects)
      const shipRect = { x: ship.x, y: ship.y, width: ship.width, height: ship.height };
      const asteroidRect = { x: a.x - a.radius, y: a.y - a.radius, width: a.radius * 2, height: a.radius * 2 };
        if (rectCollision(shipRect, asteroidRect)) {
          playCollision();
          gameOver = true;
        }
    }
  };

  const draw = () => {
ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw starfield background
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ship as triangle
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with simple shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);

    // Game over overlay
    if (gameOver) {
      if (!gameOverPlayed) {
        playGameOver();
        gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f88';
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  };

  const loop = () => {
    if (!gameOver) {
      updateShip();
      if (spawnCounter++ >= spawnInterval) {
        spawnAsteroid();
        spawnCounter = 0;
      }
      updateAsteroids();
    }
    draw();
    requestAnimationFrame(loop);
  };

  loop();
})();
