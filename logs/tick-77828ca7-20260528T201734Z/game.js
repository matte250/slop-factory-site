// Simple Asteroid Dodge game
// Canvas with id="game" must exist in the HTML.
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth;
  const h = canvas.height = canvas.clientHeight;
 
  // Audio resources
  const collisionSound = new Audio('https://freesound.org/data/previews/341/341695_5260870-lq.mp3');
  const bgMusic = new Audio('https://freesound.org/data/previews/320/320178_2405350-lq.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  let audioStarted = false;
  // Start background music on first interaction
  function startAudio() {
    if (!audioStarted) {
      bgMusic.play();
      audioStarted = true;
    }
  }
 
  // Ship
  const ship = { w: 30, h: 20, x: w / 2 - 15, y: h - 30, speed: 5 };
 
  // Asteroids and stars
  const asteroids = [];
  const stars = [];
  // Populate starfield
  for (let i = 0; i < 100; i++) {
    stars.push({ x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2 + 1, speed: Math.random() * 0.5 + 0.2 });
  }
  let spawnInterval = 2000; // ms
  let lastSpawn = 0;
  let startTime = performance.now();
  let score = 0;
  let gameOver = false;

  const keys = {};
  window.addEventListener('keydown', e => { keys[e.key] = true; startAudio(); });
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnAsteroid() {
    const size = Math.random() * 30 + 20;
    asteroids.push({ x: Math.random() * (w - size), y: -size, w: size, h: size, speed: 1 + Math.random() * 2 });
  }

  function update(dt) {
    // Ship movement
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    ship.x = Math.max(0, Math.min(w - ship.w, ship.x));

    // Spawn asteroids
    if (performance.now() - lastSpawn > spawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
      // Increase difficulty over time
      spawnInterval = Math.max(500, spawnInterval * 0.98);
    }

    // Move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed * (dt / 16);
      // Remove off‑screen
      if (a.y > h) asteroids.splice(i, 1);
    }

    // Move stars (background)
    for (const s of stars) {
      s.y += s.speed * (dt / 16);
      if (s.y > h) {
        s.y = 0;
        s.x = Math.random() * w;
      }
    }

    // Collision detection
    for (const a of asteroids) {
      if (a.x < ship.x + ship.w && a.x + a.w > ship.x && a.y < ship.y + ship.h && a.y + a.h > ship.y) {
        gameOver = true;
        collisionSound.play();
        break;
      }
    }

    // Score as seconds survived
    score = ((performance.now() - startTime) / 1000).toFixed(1);
  }

  function draw() {
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    // Stars
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    // Ship (triangle)
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Asteroids (circles)
    ctx.fillStyle = '#999';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x + a.w/2, a.y + a.h/2, a.w/2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}s`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f00';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', w / 2, h / 2);
    }
  }

  let lastTime = performance.now();
  function loop() {
    const now = performance.now();
    const dt = now - lastTime;
    lastTime = now;
    if (!gameOver) update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
