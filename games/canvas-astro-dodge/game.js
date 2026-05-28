// Simple top‑down dodge game targeting <canvas id="game">
// Player: small ship controlled by arrow keys (smooth acceleration)
// Asteroids: falling circles that spawn at the top and increase speed over time
// Score: survival time in seconds
// Game over on collision or leaving canvas bounds

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size if not already defined
  canvas.width = canvas.clientWidth || 400;
  canvas.height = canvas.clientHeight || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playBeep(freq, duration = 0.1, type = 'sine') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Pre‑generate starfield background
  const STAR_COUNT = 100;
  const STAR_SPEED = 0.05; // pixels per ms
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  function updateStars(dt) {
    for (const s of stars) {
      s.y += STAR_SPEED * dt;
      if (s.y > canvas.height) s.y -= canvas.height;
    }
  }

  function drawStars() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const PLAYER_SIZE = 20; // width/height of the ship
  const PLAYER_ACC = 0.4; // acceleration per frame when key pressed
  const PLAYER_FRICTION = 0.9; // slows down when no key pressed

  const ASTEROID_MIN_RADIUS = 10;
  const ASTEROID_MAX_RADIUS = 30;
  const ASTEROID_SPAWN_INTERVAL = 1000; // ms
  const SPEED_INCREMENT = 0.02; // per second

  let lastTime = performance.now();
  let spawnTimer = 0;
  let speedFactor = 1;
  let score = 0;
  let gameOver = false;

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    vx: 0,
    vy: 0,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    draw() {
      // Gradient ship
      const grad = ctx.createLinearGradient(this.x - this.width / 2, this.y + this.height / 2, this.x, this.y - this.height / 2);
      grad.addColorStop(0, '#0f0');
      grad.addColorStop(1, '#0a0');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.height / 2);
      ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
      ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
      ctx.closePath();
      ctx.fill();
      // Optional outline
      ctx.strokeStyle = '#003300';
      ctx.lineWidth = 1;
      ctx.stroke();
    },
    update() {
      // Apply velocity
      this.x += this.vx;
      this.y += this.vy;
      // Apply friction
      this.vx *= PLAYER_FRICTION;
      this.vy *= PLAYER_FRICTION;
      // Keep within bounds (detect out‑of‑bounds as game over)
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
        endGame();
      }
    },
  };

  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      // Ensure audio context is running (required after user gesture)
      if (audioCtx.state === 'suspended') audioCtx.resume();
      keys[e.key] = true;
      // Play a short thrust sound
      playBeep(300, 0.05);
      e.preventDefault();
    }
  });
  window.addEventListener('keyup', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      keys[e.key] = false;
      e.preventDefault();
    }
  });

  const asteroids = [];

  function spawnAsteroid() {
    const radius = ASTEROID_MIN_RADIUS + Math.random() * (ASTEROID_MAX_RADIUS - ASTEROID_MIN_RADIUS);
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = -radius;
    const speed = 1 + Math.random() * 2; // base speed
    asteroids.push({ x, y, radius, speed });
  }

  function updateAsteroids(dt) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * speedFactor * dt / 16; // normalize to 60fps base
      // Remove if off screen
      if (a.y - a.radius > canvas.height) {
        asteroids.splice(i, 1);
      }
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.4, '#888');
      grad.addColorStop(1, '#444');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function handleInput() {
    if (keys['ArrowLeft']) player.vx -= PLAYER_ACC;
    if (keys['ArrowRight']) player.vx += PLAYER_ACC;
    if (keys['ArrowUp']) player.vy -= PLAYER_ACC;
    if (keys['ArrowDown']) player.vy += PLAYER_ACC;
  }

  function checkCollisions() {
    for (const a of asteroids) {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + PLAYER_SIZE / 2) {
        // Collision sound
        playBeep(200, 0.2, 'triangle');
        endGame();
        break;
      }
    }
  }

  function endGame() {
    gameOver = true;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.fillText(`Score: ${Math.floor(score)}`, canvas.width / 2, canvas.height / 2 + 20);
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (gameOver) return;
    // Update timers
    spawnTimer += dt;
    if (spawnTimer > ASTEROID_SPAWN_INTERVAL) {
      spawnAsteroid();
      spawnTimer = 0;
    }
    speedFactor += SPEED_INCREMENT * (dt / 1000);
    score += dt / 1000;

    // Game logic
    handleInput();
    player.update();
    updateAsteroids(dt);
    updateStars(dt);
    checkCollisions();

    // Render
    // draw background starfield
    drawStars();
    // draw entities
    player.draw();
    drawAsteroids();
    // Score display
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 20);

    requestAnimationFrame(loop);
  }

  // Start the loop
  requestAnimationFrame(loop);
})();
