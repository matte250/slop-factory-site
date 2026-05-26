// Simple top‑down starship escape game
// Canvas with id "game" must exist in the surrounding HTML

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas element #game not found');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // --- Game state -------------------------------------------------
  const ship = {
    x: width / 2,
    y: height - 40,
    radius: 10,
    speed: 3,
    shield: 100,
    fuel: 100,
    dx: 0,
    dy: 0,
  };
  // starfield background
  const stars = [];
  for (let i = 0; i < 150; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.7 + 0.3,
    });
  }

  const asteroids = [];
  const fuels = [];
  let score = 0;
  let gameOver = false;

  // --- Helper functions -------------------------------------------
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnAsteroid() {
    const size = rand(8, 20);
    asteroids.push({
      x: rand(size, width - size),
      y: -size,
      radius: size,
      speed: rand(1, 3),
    });
  }

  function spawnFuel() {
    const size = 8;
    fuels.push({
      x: rand(size, width - size),
      y: -size,
      radius: size,
      speed: 1.5,
    });
  }

  function circleCollides(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.hypot(dx, dy);
    return dist < a.radius + b.radius;
  }

  // --- Input ------------------------------------------------------
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  // Load sound effects (place files in a "sounds" folder next to this script)
  const sound = {
    thrust: new Audio('sounds/thrust.mp3'),
    crash: new Audio('sounds/crash.mp3'),
    fuel: new Audio('sounds/fuel.mp3'),
    gameover: new Audio('sounds/gameover.mp3'),
  };
  // Simple volume tweaks
  sound.thrust.volume = 0.3;
  sound.crash.volume = 0.5;
  sound.fuel.volume = 0.4;
  sound.gameover.volume = 0.6;

  function playSound(name) {
    const s = sound[name];
    if (s) {
      s.currentTime = 0;
      s.play().catch(() => {});
    }
  }

  function handleInput() {
    const prevDx = ship.dx;
    const prevDy = ship.dy;
    ship.dx = 0;
    ship.dy = 0;
    if (keys.ArrowLeft) ship.dx = -ship.speed;
    if (keys.ArrowRight) ship.dx = ship.speed;
    if (keys.ArrowUp) ship.dy = -ship.speed;
    if (keys.ArrowDown) ship.dy = ship.speed;
    // Play thrust sound when any movement key is pressed
    if ((ship.dx !== 0 || ship.dy !== 0) && (prevDx === 0 && prevDy === 0)) {
      playSound('thrust');
    }
  }

  // --- Game loop ---------------------------------------------------
  let frame = 0;
  function update() {
    if (gameOver) return;
    frame++;
    handleInput();
    // move ship
    ship.x = Math.max(ship.radius, Math.min(width - ship.radius, ship.x + ship.dx));
    ship.y = Math.max(ship.radius, Math.min(height - ship.radius, ship.y + ship.dy));
    // fuel consumption
    ship.fuel = Math.max(0, ship.fuel - 0.02);
    if (ship.fuel <= 0) ship.shield = 0;

    // spawn obstacles
    if (frame % 60 === 0) spawnAsteroid(); // roughly 1 per second
    if (frame % 300 === 0) spawnFuel(); // every 5 seconds

    // update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.y += a.speed;
      if (a.y - a.radius > height) asteroids.splice(i, 1);
      else if (circleCollides(ship, a)) {
        ship.shield -= 30;
        playSound('crash');
        asteroids.splice(i, 1);
        if (ship.shield <= 0) {
          gameOver = true;
          playSound('gameover');
        }
      }
    }

    // update fuel cells
    for (let i = fuels.length - 1; i >= 0; i--) {
      const f = fuels[i];
      f.y += f.speed;
      if (f.y - f.radius > height) fuels.splice(i, 1);
      else if (circleCollides(ship, f)) {
        ship.fuel = Math.min(100, ship.fuel + 30);
        score += 10;
        playSound('fuel');
        fuels.splice(i, 1);
      }
    }
  }

function draw() {
    // Draw background with stars
    drawBackground();

    // ship (draw as a triangle for more visual interest)
    ctx.fillStyle = '#0af';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - ship.radius);
    ctx.lineTo(ship.x - ship.radius, ship.y + ship.radius);
    ctx.lineTo(ship.x + ship.radius, ship.y + ship.radius);
    ctx.closePath();
    ctx.fill();

    // asteroids
    ctx.fillStyle = '#555';
    asteroids.forEach(a => {
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // fuels
    ctx.fillStyle = '#ff0';
    fuels.forEach(f => {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // HUD and game‑over overlay
    drawHUD();
  }

  // HUD and game over overlay
  function drawHUD() {
    ctx.fillStyle = '#fff';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Fuel: ${Math.round(ship.fuel)}`, 10, 38);
    ctx.fillText(`Shield: ${Math.round(ship.shield)}`, 10, 56);
    if (gameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', width / 2, height / 2);
    }
  }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  // start game
  requestAnimationFrame(loop);
})();
