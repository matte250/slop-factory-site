// Simple Asteroid Dodge game
// Canvas element with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  const width = (canvas.width = canvas.clientWidth || 400);
  const height = (canvas.height = canvas.clientHeight || 600);

  // Ship definition (drawn as triangle)
  const ship = { w: 40, h: 20, x: width / 2, y: height - 30, speed: 6, color: '#0af' };
  // Sound assets (place audio files in same directory or adjust paths)
  const sounds = {
    thrust: new Audio('thrust.wav'),
    explode: new Audio('explosion.wav'),
    bgm: new Audio('bgm.mp3'),
  };
  // Configure sounds
  sounds.thrust.volume = 0.2;
  sounds.explode.volume = 0.5;
  sounds.bgm.volume = 0.3;
  sounds.bgm.loop = true;
  // Start background music (may be blocked until user interaction in some browsers)
  sounds.bgm.play().catch(() => {});
  let explosionPlayed = false;
  const keys = { left: false, right: false };

  // Asteroids (with rotation)
  const asteroids = []; // each: {x,y,r,s,angle,rotSpeed}
  // Stars for background
  const stars = [];
  const STAR_COUNT = 80;
  const STAR_SPEED = 0.3;
  function initStars() {
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.5,
      });
    }
  }
  initStars();
  let lastSpawn = 0;
  let spawnInterval = 1000; // ms
  let speedInc = 0.02; // increase per second
  let score = 0;
  let gameOver = false;

  // Input handling
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') {
      keys.left = true;
      sounds.thrust.currentTime = 0;
      sounds.thrust.play().catch(() => {});
    }
    if (e.key === 'ArrowRight') {
      keys.right = true;
      sounds.thrust.currentTime = 0;
      sounds.thrust.play().catch(() => {});
    }
  });
  document.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft') keys.left = false;
    if (e.key === 'ArrowRight') keys.right = false;
  });

  function spawnAsteroid() {
    const radius = Math.random() * 15 + 10;
    const x = Math.random() * (width - radius * 2) + radius;
    const speed = 2 + Math.random() * 2 + (score / 1000);
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.04; // radians per frame
    asteroids.push({ x, y: -radius, r: radius, s: speed, angle, rotSpeed });
  }

  function update(dt) {
    // Move stars background
    for (let s of stars) {
      s.y += STAR_SPEED;
      if (s.y > height) {
        s.x = Math.random() * width;
        s.y = 0;
      }
    }
    // ship movement
    if (keys.left) ship.x -= ship.speed;
    if (keys.right) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(width - ship.w / 2, ship.x));

    // spawn asteroids
    if (Date.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = Date.now();
      // gradually increase difficulty
      spawnInterval = Math.max(200, spawnInterval - 10);
    }

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      a.angle += a.rotSpeed;
      // collision detection (simple rectangle-circle)
      const dx = Math.abs(a.x - ship.x);
      const dy = Math.abs(a.y - ship.y);
        if (dx < ship.w / 2 + a.r && dy < ship.h / 2 + a.r) {
          gameOver = true;
          if (!explosionPlayed) {
            sounds.explode.play().catch(() => {});
            explosionPlayed = true;
          }
        }
      // remove off‑screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
    }
    score += dt;
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#003');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ship (drawn as triangle)
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.h / 2);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h / 2);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.closePath();
    ctx.fill();

    // Asteroids with radial shading and rotation
    asteroids.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      const grad = ctx.createRadialGradient(0, 0, a.r * 0.2, 0, 0, a.r);
      grad.addColorStop(0, '#f88');
      grad.addColorStop(1, '#800');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + Math.floor(score / 1000), 10, 20);

    // Game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '32px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let lastTime = performance.now();
  function loop(now) {
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
