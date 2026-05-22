// Nebula Runner – simple endless runner
// Target canvas with id="game"

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Sound effects
  const sounds = {
    // short beep for collision
    collision: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAA=='),
    // lower tone for game over
    gameOver: new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAA=='),
  };
    // ensure sounds can overlap
  sounds.collision.preload = 'auto';
  sounds.gameOver.preload = 'auto';
  // point sound
  sounds.point = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAA==');
  sounds.point.preload = 'auto';


  // size canvas to fill window and initialize stars
  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // repopulate starfield on resize
    stars.length = 0;
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.2,
      });
    }
  };
  // starfield array
  const stars = [];
  resize();
  window.addEventListener('resize', resize);

  // Ship definition
  const ship = {
    x: canvas.width * 0.1,
    y: canvas.height / 2,
    w: 30,
    h: 20,
    speed: 4,
    color: '#0ff',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  let lastSpawn = 0;

  const random = (min, max) => Math.random() * (max - min) + min;

  function spawnAsteroid() {
    const size = random(20, 50);
    asteroids.push({
      x: canvas.width + size,
      y: random(0, canvas.height - size),
      w: size,
      h: size,
      speed: random(2, 6),
      color: '#888',
    });
  }

  // Collision detection (AABB)
  function collides(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  let gameOver = false;
  let score = 0;
  let lastTime = 0;

  function update(dt) {
  // move stars for parallax background
  for (const s of stars) {
    s.x -= s.speed;
    if (s.x < 0) {
      s.x = canvas.width;
      s.y = Math.random() * canvas.height;
    }
  }
    // ship movement
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep inside bounds
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // spawn asteroids
    if (Date.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x -= a.speed;
      if (a.x + a.w < 0) {
        asteroids.splice(i, 1);
        score++;
        sounds.point.currentTime = 0;
        sounds.point.play();
        continue;
      }
      if (collides(ship, a)) {
        if (!gameOver) {
          sounds.collision.currentTime = 0;
          sounds.collision.play();
          sounds.gameOver.currentTime = 0;
          sounds.gameOver.play();
        }
        gameOver = true;
      }
    }
  }

  function draw() {
    // clear with dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw starfield
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw ship (triangle) with glow
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // draw asteroids
    for (const a of asteroids) {
      ctx.fillStyle = a.color;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    if (!gameOver) update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
