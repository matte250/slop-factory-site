// Minimal endless side‑scrolling game for canvas#game
// Uses arrow keys to move a ship and dodge obstacles.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas with id "game" not found');
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback to 800x600 if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;
  // Sound assets (data URIs)
  const explosionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const backgroundMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  backgroundMusic.loop = true;
  // Start music on first interaction
  window.addEventListener('keydown', () => {
    if (backgroundMusic.paused) backgroundMusic.play();
  }, { once: true });

  // Game state
  const ship = { x: 50, y: canvas.height / 2, w: 30, h: 20, speed: 4 };
  const obstacles = [];
  // Starfield background
  const stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      speed: 0.5 + Math.random() * 1.5,
      radius: Math.random() * 2 + 1,
    });
  }
  // Explosion particles
  const particles = [];
  let keys = {};
  let score = 0;
  let lastSpawn = 0;
  let spawnInterval = 1500; // ms
  let lastTime = performance.now();
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function reset() {
    ship.x = 50;
    ship.y = canvas.height / 2;
    obstacles.length = 0;
    score = 0;
    lastSpawn = 0;
    spawnInterval = 1500;
    gameOver = false;
    requestAnimationFrame(loop);
  }

  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    const y = Math.random() * (canvas.height - size);
    const speed = 2 + Math.random() * 3;
    obstacles.push({ x: canvas.width, y, w: size, h: size, speed });
  }

  function update(dt) { // Update game entities
    // Move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // Clamp within canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // Spawn obstacles
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnObstacle();
      lastSpawn = performance.now();
      // gradually increase difficulty
      if (spawnInterval > 500) spawnInterval -= 20;
    }

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= o.speed;
      // Remove off‑screen
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }
    // Update stars for parallax effect
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = canvas.width;
        s.y = Math.random() * canvas.height;
        s.speed = 0.5 + Math.random() * 1.5;
        s.radius = Math.random() * 2 + 1;
      }
    }
    // Update explosion particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        gameOver = true;
        explosionSound.play();
        // spawn explosion particles
        for (let i = 0; i < 20; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2 + 1;
          particles.push({
            x: ship.x + ship.w / 2,
            y: ship.y + ship.h / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 2 + 1,
            life: 30 + Math.random() * 30,
          });
        }
        break;
      }
    }

    // Update score
    if (!gameOver) score += dt * 0.01;
  }

  function draw() {
    // Clear and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Starfield background (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // Explosion particles
    particles.forEach(p => {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    // Obstacles (asteroids)
    ctx.fillStyle = '#555';
    obstacles.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, Math.min(o.w, o.h) / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Ship (gradient triangle) on top
    const grad = ctx.createLinearGradient(ship.x, ship.y, ship.x + ship.w, ship.y + ship.h);
    grad.addColorStop(0, '#0f0');
    grad.addColorStop(1, '#090');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText('Score: ' + Math.floor(score), 10, 20);
    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 20);
    }
  }

  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) {
      requestAnimationFrame(loop);
    }
  }

  // Restart on Enter key
  window.addEventListener('keydown', e => {
    if (e.key === 'Enter' && gameOver) reset();
  });

  // Start the game
  reset();
})();
