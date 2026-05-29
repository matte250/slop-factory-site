// Space Collector game
// Canvas with id="game"
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5
    });
  }
  // sounds
  const collectSound = new Audio('assets/jump.wav');
  const crashSound = new Audio('assets/jump.wav');
  const width = canvas.width = canvas.clientWidth || 800;
  const height = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = {
  angle: 0, // radians
    x: width / 2,
    y: height - 40,
    w: 30,
    h: 30,
    speed: 5,
    dx: 0,
    dy: 0,
    draw() {
      // draw ship as a rotated triangle
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
    update() {
      this.x = Math.max(this.w / 2, Math.min(width - this.w / 2, this.x + this.dx));
      this.y = Math.max(this.h / 2, Math.min(height - this.h / 2, this.y + this.dy));
    }
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  const ores = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  function spawnOre() {
    ores.push({
      x: Math.random() * width,
      y: -20,
      r: 10,
      speed: 2 + Math.random() * 2
    });
  }
  function spawnAsteroid() {
    const size = 20 + Math.random() * 30;
    asteroids.push({
      x: Math.random() * width,
      y: -size,
      r: size / 2,
      speed: 1 + Math.random() * 2
    });
  }

  function updateEntities() {
    ores.forEach(o => { o.y += o.speed; });
    asteroids.forEach(a => { a.y += a.speed; });
    // move stars for subtle twinkle effect
    stars.forEach(s => {
      s.y += 0.3;
      s.x += (Math.random() - 0.5) * 0.2;
      if (s.y > height) s.y = 0;
      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
    });
    // Remove off‑screen
    while (ores.length && ores[0].y - ores[0].r > height) ores.shift();
    while (asteroids.length && asteroids[0].y - asteroids[0].r > height) asteroids.shift();
  }

  function checkCollisions() {
    // ship vs ore
    ores.forEach((o, i) => {
      const dx = o.x - ship.x;
      const dy = o.y - ship.y;
      const dist = Math.hypot(dx, dy);
if (dist < o.r + Math.max(ship.w, ship.h) / 2) {
          score++;
          collectSound.currentTime = 0;
          collectSound.play();
          ores.splice(i, 1);
        }
    });
    // ship vs asteroid
    asteroids.forEach(a => {
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + Math.max(ship.w, ship.h) / 2) {
          gameOver = true;
          crashSound.currentTime = 0;
          crashSound.play();
        }
    });
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
    // draw ship
    ship.draw();
// draw stars (background)
      ctx.fillStyle = '#fff';
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      // draw ores with gradient
      ores.forEach(o => {
        const grad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        grad.addColorStop(0, '#fff700');
        grad.addColorStop(1, '#ff0');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });
// draw asteroids with shading
      asteroids.forEach(a => {
        const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.5, '#f44');
        grad.addColorStop(1, '#800');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      });
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 30);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }

  let oreTimer = 0, asteroidTimer = 0;
  function loop(timestamp) {
    if (gameOver) { draw(); return; }
    // input
    ship.dx = 0; ship.dy = 0;
    if (keys['ArrowLeft'] || keys['a']) ship.dx = -ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.dx = ship.speed;
    if (keys['ArrowUp'] || keys['w']) ship.dy = -ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.dy = ship.speed;
    ship.update();
    // spawn
    if (oreTimer > 80) { spawnOre(); oreTimer = 0; }
    if (asteroidTimer > 200) { spawnAsteroid(); asteroidTimer = 0; }
    oreTimer++; asteroidTimer++;
    // update & collisions
    updateEntities();
    checkCollisions();
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
