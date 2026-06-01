// Stellar Dodge game implementation
// Canvas element with id="game" is expected in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found');
    return;
  }
  const ctx = canvas.getContext('2d');

  // Load sounds (replace src with actual files or data URIs)
  const sounds = {
    crash: new Audio('crash.mp3'), // asteroid hit
    collect: new Audio('collect.mp3'), // star collected
    bg: new Audio('bg.mp3'), // background loop
  };
  // loop background music
  sounds.bg.loop = true;
  sounds.bg.volume = 0.3;
  sounds.bg.play().catch(() => {});

  const width = canvas.width;
  const height = canvas.height;

  // Ship configuration
  const ship = {
    x: width / 2,
    y: height - 40,
    width: 30,
    height: 30,
    speed: 5,
    color: '#00f',
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Asteroid pool
  const asteroids = [];
  const asteroidConfig = {
    spawnInterval: 1500, // ms
    lastSpawn: 0,
    minSize: 20,
    maxSize: 50,
    speed: 2,
    speedIncrease: 0.2,
  };

  // Star pool (collectible points)
  const stars = [];
  const starConfig = {
    spawnInterval: 3000,
    lastSpawn: 0,
    radius: 8,
    speed: 2,
  };

  let score = 0;
  let gameOver = false;

  function reset() {
    ship.x = width / 2;
    ship.y = height - 40;
    asteroids.length = 0;
    stars.length = 0;
    score = 0;
    asteroidConfig.lastSpawn = 0;
    starConfig.lastSpawn = 0;
    gameOver = false;
  }

  function spawnAsteroid(time) {
    if (time - asteroidConfig.lastSpawn < asteroidConfig.spawnInterval) return;
    asteroidConfig.lastSpawn = time;
    const size = Math.random() * (asteroidConfig.maxSize - asteroidConfig.minSize) + asteroidConfig.minSize;
    const x = Math.random() * (width - size);
    asteroids.push({ x, y: -size, size, speed: asteroidConfig.speed });
    // gradually increase speed
    asteroidConfig.speed += asteroidConfig.speedIncrease;
  }

  function spawnStar(time) {
    if (time - starConfig.lastSpawn < starConfig.spawnInterval) return;
    starConfig.lastSpawn = time;
    const x = Math.random() * (width - starConfig.radius * 2) + starConfig.radius;
    stars.push({ x, y: -starConfig.radius, radius: starConfig.radius, speed: starConfig.speed });
  }

  function updateShip() {
    if (keys.ArrowLeft && ship.x - ship.speed > 0) ship.x -= ship.speed;
    if (keys.ArrowRight && ship.x + ship.width + ship.speed < width) ship.x += ship.speed;
    if (keys.ArrowUp && ship.y - ship.speed > 0) ship.y -= ship.speed;
    if (keys.ArrowDown && ship.y + ship.height + ship.speed < height) ship.y += ship.speed;
  }

  function updateObjects() {
    // move asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.size > height) asteroids.splice(i, 1);
    }
    // move stars
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += s.speed;
      if (s.y - s.radius > height) stars.splice(i, 1);
    }
  }

  function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function circleRectIntersect(cx, cy, r, rx, ry, rw, rh) {
    const nearestX = Math.max(rx, Math.min(cx, rx + rw));
    const nearestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < r * r;
  }

  function checkCollisions() {
    // asteroid vs ship -> game over
    for (const a of asteroids) {
      if (rectIntersect(ship.x, ship.y, ship.width, ship.height, a.x, a.y, a.size, a.size)) {
        gameOver = true;
        sounds.crash.play();
        return;
      }
    }
    // star vs ship -> gain points
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
        if (circleRectIntersect(s.x, s.y, s.radius, ship.x, ship.y, ship.width, ship.height)) {
          score += 10;
          sounds.collect.play();
          stars.splice(i, 1);
        }
    }
  }

  function draw() {
    // background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#001');
    bgGrad.addColorStop(1, '#000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // draw ship as triangle
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.width / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.height);
    ctx.lineTo(ship.x + ship.width, ship.y + ship.height);
    ctx.closePath();
    ctx.fill();

    // draw asteroids with shading
    for (const a of asteroids) {
      const grad = ctx.createRadialGradient(
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size * 0.2,
        a.x + a.size / 2,
        a.y + a.size / 2,
        a.size / 2
      );
      grad.addColorStop(0, '#777');
      grad.addColorStop(1, '#222');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(a.x + a.size / 2, a.y + a.size / 2, a.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // draw stars with glow
    for (const s of stars) {
      ctx.fillStyle = '#ff0';
      ctx.shadowColor = '#ff0';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);

    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ff0';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', width / 2, height / 2);
      ctx.font = '20px sans-serif';
      ctx.fillText('Press R to Restart', width / 2, height / 2 + 30);
    }
  }

  function loop(timestamp) {
    if (!gameOver) {
      updateShip();
      spawnAsteroid(timestamp);
      spawnStar(timestamp);
      updateObjects();
      checkCollisions();
    }
    draw();
    requestAnimationFrame(loop);
  }

  // restart handler
  window.addEventListener('keydown', e => {
    if (gameOver && (e.key === 'r' || e.key === 'R')) {
      reset();
    }
  });

  reset();
  requestAnimationFrame(loop);
})();
