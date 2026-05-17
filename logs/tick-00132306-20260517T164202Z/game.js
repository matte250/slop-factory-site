// Cosmic Collector minimal implementation
// Assumes an existing <canvas id="gameCanvas"></canvas> in the HTML

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.clientWidth || 800;
  canvas.height = canvas.clientHeight || 600;

  const ship = { x: canvas.width / 2, y: canvas.height / 2, r: 15, speed: 3 };
  const keys = {};
  const orbs = [];
  const asteroids = [];
  let score = 0;
  let gameOver = false;

  // Input handling
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  function spawnOrb() {
    const radius = 8;
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 0.5;
    const vy = (Math.random() - 0.5) * 0.5;
    orbs.push({ x, y, vx, vy, r: radius });
  }

  function spawnAsteroid() {
    const radius = 20 + Math.random() * 20;
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    // spawn outside a random edge, aim toward ship
    if (edge === 0) { x = -radius; y = Math.random() * canvas.height; }
    else if (edge === 1) { x = canvas.width + radius; y = Math.random() * canvas.height; }
    else if (edge === 2) { x = Math.random() * canvas.width; y = -radius; }
    else { x = Math.random() * canvas.width; y = canvas.height + radius; }
    const angle = Math.atan2(ship.y - y, ship.x - x);
    const speed = 1 + Math.random() * 1.5;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
    asteroids.push({ x, y, vx, vy, r: radius });
  }

  function update() {
    if (gameOver) return;
    // move ship
    if (keys.ArrowUp) ship.y -= ship.speed;
    if (keys.ArrowDown) ship.y += ship.speed;
    if (keys.ArrowLeft) ship.x -= ship.speed;
    if (keys.ArrowRight) ship.x += ship.speed;
    // keep inside canvas
    ship.x = Math.max(ship.r, Math.min(canvas.width - ship.r, ship.x));
    ship.y = Math.max(ship.r, Math.min(canvas.height - ship.r, ship.y));

    // update orbs
    orbs.forEach(o => { o.x += o.vx; o.y += o.vy; });
    // collect
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dx = o.x - ship.x, dy = o.y - ship.y;
      if (dx * dx + dy * dy < (o.r + ship.r) ** 2) {
        score++;
        orbs.splice(i, 1);
      }
    }

    // update asteroids
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; });
    // check collisions
    for (const a of asteroids) {
      const dx = a.x - ship.x, dy = a.y - ship.y;
      if (dx * dx + dy * dy < (a.r + ship.r) ** 2) {
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ship
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, ship.r, 0, Math.PI * 2);
    ctx.fill();
    // orbs
    ctx.fillStyle = '#ff0';
    for (const o of orbs) {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // asteroids
    ctx.fillStyle = '#f44';
    for (const a of asteroids) {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
    // score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // initial spawns
  setInterval(spawnOrb, 1500);
  setInterval(spawnAsteroid, 3000);
  // start
  requestAnimationFrame(loop);
})();
