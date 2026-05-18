// Asteroid Dodge game
// Canvas with id="game". Ship moves left/right, shoots, asteroids fall.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return; // No canvas found
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Game objects
  const ship = { x: width / 2, y: height - 30, w: 30, h: 20, speed: 5 };
  const bullets = [];
  const asteroids = [];
  const particles = [];
  const stars = [];
  let score = 0;
  let gameOver = false;
  // Audio setup
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playTone(freq, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  }
  function playShootSound() {
    playTone(600, 0.1);
  }
  function playExplosionSound() {
    playTone(200, 0.2);
  }
  // Initialize star field
  initStars();

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; if (audioCtx.state === 'suspended') audioCtx.resume(); if (e.key === ' ' && !gameOver) { shoot(); playShootSound(); } });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  function shoot() {
    bullets.push({ x: ship.x + ship.w/2 - 1, y: ship.y, w: 2, h: 10, speed: 7 });
  }

  function spawnAsteroid() {
    const size = Math.random() * 20 + 10;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, w: size, h: size, speed: Math.random() * 2 + 1 });
  }

  // Initialize star field
  function initStars() {
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
      });
    }
  }

  function drawStars() {
    ctx.fillStyle = 'white';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.r, s.r));
  }

  // Create explosion particles
  function createExplosion(x, y, size) {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 0.5;
      particles.push({
        x: x + size / 2,
        y: y + size / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
      });
    }
  }

  function update() {
    if (gameOver) return;
    // Move ship
    if (keys['ArrowLeft']) ship.x = Math.max(0, ship.x - ship.speed);
    if (keys['ArrowRight']) ship.x = Math.min(width - ship.w, ship.x + ship.speed);

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      b.y -= b.speed;
      if (b.y + b.h < 0) bullets.splice(i, 1);
    }

    // Update asteroids and handle collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      // collision with ship
      if (rectIntersect(a, ship)) { gameOver = true; playExplosionSound(); }
      // collision with bullets
      for (let j = bullets.length - 1; j >= 0; j--) {
        if (rectIntersect(a, bullets[j])) {
          // create explosion at asteroid location
          createExplosion(a.x, a.y, a.w);
          playExplosionSound();
          asteroids.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
      }
      // asteroid reaches bottom
      if (a.y > height) gameOver = true;
    }

    // Update particles (explosions)
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Random spawn
    if (Math.random() < 0.02) spawnAsteroid();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    drawStars();
    // Ship - draw as triangle
    ctx.fillStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x + ship.w / 2, ship.y - ship.h);
    ctx.lineTo(ship.x + ship.w, ship.y);
    ctx.closePath();
    ctx.fill();
    // Bullets - small rectangles
    ctx.fillStyle = 'yellow';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    // Asteroids - draw with radial gradient for depth
    asteroids.forEach(a => {
      const grad = ctx.createRadialGradient(
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 4,
        a.x + a.w / 2,
        a.y + a.h / 2,
        a.w / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.w / 2, a.y + a.h / 2, a.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    // Explosions
    particles.forEach((p, i) => {
      ctx.fillStyle = `rgba(255,165,0,${p.life / p.maxLife})`;
      ctx.fillRect(p.x, p.y, 2, 2);
    });
    // Score
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText('Score: ' + score, 10, 20);
    // Game over
    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.fillText('Game Over', width / 2 - 80, height / 2);
    }
  }

  function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w ||
             r2.x + r2.w < r1.x ||
             r2.y > r1.y + r1.h ||
             r2.y + r2.h < r1.y);
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // Start game loop
  requestAnimationFrame(loop);
})();
