// Simple Asteroid Dodge game targeting canvas with id="game"
// Controls: ArrowLeft / ArrowRight or A/D keys

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // generate starfield background
  const starCount = 100;
  const stars = [];
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.5 + 0.5,
    });
  }

  // sound effects (small data URLs)
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // silent placeholder
  const spawnSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const gameOverSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');

  const ship = {
    w: 40,
    h: 20,
    x: width / 2 - 20,
    y: height - 30,
    speed: 5,
    color: '#0ff',
  };

  let asteroids = [];
  const asteroidSpawnInterval = 1000; // ms
  let lastSpawn = 0;

  let health = 3;
  let score = 0;
  let lastTime = 0;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    asteroids.push({
      x: Math.random() * (width - size),
      y: -size,
      w: size,
      h: size,
      speed: Math.random() * 2 + 1,
      color: '#f55',
    });
    // play spawn sound
    spawnSound.currentTime = 0;
    spawnSound.play();
  }

  function update(dt) {
    // ship movement
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));

    // asteroids
    asteroids.forEach(a => a.y += a.speed);
    // update starfield (move stars downward for parallax effect)
    stars.forEach(s => {
      s.y += 0.2; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
    });
    // remove off‑screen
    asteroids = asteroids.filter(a => a.y < height);

    // collision detection
    for (const a of asteroids) {
      if (
        a.x < ship.x + ship.w &&
        a.x + a.w > ship.x &&
        a.y < ship.y + ship.h &&
        a.y + a.h > ship.y
      ) {
        health--;
        // play crash sound
        crashSound.currentTime = 0;
        crashSound.play();
        // remove this asteroid
        a.y = height + 1;
        if (health <= 0) {
          // game over – stop animation
          cancelAnimationFrame(animId);
          // play game over sound
          gameOverSound.currentTime = 0;
          gameOverSound.play();
          alert('Game Over! Score: ' + Math.floor(score));
          return;
        }
      }
    }
    // score as time survived
    score += dt / 1000;
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // starfield
    stars.forEach(s => {
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // asteroids with slight shading
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w * 0.1,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // health bar with gradient
    const healthGrad = ctx.createLinearGradient(0, 0, 0, 10);
    healthGrad.addColorStop(0, '#0f0');
    healthGrad.addColorStop(1, '#050');
    ctx.fillStyle = healthGrad;
    for (let i = 0; i < health; i++) {
      ctx.fillRect(10 + i * 15, 10, 10, 10);
    }

    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score), width - 100, 20);
  }

  let animId;
  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    if (timestamp - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = timestamp;
    }
    update(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
