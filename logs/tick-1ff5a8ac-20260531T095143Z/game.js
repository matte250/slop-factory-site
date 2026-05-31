// Minimal Canvas Escape game
// Assumes an existing <canvas id="game"></canvas> in the HTML.
(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const WIDTH = canvas.width = 400;
  const HEIGHT = canvas.height = 600;

  // Sound effects (embedded short wav data)
  const boostSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg');
  const crashSound = new Audio('data:audio/wav;base64,UklGRhYAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRAAAAD///8AAAA=');

  // Ship state
  const ship = {
    x: 50,
    y: HEIGHT / 2,
    w: 20,
    h: 20,
    vy: 0,
    radius: 10,
  };
  const GRAVITY = 0.4;
  const BOOST = -8;

  // Background stars
  const stars = [];
  const STAR_COUNT = 80;
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.5,
      speed: 0.2 + Math.random() * 0.3,
    });
  }

  // Obstacles (asteroids)
  const obstacles = [];
  const OBSTACLE_SPACING = 1200; // ms
  const OBSTACLE_SPEED = 3;
  let lastObstacle = 0;

  let score = 0;
  let startTime = null;
  let running = true;

  function reset() {
    ship.y = HEIGHT / 2;
    ship.vy = 0;
    obstacles.length = 0;
    lastObstacle = 0;
    score = 0;
    startTime = null;
    running = true;
    requestAnimationFrame(frame);
  }

  function addObstacle() {
    // Random size, vertical position, and rotation
    const h = 30 + Math.random() * 70;
    const y = Math.random() * (HEIGHT - h);
    const angle = Math.random() * Math.PI * 2;
    const rotSpeed = (Math.random() - 0.5) * 0.1; // radians per frame
    obstacles.push({ x: WIDTH, y, w: 20, h, angle, rotSpeed });
  }

  function update(dt) {
    // Ship physics
    ship.vy += GRAVITY;
    ship.y += ship.vy;

    // Bounds check (top only, bottom triggers game over)
    if (ship.y < 0) ship.y = 0;
    if (ship.y + ship.h > HEIGHT) {
      running = false;
      crashSound.currentTime = 0;
      crashSound.play();
    }

    // Move background stars for parallax effect
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.x -= s.speed;
      if (s.x < 0) {
        s.x = WIDTH;
        s.y = Math.random() * HEIGHT;
      }
    }

    // Obstacles movement
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= OBSTACLE_SPEED;
      if (o.x + o.w < 0) obstacles.splice(i, 1);
    }

    // Collision detection
    for (const o of obstacles) {
      if (
        ship.x < o.x + o.w &&
        ship.x + ship.w > o.x &&
        ship.y < o.y + o.h &&
        ship.y + ship.h > o.y
      ) {
        running = false;
        crashSound.currentTime = 0;
        crashSound.play();
        break;
      }
    }

    // Add new obstacles
    if (Date.now() - lastObstacle > OBSTACLE_SPACING) {
      addObstacle();
      lastObstacle = Date.now();
    }

    // Score is elapsed time in seconds
    if (running) {
      const now = Date.now();
      if (!startTime) startTime = now;
      score = ((now - startTime) / 1000).toFixed(1);
    }
  }

  function draw() {
    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    bgGrad.addColorStop(0, '#001d3d');
    bgGrad.addColorStop(1, '#000814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw stars (parallax)
    ctx.fillStyle = '#fff';
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw ship (triangle)
    ctx.save();
    ctx.translate(ship.x + ship.w / 2, ship.y + ship.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(-ship.radius, -ship.radius);
    ctx.lineTo(ship.radius, 0);
    ctx.lineTo(-ship.radius, ship.radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw obstacles (rotating asteroids)
    ctx.fillStyle = '#a52a2a'; // brownish asteroid
    for (const o of obstacles) {
      ctx.save();
      ctx.translate(o.x + o.w / 2, o.y + o.h / 2);
      o.angle += o.rotSpeed;
      ctx.rotate(o.angle);
      ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h);
      ctx.restore();
    }

    // Draw score
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}s`, 10, 20);

    // Game over overlay
    if (!running) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif';
      ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2 - 20);
      ctx.font = '18px sans-serif';
      ctx.fillText('Click to restart', WIDTH / 2, HEIGHT / 2 + 20);
    }
  }

  function frame(timestamp) {
    if (!running) {
      draw();
      return; // stop loop
    }
    update(timestamp);
    draw();
    requestAnimationFrame(frame);
  }

  // Input – boost ship upward on any click/tap
  canvas.addEventListener('mousedown', () => {
    ship.vy = BOOST;
    boostSound.currentTime = 0;
    boostSound.play();
  });
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    ship.vy = BOOST;
    boostSound.currentTime = 0;
    boostSound.play();
  });

  // Restart on click after game over
  canvas.addEventListener('click', () => {
    if (!running) reset();
  });

  // Start the game
  requestAnimationFrame(frame);
})();
