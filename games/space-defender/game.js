// Simple top‑down space shooter based on IDEA.md
// Canvas must have id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // no canvas found
  const ctx = canvas.getContext('2d');
  // Set canvas dimensions (fallback if not set in HTML)
  canvas.width = canvas.width || 800;
  canvas.height = canvas.height || 600;

  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }
  function playLaser() { playTone(800, 0.05); }
  function playExplosion() { playTone(200, 0.2); }

  // Game state
  const stars = [];
  const starCount = 100;
  const starSpeed = 0.5;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    });
  }

  const particles = [];

  const player = {
    x: canvas.width / 2,
    y: canvas.height - 50,
    w: 40,
    h: 20,
    speed: 5,
    color: '#0f0',
    health: 3,
  };
  const bullets = [];
  const asteroids = [];
  let score = 0;
  let lastAsteroid = 0;
  const keys = {};

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 10;
    asteroids.push({
      x: Math.random() * (canvas.width - size),
      y: -size,
      r: size,
      speed: Math.random() * 2 + 1,
      color: '#7f7f7f', // grey asteroid
    });
  }

  // Create explosion particles at (x,y)
  function createExplosion(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: '#ff8c00', // orange
      });
    }
  }

  function update(dt) {
    // Player movement
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    // keep inside canvas
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));

    // Shooting
    if (keys[' '] && bullets.length < 10) {
      bullets.push({
        x: player.x + player.w / 2 - 2,
        y: player.y,
        w: 4,
        h: 10,
        speed: 8,
        color: '#ff0',
      });
      playLaser();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
    // Update stars for background scroll
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += starSpeed;
      if (s.y > canvas.height) {
        s.y = 0;
        s.x = Math.random() * canvas.width;
      }
    }

    // Spawn asteroids periodically
    if (Date.now() - lastAsteroid > 800) {
      spawnAsteroid();
      lastAsteroid = Date.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.r > canvas.height) {
        asteroids.splice(i, 1);
        continue;
      }
      // Check collision with player
      if (
        a.x < player.x + player.w &&
        a.x + a.r * 2 > player.x &&
        a.y < player.y + player.h &&
        a.y + a.r * 2 > player.y
      ) {
        player.health -= 1;
        asteroids.splice(i, 1);
        if (player.health <= 0) {
          alert('Game Over! Score: ' + score);
          document.location.reload();
        }
        continue;
      }
      // Check collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const bx = b.x + b.w / 2;
        const by = b.y + b.h / 2;
        const dist = Math.hypot(bx - (a.x + a.r), by - (a.y + a.r));
        if (dist < a.r) {
          // destroy asteroid with explosion particles
          createExplosion(a.x + a.r, a.y + a.r);
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score += 10;
          break;
        }
      }
    }
  }

  function draw() {
    // Draw starfield background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // Player ship (triangle)
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.moveTo(player.x + player.w / 2, player.y);
    ctx.lineTo(player.x, player.y + player.h);
    ctx.lineTo(player.x + player.w, player.y + player.h);
    ctx.closePath();
    ctx.fill();
    // Bullets (small rectangles)
    bullets.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    // Asteroids
    asteroids.forEach(a => {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x + a.r, a.y + a.r, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // Particles (explosions)
    particles.forEach((p, idx) => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2, 2);
      ctx.globalAlpha = 1.0;
    });
    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Health: ' + player.health, 10, 40);
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
