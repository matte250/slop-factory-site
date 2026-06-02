// Space Runner – minimal canvas game
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;
  // generate simple starfield after dimensions are known
  const STAR_COUNT = 100;
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({ x: Math.random() * WIDTH, y: Math.random() * HEIGHT, r: Math.random() * 2 + 0.5 });
  }
  // audio context for sound effects
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playShoot = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };
  const playExplosion = () => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 150;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  };

  // ---- Game state ----
  const ship = { w: 40, h: 20, x: WIDTH / 2 - 20, y: HEIGHT - 30, speed: 5 };
  const bullets = [];
  const asteroids = [];
  let score = 0;
  let health = 3;
  let left = false, right = false, shooting = false;
  let lastShot = 0, lastAsteroid = 0;

  // ---- Helpers ----
  // helper to draw filled rectangle (fallback)
  const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };

  // draw ship as a simple triangle
  const drawShip = () => {
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
  };

  // draw bullets as circles
  const drawBullets = () => {
    ctx.fillStyle = '#ff0';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + 2, b.y + 5, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // draw asteroids with rotation
  const drawAsteroids = () => {
    ctx.fillStyle = '#f55';
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x + a.size / 2, a.y + a.size / 2);
      ctx.rotate(a.rot || 0);
      ctx.fillRect(-a.size / 2, -a.size / 2, a.size, a.size);
      ctx.restore();
    });
  };
  const drawHUD = () => {
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Health: ${health}`, WIDTH - 100, 20);
  };

  const spawnAsteroid = () => {
    // create asteroid with random rotation angle and speed
    const rot = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.02; // radians per frame
    const size = 20 + Math.random() * 30;
    const x = Math.random() * (WIDTH - size);
    const speed = 1 + Math.random() * 2;
    asteroids.push({ x, y: -size, size, speed, rot, rotSpeed });
  };

  const update = (dt) => {
    // ship movement
    if (left) ship.x = Math.max(0, ship.x - ship.speed);
    if (right) ship.x = Math.min(WIDTH - ship.w, ship.x + ship.speed);

    // shooting
    if (shooting && Date.now() - lastShot > 200) {
      bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y, dy: -7 });
      lastShot = Date.now();
      playShoot();
    }

    // bullets
    bullets.forEach(b => b.y += b.dy);
    while (bullets.length && bullets[0].y < 0) bullets.shift();

    // asteroids
    if (Date.now() - lastAsteroid > 1000) { spawnAsteroid(); lastAsteroid = Date.now(); }
    asteroids.forEach(a => {
    a.y += a.speed;
    a.rot += a.rotSpeed;
  });
    while (asteroids.length && asteroids[0].y > HEIGHT) asteroids.shift();

    // collisions bullet-asteroid
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const a = asteroids[j];
        if (b.x < a.x + a.size && b.x + 4 > a.x && b.y < a.y + a.size && b.y + 10 > a.y) {
          // destroy asteroid with explosion
          const ex = a.x + a.size / 2;
          const ey = a.y + a.size / 2;
          createExplosion(ex, ey);
          playExplosion();
          bullets.splice(i, 1);
          asteroids.splice(j, 1);
          score += 10;
          break;
        }
      }
    }

    // collisions ship-asteroid
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      if (ship.x < a.x + a.size && ship.x + ship.w > a.x && ship.y < a.y + a.size && ship.y + ship.h > a.y) {
        asteroids.splice(i, 1);
        health--;
        if (health <= 0) { alert('Game Over!'); window.location.reload(); }
      }
    }
  };

  // draw background with gradient and stars
  const drawBackground = () => {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // particle system for explosions
  const particles = [];
  const createExplosion = (x, y) => {
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      particles.push({ x, y, dx: Math.cos(angle) * speed, dy: Math.sin(angle) * speed, life: 30 });
    }
  };
  const updateParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }
  };
  const drawParticles = () => {
    ctx.fillStyle = '#ff9';
    particles.forEach(p => {
      ctx.globalAlpha = p.life / 30;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const render = () => {
    drawBackground();
    drawShip();
    drawBullets();
    drawAsteroids();
    drawParticles();
    drawHUD();
  };

  let lastTime = 0;
  const loop = (timestamp) => {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    render();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // ---- Input handling ----
  window.addEventListener('keydown', e => {
    if (e.code === 'ArrowLeft') left = true;
    else if (e.code === 'ArrowRight') right = true;
    else if (e.code === 'Space') shooting = true;
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ArrowLeft') left = false;
    else if (e.code === 'ArrowRight') right = false;
    else if (e.code === 'Space') shooting = false;
  });
})();
