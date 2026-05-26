// Canvas Asteroid Dodge game
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Sound assets (replace data URIs with actual files if desired)
  const bgMusic = new Audio('data:audio/ogg;base64,T2dnUwACAAAAAAAAAABVDwAAAAAAAABJRU5ErkJggg=='); // placeholder silent audio
  bgMusic.loop = true;
  const collideSound = new Audio('data:audio/wav;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAACABAAZGF0YQAAAAA='); // placeholder beep

  // Ship definition
  const ship = { x: width / 2, y: height - 30, w: 20, h: 20, speed: 4 };
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  // Starfield
  const stars = [];
  const starCount = 100;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      bright: Math.random() < 0.2,
    });
  }
  let lastSpawn = 0;
  const spawnInterval = 800; // ms

  let startTime = null;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (width - radius * 2) + radius;
    const speedY = 1 + Math.random() * 2;
    const speedX = (Math.random() - 0.5) * 1.5;
    asteroids.push({ x, y: -radius, r: radius, vx: speedX, vy: speedY });
  }

  function rectCircleCollide(rect, circle) {
    const distX = Math.abs(circle.x - rect.x - rect.w / 2);
    const distY = Math.abs(circle.y - rect.y - rect.h / 2);
    if (distX > rect.w / 2 + circle.r) return false;
    if (distY > rect.h / 2 + circle.r) return false;
    if (distX <= rect.w / 2) return true;
    if (distY <= rect.h / 2) return true;
    const dx = distX - rect.w / 2;
    const dy = distY - rect.h / 2;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  function update(dt) {
    // ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    // keep within bounds
    ship.x = Math.max(0, Math.min(width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(height - ship.h, ship.y));

    // spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // remove off-screen
      if (a.y - a.r > height) asteroids.splice(i, 1);
      // collision
      if (rectCircleCollide(ship, a)) {
        gameOver = true;
        collideSound.play();
      }
    }

    // update stars (scroll down for parallax effect)
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += 0.5; // slow drift
      if (s.y > height) {
        s.y = 0;
        s.x = Math.random() * width;
      }
      // occasional twinkle
      if (Math.random() < 0.01) s.bright = !s.bright;
    }
  }

  function draw() {
    // background – black with starfield
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, width, height);
    // draw stars
    stars.forEach(s => {
      ctx.fillStyle = s.bright ? 'white' : 'rgba(255,255,255,0.5)';
      ctx.fillRect(s.x, s.y, 1, 1);
    });
    // ship – triangular with gradient
    ctx.save();
    const shipGradient = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    shipGradient.addColorStop(0, '#00ffff');
    shipGradient.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGradient;
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.beginPath();
    ctx.moveTo(0, -ship.h / 2);
    ctx.lineTo(-ship.w / 2, ship.h / 2);
    ctx.lineTo(ship.w / 2, ship.h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // asteroids – radial gradient
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.2, a.x, a.y, a.r);
      grad.addColorStop(0, '#888888');
      grad.addColorStop(1, '#222222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // score
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${elapsed}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '24px monospace';
      ctx.fillText('Game Over', width / 2 - 60, height / 2);
    }
  }

  let musicStarted = false;
  function loop(timestamp) {
    if (!startTime) startTime = timestamp;
    // start background music once
    if (!musicStarted) {
      bgMusic.play().catch(() => {});
      musicStarted = true;
    }
    const dt = timestamp - (lastFrame ?? timestamp);
    lastFrame = timestamp;
    if (!gameOver) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw(); // final frame with Game Over
    }
  }
  let lastFrame = null;
  requestAnimationFrame(loop);
})();
