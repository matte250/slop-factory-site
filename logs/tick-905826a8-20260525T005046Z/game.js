// Game: Asteroid Dodge
// Canvas size: 800x600 (as per IDEA.md)
// Player: small ship (rectangle) controlled by Arrow keys/A/D and boost with Space.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration/1000);
    osc.start();
    osc.stop(audioCtx.currentTime + duration/1000);
  }
  function playBoost() { playTone(800, 100); }
  function playCollision() { playTone(200, 300); }
  function playGameOver() { playTone(100, 500); }

  // Player definition with boost flag
  const stars = [];
  // Generate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * 800, y: Math.random() * 600, radius: Math.random() * 1.5 + 0.5 });
  }

  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    speed: 4,
    boostSpeed: 8,
    dx: 0,
    color: '#0f0',
    boosting: false,
  };
  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 40,
    speed: 4,
    boostSpeed: 8,
    dx: 0,
    color: '#0f0',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') playBoost();
  });
  window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Asteroid pool
  const asteroids = [];
  let asteroidSpawnTimer = 0;
  const baseSpawnInterval = 90; // frames
  let spawnInterval = baseSpawnInterval;
  let asteroidSpeed = 2;

  let score = 0;
  let startTime = performance.now();
  let gameOver = false;
  let gameOverPlayed = false;

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20; // 20-50px
    const x = Math.random() * (canvas.width - size);
    asteroids.push({ x, y: -size, size, speed: asteroidSpeed });
  }

  function update() {
    if (gameOver) return;
    // Player movement
    player.dx = 0;
    if (keys.ArrowLeft || keys.a) player.dx = -player.speed;
    if (keys.ArrowRight || keys.d) player.dx = player.speed;
    if (keys[' ']) {
    player.dx = (keys.ArrowLeft || keys.a) ? -player.boostSpeed : (keys.ArrowRight || keys.d) ? player.boostSpeed : 0;
    player.boosting = true;
  } else {
    player.boosting = false;
  }
    player.x += player.dx;
    // Keep inside bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

    // Spawn asteroids
    asteroidSpawnTimer++;
    if (asteroidSpawnTimer >= spawnInterval) {
      spawnAsteroid();
      asteroidSpawnTimer = 0;
      // Gradually increase difficulty
      if (spawnInterval > 30) spawnInterval -= 0.5;
      asteroidSpeed += 0.01;
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // Remove off-screen
      if (a.y - a.size > canvas.height) asteroids.splice(i, 1);
      // Collision detection (simple AABB)
      if (
        a.x < player.x + player.width &&
        a.x + a.size > player.x &&
        a.y < player.y + player.height &&
        a.y + a.size > player.y
      ) {
        gameOver = true;
        playCollision();
        break;
      }
    }

    // Score based on survival time
    score = Math.floor((performance.now() - startTime) / 1000);
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (triangle ship, brighter on boost)
    ctx.fillStyle = player.boosting ? '#ff0' : player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw asteroids with radial gradient
    for (const a of asteroids) {
      const radGrad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.1,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      radGrad.addColorStop(0, '#555');
      radGrad.addColorStop(1, '#111');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${score}s`, 10, 20);

    if (gameOver) {
      // Play game over sound once
      if (!player.gameOverPlayed) {
        playGameOver();
        player.gameOverPlayed = true;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start the game
  requestAnimationFrame(loop);
})();
