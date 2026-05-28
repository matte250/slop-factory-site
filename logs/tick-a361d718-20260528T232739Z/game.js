// Asteroid Escape game implementation
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  const ship = {
    width: 40,
    height: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#00ff00',
  };

  // Asteroid configuration
  const asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;
  let spawnRate = asteroidSpawnInterval;
  let asteroidSpeed = 2;
  let speedIncreaseInterval = 5000; // ms
  let lastSpeedIncrease = 0;

  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  let score = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  function update(dt) {
    // Move stars for subtle parallax effect
    for (const s of stars) {
      s.y += 0.2; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }
    // Move ship
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D']) ship.x += ship.speed;
    // Clamp ship inside canvas
    ship.x = Math.max(0, Math.min(width - ship.width, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnRate) {
      const size = Math.random() * 30 + 20;
      asteroids.push({
        x: Math.random() * (width - size),
        y: -size,
        size,
        speed: asteroidSpeed + Math.random(),
      });
      // Play spawn sound
      playTone(600, 0.05, 'sine');
      lastSpawn = performance.now();
    }
      const size = Math.random() * 30 + 20;
      asteroids.push({
        x: Math.random() * (width - size),
        y: -size,
        size,
        speed: asteroidSpeed + Math.random(),
      });
      lastSpawn = performance.now();
    }

    // Increase speed over time
    if (performance.now() - lastSpeedIncrease > speedIncreaseInterval) {
      asteroidSpeed += 0.5;
      spawnRate = Math.max(300, spawnRate - 50);
      lastSpeedIncrease = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off-screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.width > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.height > a.y
      ) {
        // Play crash sound
        playTone(200, 0.3, 'sawtooth');
        gameOver = true;
        break;
      }
    }

    // Update score
    if (!gameOver && startTime !== null) {
      score = Math.floor((performance.now() - startTime) / 1000);
    }
  }

  function draw() {
    // Space background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#001030');
    bgGradient.addColorStop(1, '#000010');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw starfield
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#bbbbbb');
      grad.addColorStop(1, '#444444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame || timestamp);
    lastFrame = timestamp;
    if (!gameOver) {
      update(dt);
    }
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
