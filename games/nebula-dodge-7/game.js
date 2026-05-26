// Nebula Dodge – Enhanced graphics
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Starfield background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.5 + 0.2
    });
  }

  // Player ship
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    w: 30,
    h: 40,
    speed: 5,
    color: 'cyan'
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  // Obstacles
  const obstacles = [];
  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    obstacles.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      color: 'orange'
    });
  }

  let frames = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // Move ship with arrows
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(WIDTH - ship.w / 2, ship.x));

    // Update stars
    for (const s of stars) {
      s.y += s.speed;
      if (s.y > HEIGHT) {
        s.y = 0;
        s.x = Math.random() * WIDTH;
      }
    }

    // Spawn obstacles periodically
    if (frames % 60 === 0) spawnObstacle();
    frames++;

    // Move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      o.angle += o.rotSpeed;
      if (o.y > HEIGHT) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x &&
          ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#000020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Stars
    ctx.fillStyle = 'white';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ship with gradient and thrust
    const shipGrad = ctx.createLinearGradient(0, ship.y, 0, ship.y + ship.h);
    shipGrad.addColorStop(0, '#00ffff');
    shipGrad.addColorStop(1, '#0066ff');
    ctx.fillStyle = shipGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    // Thrust flame when moving
    if (keys['ArrowLeft'] || keys['ArrowRight']) {
      ctx.fillStyle = 'orange';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y + ship.h);
      ctx.lineTo(ship.x - 5, ship.y + ship.h + 15);
      ctx.lineTo(ship.x + 5, ship.y + ship.h + 15);
      ctx.closePath();
      ctx.fill();
    }

    // Obstacles with rotation and glow
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      ctx.rotate(o.angle);
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = canvas.clientWidth || 800;
  const HEIGHT = canvas.height = canvas.clientHeight || 600;

  // Player ship
  const ship = {
    x: WIDTH / 2,
    y: HEIGHT - 60,
    w: 30,
    h: 40,
    speed: 5,
    color: 'cyan'
  };

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    ship.x = e.clientX - rect.left;
  });

  // Obstacles
  const obstacles = [];
  function spawnObstacle() {
    const size = Math.random() * 30 + 20;
    obstacles.push({
      x: Math.random() * (WIDTH - size),
      y: -size,
      w: size,
      h: size,
      speed: 2 + Math.random() * 2,
      color: 'orange'
    });
  }

  let frames = 0;
  let gameOver = false;

  function update() {
    if (gameOver) return;
    // move ship with arrows
    if (keys['ArrowLeft']) ship.x -= ship.speed;
    if (keys['ArrowRight']) ship.x += ship.speed;
    ship.x = Math.max(ship.w / 2, Math.min(WIDTH - ship.w / 2, ship.x));

    // spawn obstacles periodically
    if (frames % 60 === 0) spawnObstacle();
    frames++;

    // move obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.y += o.speed;
      // remove off‑screen
      if (o.y > HEIGHT) obstacles.splice(i, 1);
    }

    // collision detection
    for (const o of obstacles) {
      if (ship.x < o.x + o.w && ship.x + ship.w > o.x &&
          ship.y < o.y + o.h && ship.y + ship.h > o.y) {
        gameOver = true;
        break;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // starfield background (simple)
    ctx.fillStyle = '#000020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // ship
    ctx.fillStyle = ship.color;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y);
    ctx.lineTo(ship.x - ship.w / 2, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // obstacles
    for (const o of obstacles) {
      ctx.fillStyle = o.color;
      ctx.fillRect(o.x, o.y, o.w, o.h);
    }

    if (gameOver) {
      ctx.fillStyle = 'red';
      ctx.font = '48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop() {
    update();
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }

  loop();
})();
