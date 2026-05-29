// Asteroid Avoider game – improved graphics
// Canvas with id="game" must exist in the HTML.

(() => {
  // Audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // Ensure audio context is running after user interaction
  window.addEventListener('click', () => audioCtx.resume(), { once: true });
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Create star field background
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }
  function drawStars() {
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Ensure canvas has size (fallback values)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 400;

  const ship = {
    // Ship drawn as a green triangle for better visuals
    x: 30,
    y: canvas.height / 2,
    w: 30,
    h: 30,
    speed: 4,
    dy: 0,
    draw() {
      ctx.fillStyle = '#0f0';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.h / 2);
      ctx.lineTo(this.x - this.w / 2, this.y + this.h / 2);
      ctx.lineTo(this.x + this.w / 2, this.y + this.h / 2);
      ctx.closePath();
      ctx.fill();
    },
    update() {
      this.y = Math.max(this.h / 2, Math.min(canvas.height - this.h / 2, this.y + this.dy));
    },
  };

  const asteroids = [];
  const asteroidSize = { min: 15, max: 40 };
  const spawnInterval = 1500; // ms
  let lastSpawn = 0;
  let gameOver = false;

  function spawnAsteroid() {
    // Play spawn sound (high-pitched beep)
    playTone(600, 0.1);
    const radius = Math.random() * (asteroidSize.max - asteroidSize.min) + asteroidSize.min;
    const y = Math.random() * (canvas.height - radius * 2) + radius;
    const speed = Math.random() * 2 + 2;
    asteroids.push({ x: canvas.width + radius, y, radius, speed });
  }

  function updateAsteroids(delta) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.radius < 0) asteroids.splice(i, 1);
    }
  }

  function drawAsteroids() {
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(1, '#880000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function checkCollision() {
    for (const a of asteroids) {
      const dx = a.x - (ship.x + ship.w / 2);
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.radius + ship.w / 2) return true;
    }
    return false;
  }

  function loop(timestamp) {
  // Update star positions for scrolling effect
  for (const s of stars) {
    s.x -= 0.5;
    if (s.x < 0) s.x = canvas.width;
  }
  if (gameOver) return;
  // Spawn asteroids
  if (timestamp - lastSpawn > spawnInterval) {
    spawnAsteroid();
    lastSpawn = timestamp;
  }
  // Update entities
  ship.update();
  updateAsteroids();
  // Render
  ctx.fillStyle = '#000'; // space background
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
  drawAsteroids();
  ship.draw();
  // Collision detection
  if (checkCollision()) {
    // Play collision sound (low-pitched beep)
    playTone(200, 0.3);
    gameOver = true;
    setTimeout(() => alert('Game Over'), 0);
    return;
  }
  requestAnimationFrame(loop);
}

  // Input handling – arrow keys or W/S
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') ship.dy = -ship.speed;
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') ship.dy = ship.speed;
  });
  window.addEventListener('keyup', e => {
    if (['ArrowUp', 'w', 'W', 'ArrowDown', 's', 'S'].includes(e.key)) ship.dy = 0;
  });

  requestAnimationFrame(loop);
})();
