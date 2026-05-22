// Endless runner game with enhanced graphics
// Canvas with id="game" must exist in the page.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  // ------ Audio setup ------
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is resumed on first user interaction
  function resumeAudio() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playBeep(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  // Simple crash sound (lower pitch)
  function playCrash() {
    playBeep(150, 0.3);
  }

  // ------ Background stars ------
  const starCount = 80;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.3 + 0.2,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
      s.x -= s.speed;
      if (s.x < 0) s.x = width;
    }
  }

  // ------ Player ship (triangle with gradient) ------
  const player = {
    x: 50,
    y: height / 2,
    size: 14,
    vy: 0,
    thrust: -3,
    gravity: 0.07,
    update() {
      this.vy += this.gravity;
      this.y += this.vy;
    },
    draw() {
      const gradient = ctx.createLinearGradient(this.x, this.y - this.size, this.x, this.y + this.size);
      gradient.addColorStop(0, '#0ff');
      gradient.addColorStop(1, '#006');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.size);
      ctx.lineTo(this.x - this.size, this.y + this.size);
      ctx.lineTo(this.x + this.size, this.y + this.size);
      ctx.closePath();
      ctx.fill();
    },
    reset() {
      this.y = height / 2;
      this.vy = 0;
    },
  };

  // ------ Asteroid pool with shading ------
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const asteroidSpeed = 2;
  const asteroidMinRadius = 8;
  const asteroidMaxRadius = 22;

  function spawnAsteroid() {
    const radius = Math.random() * (asteroidMaxRadius - asteroidMinRadius) + asteroidMinRadius;
    const y = Math.random() * (height - radius * 2) + radius;
    asteroids.push({
      x: width + radius,
      y,
      radius,
      speed: asteroidSpeed + Math.random(),
    });
  }

  function drawAsteroid(a) {
    const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
    grad.addColorStop(0, '#aaa');
    grad.addColorStop(1, '#333');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  let lastSpawn = 0;
  let lastTime = 0;
  let score = 0;
  let gameOver = false;

  function resetGame() {
    player.reset();
    asteroids.length = 0;
    score = 0;
    gameOver = false;
    lastSpawn = 0;
    lastTime = 0;
    requestAnimationFrame(loop);
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    // Draw background with stars
    drawStars();

    // Update player physics
    player.update();
    if (player.y - player.size < 0 || player.y + player.size > height) gameOver = true;

    // Spawn asteroids
    if (timestamp - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }

    // Update and draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      drawAsteroid(a);
      // collision detection
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + player.size) gameOver = true;
      // remove when off‑screen
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }

    // Draw player ship
    player.draw();

    // Score display
    if (!gameOver) score += delta * 0.01;
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillText('Click to restart', width / 2, height / 2 + 10);
      return;
    }

    requestAnimationFrame(loop);
  }

  // Input – click or tap gives upward thrust
  function handleInput() {
    resumeAudio();
    if (gameOver) {
      resetGame();
      return;
    }
    player.vy = player.thrust;
    // play thrust sound
    playBeep(600, 0.08);
  }

  canvas.addEventListener('mousedown', handleInput);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput();
  }, { passive: false });

  // Start the game loop
  requestAnimationFrame(loop);
})();
