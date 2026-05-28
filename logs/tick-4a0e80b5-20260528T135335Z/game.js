// Neon Runner – simple endless runner
// Canvas element with id="game" must exist in the HTML.

(() => {
  const canvas = document.getElementById('game');
  if (!canvas) return console.error('Canvas #game not found');
  const ctx = canvas.getContext('2d');
  // Sound assets (embedded as data URLs)
  const collectSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep
  const crashSound = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // short beep (replace with different tone if desired)
  const bgMusic = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA='); // looped background (placeholder)
  bgMusic.loop = true;
  bgMusic.volume = 0.2;
  bgMusic.play();

  // Full‑screen canvas
  const resize = () => {
    // generate stars for background (once per resize)
    stars = [];
    const starCount = Math.min(200, Math.floor(canvas.width * canvas.height / 8000));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
      });
    }
    // gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  // Game constants
  const SHIP_SIZE = 30;
  const ORB_SIZE = 12;
  const BARRIER_WIDTH = 40;
  const BARRIER_HEIGHT = 120;
  const SPAWN_INTERVAL = 1500; // ms
  const ORB_INTERVAL = 2000;
  const SPEED = 5;
  const GAME_TIME = 60; // seconds

  // State
  const ship = { x: canvas.width / 2, y: canvas.height - SHIP_SIZE * 2, w: SHIP_SIZE, h: SHIP_SIZE };
  let obstacles = [];
  let orbs = [];
  let stars = [];
  let score = 0;
  let timeLeft = GAME_TIME;
  let lastSpawn = 0;
  let lastOrb = 0;
  let lastTick = performance.now();
  let gameOver = false;

  // Input handling
  const keys = {};
  window.addEventListener('keydown', e => (keys[e.key] = true));
  window.addEventListener('keyup', e => (keys[e.key] = false));

  const rectCollision = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const spawnBarrier = () => {
    const x = Math.random() * (canvas.width - BARRIER_WIDTH);
    obstacles.push({ x, y: -BARRIER_HEIGHT, w: BARRIER_WIDTH, h: BARRIER_HEIGHT });
  };

  const spawnOrb = () => {
    const size = ORB_SIZE;
    const x = Math.random() * (canvas.width - size);
    const y = -size;
    orbs.push({ x, y, w: size, h: size });
  };

  const update = (now) => {
    const dt = now - lastTick;
    lastTick = now;
    if (gameOver) return;

    // timer
    timeLeft -= dt / 1000;
    if (timeLeft <= 0) {
      timeLeft = 0;
      gameOver = true;
    }

    // move ship
    if (keys.ArrowLeft) ship.x -= SPEED;
    if (keys.ArrowRight) ship.x += SPEED;
    if (keys.ArrowUp) ship.y -= SPEED;
    if (keys.ArrowDown) ship.y += SPEED;
    // keep inside canvas
    ship.x = Math.max(0, Math.min(canvas.width - ship.w, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height - ship.h, ship.y));

    // spawn entities
    if (now - lastSpawn > SPAWN_INTERVAL) {
      spawnBarrier();
      lastSpawn = now;
    }
    if (now - lastOrb > ORB_INTERVAL) {
      spawnOrb();
      lastOrb = now;
    }

    // update obstacles/orbs
    const moveY = SPEED * (dt / 16);
    obstacles.forEach(o => (o.y += moveY));
    orbs.forEach(o => (o.y += moveY * 0.8));

    // collision detection
    for (const o of obstacles) {
      if (rectCollision(ship, o)) {
        gameOver = true;
        crashSound.play();
        break;
      }
    }
    if (!gameOver) {
      // collect orbs
      orbs = orbs.filter(orb => {
        if (rectCollision(ship, orb)) {
          score += 10;
          collectSound.currentTime = 0;
          collectSound.play();
          return false;
        }
        // remove off‑screen
        return orb.y < canvas.height;
      });
    }
    // remove passed obstacles
    obstacles = obstacles.filter(o => o.y < canvas.height);

    draw();
    if (!gameOver) requestAnimationFrame(update);
    else drawGameOver();
  };

const draw = () => {
    // Clear and draw background gradient
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#001');
    grad.addColorStop(1, '#004');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw stars
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    // neon background grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // ship – neon triangle
    ctx.fillStyle = '#0ff';
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();

    // barriers – neon rectangles
    ctx.fillStyle = '#f0f';
    obstacles.forEach(o => {
      ctx.fillRect(o.x, o.y, o.w, o.h);
    });

    // orbs – neon circles
    ctx.fillStyle = '#ff0';
    orbs.forEach(o => {
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, o.w / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // UI
    ctx.fillStyle = '#fff';
    ctx.font = '20px monospace';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Time: ${Math.ceil(timeLeft)}`, 20, 60);
  };

  const drawGameOver = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = '48px monospace';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '32px monospace';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 30);
  };

  requestAnimationFrame(update);
})();
