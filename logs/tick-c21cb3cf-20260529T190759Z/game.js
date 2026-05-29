// Simple Asteroid Escape game
// Canvas with id="game" is expected in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // sound assets (data URIs)
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // silent placeholder beep
  const spawnSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=');
  const W = canvas.width = canvas.width || 400;
  const H = canvas.height = canvas.height || 600;

  // player ship
  const ship = { w: 40, h: 20, x: W / 2, y: H - 30, speed: 5, dx: 0 };

  // input handling
  const keys = {};
  window.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true; });
  window.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false; });

  // stars background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let spawnInterval = 90; // frames
  let speedInc = 0.02;
  let score = 0;
  let startTime = performance.now();
  let gameOver = false;

  function spawnAsteroid() {
    spawnSound.currentTime = 0;
    spawnSound.play();
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (W - radius * 2) + radius;
    const y = -radius;
    const speed = 2 + Math.random() * 2 + (score / 1000);
    asteroids.push({ x, y, radius, speed });
  }

  function update() {
    // move stars
    stars.forEach(s => {
      s.y += s.speed;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    });
    // player movement
    if (keys['ArrowLeft']) ship.dx = -ship.speed;
    else if (keys['ArrowRight']) ship.dx = ship.speed;
    else ship.dx = 0;
    ship.x = Math.max(0, Math.min(W - ship.w, ship.x + ship.dx));

    // asteroids
    spawnTimer++;
    if (spawnTimer >= spawnInterval) { spawnAsteroid(); spawnTimer = 0; }
    spawnInterval = Math.max(30, spawnInterval - speedInc);
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
      if (
        a.y + a.radius > ship.y &&
        a.x > ship.x && a.x < ship.x + ship.w
      ) {
        crashSound.currentTime = 0;
        crashSound.play();
        gameOver = true;
      }
      // remove if offscreen
      if (a.y - a.radius > H) asteroids.splice(i, 1);
    }

    // score based on time survived
    score = Math.floor((performance.now() - startTime) / 1000);
  }

function draw() {
    // background already filled in update
    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // ship (triangle drawn in update)
    // ship already drawn in its own code block earlier; we'll redraw here
    // ship
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // asteroids with radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.radius * 0.2, a.x, a.y, a.radius);
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', W / 2 - 80, H / 2);
    }
  }
  }

  function loop() {
    if (!gameOver) update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
