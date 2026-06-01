// Simple Space Survivor game
// Canvas with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) {
    console.error('Canvas with id "game" not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  // Set canvas size to fill its container or use defined size
  canvas.width = canvas.clientWidth || 800;
  // Initialize background stars
  initStars();
  canvas.height = canvas.clientHeight || 600;

  // ----- Ship -----
  // ----- Starfield -----
const starsCount = 200;
const stars = [];
function initStars() {
  stars.length = 0;
  for (let i = 0; i < starsCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
    });
  }
}
function drawStars() {
  ctx.fillStyle = 'white';
  for (const s of stars) {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw background gradient
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#0a0a30'); // dark navy
  grad.addColorStop(1, '#000'); // black
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw asteroid with rotation and irregular shape
function drawAsteroid(a) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.angle);
  ctx.fillStyle = a.color;
  // Create a rough rock shape using polygon with jittered radii
  const points = 8;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const theta = (i / points) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * a.r * 0.3;
    const radius = a.r + jitter;
    const x = Math.cos(theta) * radius;
    const y = Math.sin(theta) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
// ----- Ship -----
// ----- Ship -----
// ----- Ship -----
const ship = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  r: 12, // radius for collision
  angle: 0, // radians
  vx: 0,
  vy: 0,
  thrust: 0.1,
  rotateSpeed: 0.07,
  color: 'white',
  // flag for thrust flame
  thrusting: false,
};

// Draw ship with optional thrust flame
function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  // Ship body
  ctx.fillStyle = ship.color;
  ctx.beginPath();
  ctx.moveTo(ship.r, 0);
  ctx.lineTo(-ship.r, ship.r / 2);
  ctx.lineTo(-ship.r, -ship.r / 2);
  ctx.closePath();
  ctx.fill();
  // Thrust flame
  if (ship.thrusting) {
    ctx.fillStyle = 'orange';
    ctx.beginPath();
    ctx.moveTo(-ship.r, -ship.r / 3);
    ctx.lineTo(-ship.r - 8, 0);
    ctx.lineTo(-ship.r, ship.r / 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

  // ----- Asteroids -----
  const asteroids = [];
  const asteroidSpawnInterval = 1500; // ms
  const maxAsteroidSize = 30;
  const minAsteroidSize = 10;
  let lastSpawn = 0;

  // ----- Input handling -----
  const keys = {};
  // Sound assets
  const thrustSound = new Audio('thrust.mp3');
  thrustSound.loop = true;
  const explosionSound = new Audio('explosion.mp3');
  const bgMusic = new Audio('bgmusic.mp3');
  bgMusic.loop = true;
  bgMusic.volume = 0.3;
  bgMusic.play().catch(() => {}); // start background music silently if allowed

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'ArrowUp') {
      if (thrustSound.paused) {
        thrustSound.currentTime = 0;
        thrustSound.play().catch(() => {});
      }
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
    if (e.code === 'ArrowUp') {
      thrustSound.pause();
      thrustSound.currentTime = 0;
    }
  });

  // ----- Game state -----
  let score = 0;
  let gameOver = false;

    function update(dt) {
      // Update starfield (slow drift)
      for (const s of stars) {
        s.x += (Math.random() - 0.5) * 0.1;
        s.y += (Math.random() - 0.5) * 0.1;
        if (s.x < 0) s.x += canvas.width;
        if (s.x > canvas.width) s.x -= canvas.width;
        if (s.y < 0) s.y += canvas.height;
        if (s.y > canvas.height) s.y -= canvas.height;
      }
      // Rotate asteroids for visual variety
      for (const a of asteroids) {
        a.angle += a.rotateSpeed;
      }


    if (gameOver) return;

    // Ship rotation
    if (keys['ArrowLeft']) ship.angle -= ship.rotateSpeed;
    if (keys['ArrowRight']) ship.angle += ship.rotateSpeed;
    // Ship thrust
    if (keys['ArrowUp']) {
      ship.vx += Math.cos(ship.angle) * ship.thrust;
      ship.vy += Math.sin(ship.angle) * ship.thrust;
      ship.thrusting = true;
    } else {
      ship.thrusting = false;
    }
    // Apply velocity
    ship.x += ship.vx;
    ship.y += ship.vy;
    // Simple friction
    ship.vx *= 0.99;
    ship.vy *= 0.99;

    // Boundary check – losing condition if leaves canvas
    if (
      ship.x < 0 || ship.x > canvas.width ||
      ship.y < 0 || ship.y > canvas.height
    ) {
      gameOver = true; explosionSound.play().catch(()=>{});
    }

    // Spawn asteroids
    if (performance.now() - lastSpawn > asteroidSpawnInterval) {
      spawnAsteroid();
      lastSpawn = performance.now();
    }

    // Update asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const a = asteroids[i];
      a.x += a.vx;
      a.y += a.vy;
      // Remove when off-screen
      if (
        a.x < -a.r || a.x > canvas.width + a.r ||
        a.y < -a.r || a.y > canvas.height + a.r
      ) {
        asteroids.splice(i, 1);
        score++; // survived an asteroid
        continue;
      }
      // Collision with ship
      const dx = a.x - ship.x;
      const dy = a.y - ship.y;
      const dist = Math.hypot(dx, dy);
      if (dist < a.r + ship.r) {
        gameOver = true; explosionSound.play().catch(()=>{});
        break;
      }
    }
  }

  function spawnAsteroid() {
  // Random rotation for visual variety
  const angle = Math.random() * Math.PI * 2;
  const rotateSpeed = (Math.random() - 0.5) * 0.02;
    const r = Math.random() * (maxAsteroidSize - minAsteroidSize) + minAsteroidSize;
    // Random edge
    const edge = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    const speed = Math.random() * 1.5 + 0.5;
    switch (edge) {
      case 0: // top
        x = Math.random() * canvas.width;
        y = -r;
        vx = (Math.random() - 0.5) * speed;
        vy = speed;
        break;
      case 1: // right
        x = canvas.width + r;
        y = Math.random() * canvas.height;
        vx = -speed;
        vy = (Math.random() - 0.5) * speed;
        break;
      case 2: // bottom
        x = Math.random() * canvas.width;
        y = canvas.height + r;
        vx = (Math.random() - 0.5) * speed;
        vy = -speed;
        break;
      case 3: // left
        x = -r;
        y = Math.random() * canvas.height;
        vx = speed;
        vy = (Math.random() - 0.5) * speed;
        break;
    }
    asteroids.push({ x, y, vx, vy, r, color: 'gray', angle, rotateSpeed });
  }

  function draw() {
    // Clear
    // Draw background gradient
    drawBackground();
    // Draw starfield background
    drawStars();

    // Ship
    drawShip();

    // Asteroids
    for (const a of asteroids) {
      drawAsteroid(a);
    }

    // UI
    ctx.fillStyle = 'white';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Score: ${score}`, 10, 20);
    if (gameOver) {
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
    }
  }

  let lastTime = 0;
  function loop(timestamp) {
    const dt = timestamp - lastTime;
    lastTime = timestamp;
    update(dt);
    draw();
    if (!gameOver) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
