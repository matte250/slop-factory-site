// Simple arcade game: Space Junk Collector
// Enhanced graphics: gradient background, starfield, ship as triangle, gradient-fueled objects
// Targets a <canvas id="game"> element in the page.
// Controls: ArrowLeft / ArrowRight or mouse move (horizontal).
// Collect falling junk (green) while avoiding asteroids (red).
// 60‑second timer, score displayed in top‑left.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas found.
  const ctx = canvas.getContext('2d');
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after first user interaction
  const resumeAudio = () => { if (audioCtx.state !== 'running') audioCtx.resume(); };
  window.addEventListener('keydown', resumeAudio, {once: true});
  canvas.addEventListener('mousemove', resumeAudio, {once: true});
  function playTone(freq, duration = 0.1, type = 'sine') {
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

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // ----- Game objects -----
  const ship = {
    w: 40,
    h: 20,
    x: WIDTH / 2 - 20,
    y: HEIGHT - 30,
    speed: 6,
    color: '#00f',
    draw() {
      // Draw ship as a blue triangle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(this.x + this.w / 2, this.y);
      ctx.lineTo(this.x, this.y + this.h);
      ctx.lineTo(this.x + this.w, this.y + this.h);
      ctx.closePath();
      ctx.fill();
    },
    move(dx) {
      this.x = Math.max(0, Math.min(WIDTH - this.w, this.x + dx));
    },
  };

  class FallingObject {
    constructor(radius, speed, color, points) {
      this.r = radius;
      this.x = Math.random() * (WIDTH - 2 * radius) + radius;
      this.y = -radius;
      this.speed = speed;
      this.color = color;
      this.points = points; // 0 for asteroids
    }
    update() {
      this.y += this.speed;
    }
    draw() {
      // Radial gradient for nice glow
      const grad = ctx.createRadialGradient(this.x, this.y, this.r * 0.2, this.x, this.y, this.r);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    }
    offScreen() {
      return this.y - this.r > HEIGHT;
    }
  }

  const junkPool = [];
  const asteroidPool = [];

  // ----- Game state -----
  let score = 0;
  let combo = 0;
  let lastCatch = 0;
  let timeLeft = 60; // seconds
  let gameOver = false;
  let lastSpawn = 0;

  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', (e) => (keys[e.key] = true));
  window.addEventListener('keyup', (e) => (keys[e.key] = false));
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    ship.x = Math.max(0, Math.min(WIDTH - ship.w, mx - ship.w / 2));
  });

  // ----- Helpers -----
  function spawnJunk() {
    const radius = 5;
    const speed = 2 + Math.random() * 2;
    junkPool.push(new FallingObject(radius, speed, '#0f0', 10));
  }
  function spawnAsteroid() {
    const radius = 15;
    const speed = 3 + Math.random() * 2;
    asteroidPool.push(new FallingObject(radius, speed, '#f00', 0));
  }
  function updateScore(points) {
    const now = Date.now();
    if (now - lastCatch < 1000) {
      combo += 1;
    } else {
      combo = 1;
    }
    lastCatch = now;
    score += points * combo;
    // Play a short rising tone on each catch
    playTone(300 + combo * 30, 0.08);
  }
  function checkCollisions() {
    // Junk collection
    for (let i = junkPool.length - 1; i >= 0; i--) {
      const j = junkPool[i];
      if (
        j.x + j.r > ship.x &&
        j.x - j.r < ship.x + ship.w &&
        j.y + j.r > ship.y &&
        j.y - j.r < ship.y + ship.h
      ) {
        updateScore(j.points);
        junkPool.splice(i, 1);
      }
    }
    // Asteroid hit
    for (let i = asteroidPool.length - 1; i >= 0; i--) {
      const a = asteroidPool[i];
      if (
        a.x + a.r > ship.x &&
        a.x - a.r < ship.x + ship.w &&
        a.y + a.r > ship.y &&
        a.y - a.r < ship.y + ship.h
      ) {
        gameOver = true;
        // Play descending crash tone
        playTone(200, 0.3, 'sawtooth');
        break;
      }
    }
  }

  function drawHUD() {
    ctx.fillStyle = '#000';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, WIDTH - 80, 20);
    if (combo > 1) {
      ctx.fillText(`Combo x${combo}`, WIDTH / 2 - 30, 20);
    }
  }

  // ----- Main loop -----
  let lastTime = 0;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2 - 60, HEIGHT / 2);
      ctx.fillText(`Final Score: ${score}`, WIDTH / 2 - 80, HEIGHT / 2 + 30);
      return;
    }

    // Update timer
    timeLeft -= delta;
    if (timeLeft <= 0) {
      gameOver = true;
    }

    // Input
    if (keys.ArrowLeft) ship.move(-ship.speed);
    if (keys.ArrowRight) ship.move(ship.speed);

    // Spawn logic (increase difficulty over time)
    lastSpawn += delta;
    const spawnInterval = Math.max(0.3, 1.5 - (60 - timeLeft) / 30); // faster later
    if (lastSpawn > spawnInterval) {
      if (Math.random() < 0.7) spawnJunk();
      else spawnAsteroid();
      lastSpawn = 0;
    }

    // Update objects
    junkPool.forEach((j) => j.update());
    asteroidPool.forEach((a) => a.update());

    // Remove off‑screen objects
    for (let i = junkPool.length - 1; i >= 0; i--) {
      if (junkPool[i].offScreen()) junkPool.splice(i, 1);
    }
    for (let i = asteroidPool.length - 1; i >= 0; i--) {
      if (asteroidPool[i].offScreen()) asteroidPool.splice(i, 1);
    }

    // Collisions
    checkCollisions();

    // Render
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw background gradient and starfield
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ship.draw();
    junkPool.forEach((j) => j.draw());
    asteroidPool.forEach((a) => a.draw());
    drawHUD();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
