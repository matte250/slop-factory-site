// Simple top‑down game based on IDEA.md
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Load sound effects (using royalty‑free CDN URLs)
  const sounds = {
    collect: new Audio('https://cdn.jsdelivr.net/gh/johnnyjane/awesome-sfx/collect.wav'),
    hit: new Audio('https://cdn.jsdelivr.net/gh/johnnyjane/awesome-sfx/hit.wav'),
    gameOver: new Audio('https://cdn.jsdelivr.net/gh/johnnyjane/awesome-sfx/gameover.wav')
  };
  // optional volume settings
  sounds.collect.volume = 0.5;
  sounds.hit.volume = 0.5;
  sounds.gameOver.volume = 0.7;
  const w = canvas.width = canvas.clientWidth || 800;
  const h = canvas.height = canvas.clientHeight || 600;

  // ----- Game state -----
  const ship = { x: w / 2, y: h / 2, r: 12, speed: 3, health: 5, score: 0, angle: 0 };
  const keys = {};
  const asteroids = [];
  const orbs = [];
  const stars = []; // background stars
  const AST_COUNT = 8;
  const ORB_COUNT = 5;

  // ----- Helpers -----
  const rand = (min, max) => Math.random() * (max - min) + min;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const spawnAsteroids = () => {
    for (let i = 0; i < AST_COUNT; i++) {
      asteroids.push({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(15, 30),
        vx: rand(-1, 1),
        vy: rand(-1, 1)
      });
    }
  };

  const spawnOrbs = () => {
    for (let i = 0; i < ORB_COUNT; i++) {
      orbs.push({ x: rand(0, w), y: rand(0, h), r: 8 });
    }
  };

  const wrap = obj => {
    if (obj.x < 0) obj.x += w;
    else if (obj.x > w) obj.x -= w;
    if (obj.y < 0) obj.y += h;
    else if (obj.y > h) obj.y -= h;
  };

  const update = () => {
    // compute movement delta for angle
    let dx = 0, dy = 0;
    if (keys['ArrowUp'] || keys['w']) dy -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) dy += ship.speed;
    if (keys['ArrowLeft'] || keys['a']) dx -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) dx += ship.speed;
    // apply movement
    ship.x += dx;
    ship.y += dy;
    // update angle if moving
    if (dx !== 0 || dy !== 0) ship.angle = Math.atan2(dy, dx);
    wrap(ship);

    // ship movement
    if (keys['ArrowUp'] || keys['w']) ship.y -= ship.speed;
    if (keys['ArrowDown'] || keys['s']) ship.y += ship.speed;
    if (keys['ArrowLeft'] || keys['a']) ship.x -= ship.speed;
    if (keys['ArrowRight'] || keys['d']) ship.x += ship.speed;
    wrap(ship);

    // asteroids move
    asteroids.forEach(a => { a.x += a.vx; a.y += a.vy; wrap(a); });

    // collisions ship‑asteroid
    asteroids.forEach(a => {
      if (dist(ship, a) < ship.r + a.r) {
        ship.health = Math.max(0, ship.health - 1);
        // reposition asteroid
        a.x = rand(0, w); a.y = rand(0, h);
      }
    });

    // collisions ship‑orb
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (dist(ship, o) < ship.r + o.r) {
        ship.score++;
        // respawn orb
        o.x = rand(0, w); o.y = rand(0, h);
      }
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);

    // ship (triangle)
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.r);
    ctx.lineTo(ship.r, ship.r);
    ctx.lineTo(-ship.r, ship.r);
    ctx.closePath();
    ctx.fillStyle = '#0f0';
    ctx.fill();
    ctx.restore();

    // asteroids
    ctx.fillStyle = '#777';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // orbs
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '16px monospace';
    ctx.fillText(`Score: ${ship.score}`, 10, 20);
    ctx.fillText(`Health: ${ship.health}`, 10, 40);
  };

  const loop = () => {
    if (ship.health <= 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f00';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', w / 2, h / 2);
      return; // stop animation
    }
    update();
    draw();
    requestAnimationFrame(loop);
  };

  // input handling
  addEventListener('keydown', e => (keys[e.key] = true));
  addEventListener('keyup', e => (keys[e.key] = false));

  // initialise
  spawnAsteroids();
  spawnOrbs();
  requestAnimationFrame(loop);
})();
