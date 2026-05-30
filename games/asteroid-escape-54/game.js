// Simple Asteroid Escape game
// Assumes an HTML canvas with id="game" exists.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Ship definition (triangle)
  const ship = {
    size: 20,
    x: width / 2,
    y: height - 40,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  // Asteroid pool
  const asteroids = [];
  const asteroidSize = 20;
  const asteroidSpawnInterval = 900; // faster spawning
  let lastAsteroidTime = 0;

  // Starfield for background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({ x: Math.random() * width, y: Math.random() * height, speed: 0.5 + Math.random() * 1.0, size: Math.random() * 2 + 1 });
  }

  // Game state
  let score = 0;
  let lives = 3;
  let gameOver = false;
  let startTime = null;

  // Input handling
  document.addEventListener('keydown', e => {
    // Start background music on first interaction
    if (!bgOscillator) startMusic();
    if (e.key === 'ArrowLeft') ship.moveLeft = true;
    if (e.key === 'ArrowRight') ship.moveRight = true;
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') ship.moveLeft = false;
    if (e.key === 'ArrowRight') ship.moveRight = false;
  });

  // Sound setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq = 440, duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  // Background music (simple looped oscillator tone)
  let bgOscillator = null;
  function startMusic() {
    if (bgOscillator) return;
    bgOscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    bgOscillator.type = 'triangle';
    bgOscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    bgOscillator.connect(gain).connect(audioCtx.destination);
    bgOscillator.start();
  }
  function stopMusic() {
    if (bgOscillator) {
      bgOscillator.stop();
      bgOscillator = null;
    }
  }


  function spawnAsteroid() {
    const x = Math.random() * (width - asteroidSize);
    const speed = 2 + Math.random() * 3;
    asteroids.push({ x, y: -asteroidSize, size: asteroidSize, speed });
  }

  function update(dt) {
    // Move ship (bounded by canvas)
    if (ship.moveLeft) ship.x = Math.max(0, ship.x - ship.speed);
    if (ship.moveRight) ship.x = Math.min(width - ship.size, ship.x + ship.speed);

    // Spawn asteroids with sound cue
    if (performance.now() - lastAsteroidTime > asteroidSpawnInterval) {
      spawnAsteroid();
      playBeep(600, 0.05); // short high beep for spawn
      lastAsteroidTime = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y > height) asteroids.splice(i, 1);
    }

    // Update starfield
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    }

    // Collision detection (use ship size as square bounds)
    for (const a of asteroids) {
      if (
        ship.x < a.x + a.size &&
        ship.x + ship.size > a.x &&
        ship.y < a.y + a.size &&
        ship.y + ship.size > a.y
      ) {
        lives--;
        // Remove collided asteroid
        asteroids.splice(asteroids.indexOf(a), 1);
        if (lives <= 0) {
          gameOver = true;
        }
        break;
      }
    }

    // Score is time survived
    if (!gameOver && startTime !== null) {
      score = Math.floor((performance.now() - startTime) / 1000);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw starfield background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#444';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw ship as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.size);
    ctx.lineTo(ship.x + ship.size / 2, ship.y);
    ctx.lineTo(ship.x + ship.size, ship.y + ship.size);
    ctx.closePath();
    ctx.fill();

    // Draw asteroids
    ctx.fillStyle = 'gray';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
