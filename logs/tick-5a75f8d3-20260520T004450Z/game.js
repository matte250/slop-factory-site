// Minimalist "Astro Dodge" canvas game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  // Sound effects
  const thrustAudio = new Audio('https://www.soundjay.com/mechanical/sounds/mechanical-press-1.mp3');
  const crashAudio = new Audio('https://www.soundjay.com/human/sounds/water-splash-01.mp3');
  const pointAudio = new Audio('https://www.soundjay.com/button/sounds/button-16.mp3');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize();
  addEventListener('resize', resize);

  // Player ship
  const ship = { x: canvas.width / 2, y: canvas.height * 0.8, r: 12, velX: 0, speed: 4 };
  const keys = { ArrowLeft: false, ArrowRight: false, ArrowUp: false };
  addEventListener('keydown', e => { if (e.key in keys) keys[e.key] = true; });
  addEventListener('keyup', e => { if (e.key in keys) keys[e.key] = false; });

  // Asteroids
  const asteroids = [];
  let spawnTimer = 0;
  let score = 0;
  let gameOver = false;

  function spawnAsteroid() {
    const radius = 10 + Math.random() * 15;
    const x = Math.random() * (canvas.width - 2 * radius) + radius;
    const y = -radius;
    const speed = 2 + Math.random() * 2;
    asteroids.push({ x, y, r: radius, s: speed });
  }

  function update() {
    if (gameOver) return;
    // Ship movement
    if (keys.ArrowLeft) ship.velX = -ship.speed;
    else if (keys.ArrowRight) ship.velX = ship.speed;
    else ship.velX = 0;
    ship.x += ship.velX;
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
    if (keys.ArrowUp) {
      ship.y -= ship.speed; // boost upward
      // play thrust sound
      thrustAudio.currentTime = 0;
      thrustAudio.play();
    }
    // Keep ship within canvas vertically
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

    // Asteroid movement & spawn
    spawnTimer--;
    if (spawnTimer <= 0) { spawnAsteroid(); spawnTimer = 60; }
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.s;
      // remove off‑screen asteroids and increase score
      if (a.y - a.r > canvas.height) { asteroids.splice(i, 1); score++; pointAudio.currentTime = 0; pointAudio.play(); }
      // collision detection (circle‑triangle approximation)
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) { gameOver = true; crashAudio.play(); }
    }
    // lose if ship leaves canvas vertically (optional)
    if (ship.y - ship.r < 0 || ship.y + ship.r > canvas.height) gameOver = true;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background: dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // moving starfield
    if (!window.stars) {
      window.stars = [];
      for (let i = 0; i < 100; i++) {
        window.stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, sz: Math.random() * 2 + 1, v: Math.random() * 0.5 + 0.2 });
      }
    }
    ctx.fillStyle = '#fff';
    for (const s of window.stars) {
      ctx.fillRect(s.x, s.y, s.sz, s.sz);
      s.y += s.v;
      if (s.y > canvas.height) { s.y = -s.sz; s.x = Math.random() * canvas.width; }
    }
    // ship (gradient triangle with thrust)
    const shipGrad = ctx.createLinearGradient(ship.x - ship.r, ship.y + ship.r, ship.x, ship.y - ship.r);
    shipGrad.addColorStop(0, '#0a0');
    shipGrad.addColorStop(1, '#0f0');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.r);
    ctx.lineTo(ship.x - ship.r, ship.y + ship.r);
    ctx.lineTo(ship.x + ship.r, ship.y + ship.r);
    ctx.closePath();
    ctx.fill();
    // thrust when boosting
    if (keys.ArrowUp) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.r);
      ctx.lineTo(ship.x - ship.r / 2, ship.y + ship.r + ship.r);
      ctx.lineTo(ship.x + ship.r / 2, ship.y + ship.r + ship.r);
      ctx.closePath();
      ctx.fill();
    }
    // asteroids with radial gradient
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(a.x, a.y, a.r * 0.3, a.x, a.y, a.r);
      grad.addColorStop(0, '#aaa');
      grad.addColorStop(1, '#555');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '20px sans-serif';
    ctx.fillText('Score: ' + score, 10, 30);
    // game over overlay
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '48px sans-serif';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
