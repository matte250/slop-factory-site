// Game: Starfall Escape
// Canvas with id="game" is expected in the host HTML.
// Player moves horizontally at the bottom and shoots meteors falling from the top.
// Simple implementation – no external dependencies.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas element with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size (fallback if not set via CSS)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // ----- Game objects -----
  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
    });
  }

  const player = {
    width: 40,
    height: 20,
    x: canvas.width / 2 - 20,
    y: canvas.height - 30,
    speed: 5,
    // ship will be drawn as a triangle, color for outline
    color: '#0f0',
  };

  const bullets = []; // {x, y, r, speed, color}
  const meteors = []; // {x, y, r, speed, color}

  const particles = []; // {x, y, vx, vy, life, maxLife, radius, color}

  // ----- Sound assets -----
  const shootSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short silent placeholder (replace with actual beep)
  const explosionSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');

  function playShoot() { shootSound.currentTime = 0; shootSound.play(); }
  function playExplosion() { explosionSound.currentTime = 0; explosionSound.play(); }
  function playGameOver() { gameOverSound.currentTime = 0; gameOverSound.play(); }


  // ----- Input handling -----
  const keys = {};
  window.addEventListener('keydown', (e) => { keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key] = false; });

  // ----- Helper functions -----
  function rectIntersect(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function spawnMeteor() {
    const r = 15 + Math.random() * 15; // radius 15‑30
    const x = Math.random() * (canvas.width - 2 * r) + r;
    const speed = 1 + Math.random() * 2; // 1‑3 px/frame
    meteors.push({ x, y: -r, r, speed, color: '#a52a2a' });
  }

  // ----- Game loop -----
  let lastSpawn = 0; // meteor spawn timer
  let bulletTimer = 0; // bullet fire timer
  let lastTime = 0;
  let gameOver = false;

  function update(delta) {
    // Player movement
    if (keys['ArrowLeft'] || keys['a']) player.x -= player.speed;
    if (keys['ArrowRight'] || keys['d']) player.x += player.speed;
    // Keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

    // Shooting (space bar) with its own timer
    if (keys[' '] && (performance.now() - bulletTimer > 300)) {
      bullets.push({
        x: player.x + player.width / 2 - 2,
        y: player.y,
        w: 4,
        h: 10,
        speed: 7,
        color: '#ff0',
      });
      playShoot();
      bulletTimer = performance.now();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Spawn meteors periodically using meteor timer
    if (performance.now() - lastSpawn > 800) spawnMeteor();

    // Update meteors and handle collisions
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.y += m.speed;
      const playerBox = { x: player.x, y: player.y, w: player.width, h: player.height };
      const meteorBox = { x: m.x - m.r, y: m.y - m.r, w: m.r * 2, h: m.r * 2 };
      // Player hit
      if (rectIntersect(playerBox, meteorBox)) {
        playGameOver();
        gameOver = true;
      }
      // Bullet hit
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const bulletBox = { x: b.x, y: b.y, w: b.w, h: b.h };
        if (rectIntersect(bulletBox, meteorBox)) {
          // create explosion particles
            for (let p = 0; p < 8; p++) {
              const angle = Math.random() * Math.PI * 2;
              const speed = Math.random() * 1.5 + 0.5;
              particles.push({
                x: m.x,
                y: m.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0,
                maxLife: 30 + Math.random() * 20,
                radius: Math.random() * 2 + 1,
                color: '#ff6600',
              });
            }
            playExplosion();
            bullets.splice(j, 1);
            meteors.splice(i, 1);
            break;
        }
      }
      // Remove off‑screen meteors
      if (m.y - m.r > canvas.height) meteors.splice(i, 1);
    }

    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) particles.splice(i, 1);
    }
  }

  function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw starfield (twinkling)
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw player as triangle ship
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();

    // Draw bullets (small circles)
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw meteors with gradient
    meteors.forEach(m => {
      const grad = ctx.createRadialGradient(m.x, m.y, m.r * 0.2, m.x, m.y, m.r);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, m.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw explosion particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1; // reset

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    if (!gameOver) update(delta);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
