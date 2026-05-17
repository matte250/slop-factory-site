// Asteroid Dodge game
// Canvas element with id="game" is expected in the HTML page.

(() => {
  // Audio setup using Web Audio API
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(frequency, duration = 0.1, volume = 0.2) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playSpawnSound() { playTone(300, 0.05); }
  function playCrashSound() { playTone(100, 0.3, 0.5); }
  // Ensure audio context resumes on user interaction
  function resumeAudio() { if (audioCtx.state === 'suspended') audioCtx.resume(); }
  window.addEventListener('keydown', resumeAudio);
  window.addEventListener('click', resumeAudio);

  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');

  // Set canvas size (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Create starfield background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function drawBackground() {
    // Dark space gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0a2a');
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Stars (twinkling movement)
    ctx.fillStyle = 'white';
    for (const s of stars) {
      // slight vertical drift
      s.y += 0.2;
      if (s.y > canvas.height) s.y = 0;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    moveLeft: false,
    moveRight: false,
  };

  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;
  let lastSpawn = 0;
  let score = 0;
  let startTime = null;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = true;
    if (e.key === 'ArrowRight') player.moveRight = true;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') player.moveLeft = false;
    if (e.key === 'ArrowRight') player.moveRight = false;
  });

  function spawnAsteroid() { playSpawnSound();
    const size = Math.random() * 30 + 20;
    const x = Math.random() * (canvas.width - size);
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed + Math.random() });
  }

  function update(delta) {
    if (gameOver) return;

    // Move player
    if (player.moveLeft) player.x = Math.max(0, player.x - player.speed);
    if (player.moveRight) player.x = Math.min(canvas.width - player.width, player.x + player.speed);

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off‑screen
      if (a.y - a.size > canvas.height) asteroids.splice(i, 1);
    }

    // Collision detection
    for (const a of asteroids) {
      const collX = player.x < a.x + a.size && player.x + player.width > a.x;
      const collY = player.y < a.y + a.size && player.y + player.height > a.y;
      if (collX && collY) {
        gameOver = true;
        playCrashSound();
        break;
      }
    }

    // Score based on time survived
    if (!startTime) startTime = performance.now();
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Background
    drawBackground();

    // Player ship (gradient triangle)
    const shipGrad = ctx.createLinearGradient(player.x, player.y, player.x + player.width, player.y + player.height);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Asteroids
    // Asteroids with radial gradient for depth
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#b0b0b0');
      grad.addColorStop(1, '#404040');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Score display
    ctx.fillStyle = 'white';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);

    // Game over
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      const delta = timestamp - (lastFrameTime || timestamp);
      update(delta);
    }
    draw();
    lastFrameTime = timestamp;
    requestAnimationFrame(loop);
  }

  let lastFrameTime = 0;
  requestAnimationFrame(loop);
})();
